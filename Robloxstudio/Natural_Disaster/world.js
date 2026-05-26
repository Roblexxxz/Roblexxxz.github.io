import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.parts = [];
        this.meteors = [];
        this.tsunami = null;
        this.acidRainActive = false;
        this.tsunamiActive = false;
        this.tsunamiProgress = 0;
        this.currentDisaster = 'none';
        this.fireBricks = [];
        this.rainParticles = null;
        this.createMap();
    }

    createMap() {
        const islandGeo = new THREE.CylinderGeometry(70, 75, 12, 32);
        const islandMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.9 });
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.y = -6;
        this.scene.add(island);
        this.parts.push({ mesh: island, isStatic: true, velocity: new THREE.Vector3(), broken: false, hp: 999999 });

        const oceanGeo = new THREE.PlaneGeometry(4000, 4000);
        const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0044ff, transparent: true, opacity: 0.6, roughness: 0.1 });
        const ocean = new THREE.Mesh(oceanGeo, oceanMat);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.y = -5.8;
        this.scene.add(ocean);

        this.buildStructure();
    }

    buildStructure() {
        const floors = 3;
        const heightPerFloor = 5;
        const size = 20;

        for (let f = 0; f < floors; f++) {
            const y = f * heightPerFloor;
            const slabGeo = new THREE.BoxGeometry(size, 0.5, size);
            const slabMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.6 });
            const slab = new THREE.Mesh(slabGeo, slabMat);
            slab.position.set(0, y, 0);
            this.scene.add(slab);
            this.parts.push({ mesh: slab, isStatic: f === 0, velocity: new THREE.Vector3(), broken: false, hp: 120 });

            const wallData = [
                { x: 0, z: -size / 2, w: size, d: 0.6 },
                { x: 0, z: size / 2, w: size, d: 0.6 },
                { x: -size / 2, z: 0, w: 0.6, d: size },
                { x: size / 2, z: 0, w: 0.6, d: size }
            ];

            wallData.forEach(pos => {
                const wallGeo = new THREE.BoxGeometry(pos.w, heightPerFloor, pos.d);
                const wallMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.5 });
                const wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.set(pos.x, y + heightPerFloor / 2, pos.z);
                this.scene.add(wall);
                this.parts.push({ mesh: wall, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 80 });
            });

            const tableGeo = new THREE.BoxGeometry(3, 0.2, 5);
            const tableMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad });
            const table = new THREE.Mesh(tableGeo, tableMat);
            table.position.set(Math.random() * 8 - 4, y + 0.8, Math.random() * 8 - 4);
            this.scene.add(table);
            this.parts.push({ mesh: table, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 40 });

            const legGeo = new THREE.BoxGeometry(0.3, 1.4, 0.3);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
            for (let i = 0; i < 2; i++) {
                const leg = new THREE.Mesh(legGeo, legMat);
                leg.position.set(table.position.x + (i === 0 ? 1 : -1), y + 0.7, table.position.z);
                this.scene.add(leg);
                this.parts.push({ mesh: leg, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 35 });
            }
        }
    }

    triggerDisaster(type) {
        this.currentDisaster = type;
        if (type === 'tsunami') {
            this.tsunamiActive = true;
            this.tsunamiProgress = -250;
            const geo = new THREE.BoxGeometry(1500, 45, 25);
            const mat = new THREE.MeshStandardMaterial({ color: 0x0044cc, transparent: true, opacity: 0.85, roughness: 0.1 });
            this.tsunami = new THREE.Mesh(geo, mat);
            this.tsunami.position.set(0, 15, this.tsunamiProgress);
            this.scene.add(this.tsunami);
        } else if (type === 'acidrain') {
            this.acidRainActive = true;
            const count = 500;
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            for(let i = 0; i < count * 3; i += 3) {
                positions[i] = Math.random() * 200 - 100;
                positions[i+1] = Math.random() * 80 + 20;
                positions[i+2] = Math.random() * 200 - 100;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.4, transparent: true, opacity: 0.7 });
            this.rainParticles = new THREE.Points(geo, mat);
            this.scene.add(this.rainParticles);
        }
    }

    update() {
        if (this.currentDisaster === 'meteor' && Math.random() < 0.12) {
            this.spawnMeteor();
        }
        this.processMeteors();
        this.processTsunami();
        this.processAcidRain();
        this.processPhysics();
        this.processFire();
    }

    spawnMeteor() {
        const geo = new THREE.SphereGeometry(2, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        const mesh = new THREE.Mesh(geo, mat);
        const tx = Math.random() * 120 - 60;
        const tz = Math.random() * 120 - 60;
        mesh.position.set(tx + Math.random() * 20 - 10, 90, tz + Math.random() * 20 - 10);
        const target = new THREE.Vector3(tx, 0, tz);
        const velocity = new THREE.Vector3().subVectors(target, mesh.position).normalize().multiplyScalar(1.5);
        this.scene.add(mesh);
        this.meteors.push({ mesh, velocity });
    }

    processMeteors() {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.mesh.position.add(m.velocity);
            if (m.mesh.position.y <= -6) {
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
        const radius = 12;
        this.parts.forEach(p => {
            if (p.isStatic) return;
            const dist = p.mesh.position.distanceTo(pos);
            if (dist < radius) {
                p.hp -= (radius - dist) * 20;
                if (p.hp <= 0) {
                    p.broken = true;
                    const force = new THREE.Vector3().subVectors(p.mesh.position, pos).normalize().multiplyScalar((radius - dist) * 0.25);
                    p.velocity.add(force);
                    if (Math.random() > 0.5 && !this.fireBricks.includes(p)) {
                        this.fireBricks.push(p);
                        p.mesh.material.color.setHex(0xff5500);
                    }
                }
            }
        });
    }

    processTsunami() {
        if (!this.tsunamiActive || !this.tsunami) return;
        this.tsunamiProgress += 1.2;
        this.tsunami.position.z = this.tsunamiProgress;
        if (this.tsunamiProgress > 250) {
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
                p.hp -= 5;
                if (p.hp <= 0 || p.mesh.position.y < 15) {
                    p.broken = true;
                    p.velocity.z += 0.6;
                    p.velocity.y += 0.1;
                }
            }
        });
    }

    processAcidRain() {
        if (!this.acidRainActive || !this.rainParticles) return;
        const posArr = this.rainParticles.geometry.attributes.position.array;
        for (let i = 1; i < posArr.length; i += 3) {
            posArr[i] -= 0.6;
            if (posArr[i] < -6) {
                posArr[i] = 80;
                posArr[i-1] = Math.random() * 200 - 100;
                posArr[i+1] = Math.random() * 200 - 100;
            }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    processPhysics() {
        this.parts.forEach(p => {
            if (p.isStatic) return;
            if (p.broken) {
                p.velocity.y -= 0.016;
                p.mesh.position.add(p.velocity);
                p.mesh.rotation.x += p.velocity.z * 0.04;
                p.mesh.rotation.y += p.velocity.x * 0.04;
                if (p.mesh.position.y < -5.6) {
                    p.mesh.position.y = -5.6;
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
                    p.hp -= 2;
                    if (p.hp <= 0) p.broken = true;
                }
            }
        });
    }

    processFire() {
        this.fireBricks.forEach(p => {
            if (Math.random() > 0.98) {
                p.hp -= 8;
                if (p.hp <= 0) p.broken = true;
            }
        });
    }

    reset() {
        this.parts.forEach(p => this.scene.remove(p.mesh));
        this.meteors.forEach(m => this.scene.remove(m.mesh));
        if (this.tsunami) this.scene.remove(this.tsunami);
        if (this.rainParticles) this.scene.remove(this.rainParticles);
        this.parts = [];
        this.meteors = [];
        this.tsunami = null;
        this.rainParticles = null;
        this.tsunamiActive = false;
        this.acidRainActive = false;
        this.fireBricks = [];
        this.currentDisaster = 'none';
        this.createMap();
    }
}
