import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function applyBaconHair(group, headMesh) {
    const hairGroup = new THREE.Group();
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.85 });

    const meshData = [
        { w: 1.1, h: 0.25, d: 1.1, x: 0, y: 0.45, z: 0 },
        { w: 0.25, h: 0.7, d: 1.1, x: -0.48, y: 0.1, z: 0 },
        { w: 0.25, h: 0.7, d: 1.1, x: 0.48, y: 0.1, z: 0 },
        { w: 1.1, h: 0.7, d: 0.25, x: 0, y: 0.1, z: -0.48 },
        { w: 0.3, h: 0.2, d: 0.9, x: -0.2, y: 0.55, z: 0.1, rx: 0.1, rz: -0.15 },
        { w: 0.3, h: 0.2, d: 0.9, x: 0.2, y: 0.55, z: 0.1, rx: 0.1, rz: 0.15 },
        { w: 0.25, h: 0.15, d: 0.8, x: -0.4, y: 0.5, z: 0.2, rz: -0.3 },
        { w: 0.25, h: 0.15, d: 0.8, x: 0.4, y: 0.5, z: 0.2, rz: 0.3 }
    ];

    meshData.forEach(data => {
        const geo = new THREE.BoxGeometry(data.w, data.h, data.d);
        const mesh = new THREE.Mesh(geo, hairMat);
        mesh.position.set(data.x, data.y, data.z);
        if (data.rx) mesh.rotation.x = data.rx;
        if (data.rz) mesh.rotation.z = data.rz;
        hairGroup.add(mesh);
    });

    headMesh.add(hairGroup);

    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const ctx = faceCanvas.getContext('2d');
    
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(0, 0, 128, 128);
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(30, 45, 14, 22);
    ctx.fillRect(84, 45, 14, 22);
    
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(64, 75, 24, 0, Math.PI, false);
    ctx.stroke();

    const faceTex = new THREE.CanvasTexture(faceCanvas);
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 })
    ];
    
    headMesh.material = materials;
}
