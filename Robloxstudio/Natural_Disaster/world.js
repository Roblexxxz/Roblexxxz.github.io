import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.parts = [];
        this.meteors = [];
        this.tsunami = null;
        this.tsunamiActive = false;
        this.tsunamiProgress = 0;
        this.currentDisaster = 'none';
        this.fireBricks = [];
        this.createMap();
    }

    createMap() {
        const islandGeo = new THREE.CylinderGeometry(60, 65, 10, 32);
        const islandMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.9 });
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.y = -5;
        this.scene.add(island);
        this.parts.push({ mesh: island, isStatic: true, velocity: new THREE.Vector3(), broken: false, hp: 99999 });

        const oceanGeo = new THREE.PlaneGeometry(3000, 3000);
        const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0044ff, transparent: true, opacity: 0.6, roughness: 0.2 });
        const ocean = new THREE.Mesh(oceanGeo, oceanMat);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.y = -4.8;
        this.scene.add(ocean);

        this.buildHotel();
        this.buildRadioTower();
    }

    buildHotel() {
        const floors = 3;
        const heightPerFloor = 4.5;
        const size = 18;
        
        for (let f = 0; f < floors; f++) {
            const y = f * heightPerFloor;
            const slabGeo = new THREE.BoxGeometry(size, 0.4, size);
            const slabMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const slab = new THREE.Mesh(slabGeo, slabMat);
            slab.position.set(0, y, 0);
            this.scene.add(slab);
            this.parts.push({ mesh: slab, isStatic: f === 0, velocity: new THREE.Vector3(), broken: false, hp: 100 });

            const wallPositions = [
                { x: 0, z: -size / 2, w: size, d: 0.4 },
                { x: 0, z: size / 2, w: size, d: 0.4 },
                { x: -size / 2, z: 0, w: 0.4, d: size },
                { x: size / 2, z: 0, w: 0.4, d: size }
            ];

            wallPositions.forEach(pos => {
                const wallGeo = new THREE.BoxGeometry(pos.w, heightPerFloor, pos.d);
                const wallMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.7 });
                const wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.set(pos.x, y + heightPerFloor / 2, pos.z);
                this.scene.add(wall);
                this.parts.push({ mesh: wall, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 60 });
            });
        }
    }

    buildRadioTower() {
        const baseGeo = new THREE.BoxGeometry(2, 12, 2);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xcc1111 });
        const towerBase = new THREE.Mesh(baseGeo, baseMat);
        towerBase.position.set(30, 6, 30);
        this.scene.add(towerBase);
        this.parts.push({ mesh: towerBase, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 80 });

        const dishGeo = new THREE.CylinderGeometry(3, 3, 0.5, 16);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(30, 12.5, 30);
        dish.rotation.x = Math.PI / 4;
        this.scene.add(dish);
        this.parts.push({ mesh: dish, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 30 });
    }

    triggerDisaster(type) {
        this.currentDisaster = type;
        if (type === 'tsunami') {
            this.tsunamiActive = true;
            this.tsunamiProgress = -200;
            const geo = new THREE.BoxGeometry(1200, 35, 20);
            const mat = new THREE.MeshStandardMaterial({ color: 0x0066ff, transparent: true, opacity: 0.85, roughness: 0.1 });
            this.tsunami = new THREE.Mesh(geo, mat);
            this.tsunami.position.set(0, 12, this.tsunamiProgress);
            this.scene.add(this.tsunami);
        }
    }

    update() {
        if (this.currentDisaster === 'meteor' && Math.random() < 0.08) {
            this.spawnMeteor();
        }
        this.processMeteors();
        this.processTsunami();
        this.processPhysics();
        this.processFire();
    }

    spawnMeteor() {
        const geo = new THREE.SphereGeometry(1.5, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const mesh = new THREE.Mesh(geo, mat);
        
        const targetX = Math.random() * 100 - 50;
        const targetZ = Math.random() * 100 - 50;
        mesh.position.set(targetX + Math.random() * 30 - 15, 80, targetZ + Math.random() * 30 - 15);
        
        const target = new THREE.Vector3(targetX, 0, targetZ);
        const velocity = new THREE.Vector3().subVectors(target, mesh.position).normalize().multiplyScalar(1.2);
        
        this.scene.add(mesh);
        this.meteors.push({ mesh, velocity });
    }

    processMeteors() {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.mesh.position.add(m.velocity);

            if (m.mesh.position.y <= -5) {
                this.scene.remove(m.mesh);
                this.meteors.splice(i, 1);
                continue;
            }

            const mBox = new THREE.Box3().setFromObject(m.mesh);
            for (let j = 0; j < this.parts.length; j++) {
                const p = this.parts[j];
                if (p.broken) continue;
                const pBox = new THREE.Box3().setFromObject(p.mesh);
                
                if (mBox.intersectsBox(pBox)) {
                    this.explode(m.mesh.position);
                    this.scene.remove(m.mesh);
                    this.meteors.splice(i, 1);
                    break;
                }
            }
        }
    }

    explode(pos) {
        const radius = 9;
        this.parts.forEach(p => {
            if (p.isStatic) return;
            const dist = p.mesh.position.distanceTo(pos);
            if (dist < radius) {
                p.hp -= (radius - dist) * 15;
                if (p.hp <= 0) {
                    p.broken = true;
                    const force = new THREE.Vector3().subVectors(p.mesh.position, pos).normalize().multiplyScalar((radius - dist) * 0.15);
                    p.velocity.add(force);
                    if (Math.random() > 0.4 && !this.fireBricks.includes(p)) {
                        this.fireBricks.push(p);
                        p.mesh.material.color.setHex(0xff3300);
                    }
                }
            }
        });
    }

    processTsunami() {
        if (!this.tsunamiActive || !this.tsunami) return;
        this.tsunamiProgress += 0.8;
        this.tsunami.position.z = this.tsunamiProgress;

        if (this.tsunamiProgress > 200) {
            this.scene.remove(this.tsunami);
            this.tsunami = null;
            this.tsunamiActive = false;
            return;
        }

        const tBox = new THREE.Box3().setFromObject(this.tsunami);
        this.parts.forEach(p => {
            if (p.isStatic || p.broken) return;
            const pBox = new THREE.Box3().setFromObject(p.mesh);
            if (tBox.intersectsBox(pBox)) {
                p.hp -= 2;
                if (p.hp <= 0 || p.mesh.position.y < 12) {
                    p.broken = true;
                    p.velocity.z += 0.4;
                    p.velocity.y += 0.05;
                }
            }
        });
    }

    processPhysics() {
        this.parts.forEach(p => {
            if (p.isStatic) return;
            
            if (p.broken) {
                p.velocity.y -= 0.012;
                p.mesh.position.add(p.velocity);
                p.mesh.rotation.x += p.velocity.z * 0.05;
                p.mesh.rotation.y += p.velocity.x * 0.05;

                if (p.mesh.position.y < -4.6) {
                    p.mesh.position.y = -4.6;
                    p.velocity.set(0, 0, 0);
                }
            } else {
                let dynamicGrounded = false;
                const pBox = new THREE.Box3().setFromObject(p.mesh);
                
                for (let other of this.parts) {
                    if (other === p || other.broken) continue;
                    const oBox = new THREE.Box3().setFromObject(other.mesh);
                    if (pBox.intersectsBox(oBox) && p.mesh.position.y > other.mesh.position.y) {
                        dynamicGrounded = true;
                        break;
                    }
                }
                
                if (!dynamicGrounded && p.mesh.position.y > 0) {
                    p.hp -= 1;
                    if (p.hp <= 0) p.broken = true;
                }
            }
        });
    }

    processFire() {
        this.fireBricks.forEach(p => {
            if (Math.random() > 0.99) {
                p.hp -= 5;
                if (p.hp <= 0) p.broken = true;
            }
        });
    }

    reset() {
        this.parts.forEach(p => this.scene.remove(p.mesh));
        this.meteors.forEach(m => this.scene.remove(m.mesh));
        if (this.tsunami) this.scene.remove(this.tsunami);
        
        this.parts = [];
        this.meteors = [];
        this.tsunami = null;
        this.tsunamiActive = false;
        this.fireBricks = [];
        this.currentDisaster = 'none';
        
        this.createMap();
    }
}
