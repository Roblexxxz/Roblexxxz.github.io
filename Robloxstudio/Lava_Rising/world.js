import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.createBaseplate();
        this.createTower();
        this.createLava();
    }

    createBaseplate() {
        const geo = new THREE.BoxGeometry(200, 1, 200);
        const mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const plate = new THREE.Mesh(geo, mat);
        plate.position.y = -0.5;
        this.scene.add(plate);
        this.platforms.push(plate);
    }

    createTower() {
        const mat = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
        const neonMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
        
        for (let i = 0; i < 60; i++) {
            const isNeon = i % 5 === 0;
            const geo = new THREE.BoxGeometry(isNeon ? 6 : 4, 0.8, isNeon ? 6 : 4);
            const p = new THREE.Mesh(geo, isNeon ? neonMat : mat);
            
            const angle = i * 0.4;
            const radius = 7 + (Math.sin(i * 0.1) * 3);
            
            p.position.set(
                Math.cos(angle) * radius,
                i * 2.2,
                Math.sin(angle) * radius
            );
            
            this.scene.add(p);
            this.platforms.push(p);
        }
    }

    createLava() {
        const geo = new THREE.BoxGeometry(1000, 1, 1000);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xff2200, 
            emissive: 0xff0000, 
            transparent: true, 
            opacity: 0.9 
        });
        this.lava = new THREE.Mesh(geo, mat);
        this.lava.position.y = -5;
        this.scene.add(this.lava);
    }

    updateLava() {
        this.lava.position.y += 0.025;
    }
}
