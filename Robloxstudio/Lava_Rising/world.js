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
        const geo = new THREE.PlaneGeometry(200, 200);
        const mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const plate = new THREE.Mesh(geo, mat);
        plate.rotation.x = -Math.PI / 2;
        plate.position.y = 0;
        this.scene.add(plate);
    }

    createTower() {
        const mat = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
        for (let i = 0; i < 50; i++) {
            const geo = new THREE.BoxGeometry(4, 0.6, 4);
            const p = new THREE.Mesh(geo, mat);
            const angle = i * 0.5;
            const radius = 8;
            p.position.set(Math.cos(angle) * radius, i * 2, Math.sin(angle) * radius);
            this.scene.add(p);
            this.platforms.push(p);
        }
    }

    createLava() {
        const geo = new THREE.BoxGeometry(500, 1, 500);
        const mat = new THREE.MeshLambertMaterial({ color: 0xff4500, transparent: true, opacity: 0.8 });
        this.lava = new THREE.Mesh(geo, mat);
        this.lava.position.y = -5;
        this.scene.add(this.lava);
    }

    updateLava() {
        this.lava.position.y += 0.02;
    }
}
