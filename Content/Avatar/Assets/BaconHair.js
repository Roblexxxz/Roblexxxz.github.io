export function loadBaconHair() {
    const baconGroup = new THREE.Group();
    const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x4e342e });

    const parts = [
        { w: 1.1, h: 0.25, d: 0.4, x: 0, y: 0.55, z: 0 },
        { w: 1.1, h: 0.2, d: 0.3, x: 0, y: 0.5, z: 0.35 },
        { w: 1.1, h: 0.2, d: 0.3, x: 0, y: 0.5, z: -0.35 },
        { w: 0.25, h: 0.6, d: 0.8, x: 0.5, y: 0.1, z: 0 },
        { w: 0.25, h: 0.6, d: 0.8, x: -0.5, y: 0.1, z: 0 }
    ];

    parts.forEach(data => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(data.w, data.h, data.d),
            hairMaterial
        );
        mesh.position.set(data.x, data.y, data.z);
        baconGroup.add(mesh);
    });

    return baconGroup;
}
