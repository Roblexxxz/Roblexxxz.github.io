import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.createEnvironment();
        this.createTower();
        this.createLava();
    }

    createEnvironment() {
        const geo = new THREE.BoxGeometry(200, 1, 200);
        const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const base = new THREE.Mesh(geo, mat);
        base.position.y = -0.5;
        this.scene.add(base);
        this.platforms.push(base);

        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(ambient, sun);
    }

    createTower() {
        for (let i = 0; i < 60; i++) {
            const isNeon = i % 5 === 0;
            const geo = new THREE.BoxGeometry(isNeon ? 6 : 4, 0.8, isNeon ? 6 : 4);
            const mat = new THREE.MeshStandardMaterial({ 
                color: isNeon ? 0x00ffff : 0x444444,
                emissive: isNeon ? 0x00ffff : 0x000000,
                emissiveIntensity: 0.5
            });
            const p = new THREE.Mesh(geo, mat);
            const angle = i * 0.4;
            const radius = 7 + (Math.sin(i * 0.2) * 3);
            p.position.set(Math.cos(angle) * radius, i * 2.2, Math.sin(angle) * radius);
            this.scene.add(p);
            this.platforms.push(p);
        }
    }

    createLava() {
        const geo = new THREE.BoxGeometry(1000, 1, 1000);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, transparent: true, opacity: 0.8 });
        this.lava = new THREE.Mesh(geo, mat);
        this.lava.position.y = -5;
        this.scene.add(this.lava);
    }

    updateLava() {
        this.lava.position.y += 0.025;
    }
}
