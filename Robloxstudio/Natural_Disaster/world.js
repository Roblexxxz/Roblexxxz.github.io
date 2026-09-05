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
        this.ufo = null;
        this.aliens = [];
        this.alienInvasionActive = false;

        // Lava disaster properties
        this.lava = null;
        this.lavaActive = false;
        this.lavaHeight = -6;

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
        const buildings = [
            { x: 0, z: 0, floors: 5, size: 20, color: 0x95a5a6 },
            { x: -32, z: -25, floors: 4, size: 16, color: 0x8e9b9e },
            { x: 32, z: -22, floors: 4, size: 14, color: 0xb87950 },
            { x: -30, z: 29, floors: 3, size: 18, color: 0x668f91 },
            { x: 31, z: 30, floors: 6, size: 16, color: 0xc18f55 }
        ];

        buildings.forEach(building => this.buildBuilding(building));
    }

    buildBuilding({ x: centerX, z: centerZ, floors, size, color }) {
        const heightPerFloor = 5;

        for (let f = 0; f < floors; f++) {
            const y = f * heightPerFloor;
            const slabGeo = new THREE.BoxGeometry(size, 0.5, size);
            const slabMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.6 });
            const slab = new THREE.Mesh(slabGeo, slabMat);
            slab.position.set(centerX, y, centerZ);
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
                const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
                const wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.set(centerX + pos.x, y + heightPerFloor / 2, centerZ + pos.z);
                this.scene.add(wall);
                this.parts.push({ mesh: wall, isStatic: false, velocity: new THREE.Vector3(), broken: false, hp: 80 });
            });

            const tableGeo = new THREE.BoxGeometry(3, 0.2, 5);
            const tableMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad });
            const table = new THREE.Mesh(tableGeo, tableMat);
            table.position.set(centerX + Math.random() * (size - 6) - (size - 6) / 2, y + 0.8, centerZ + Math.random() * (size - 6) - (size - 6) / 2);
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
            // Lowered height from 45 to 10 so high buildings remain safe
            const geo = new THREE.BoxGeometry(1500, 10, 25);
            const mat = new THREE.MeshStandardMaterial({ color: 0x0044cc, transparent: true, opacity: 0.85, roughness: 0.1 });
            this.tsunami = new THREE.Mesh(geo, mat);
            this.tsunami.position.set(0, 0, this.tsunamiProgress);
            this.scene.add(this.tsunami);
        } else if (type === 'lava') {
            this.lavaActive = true;
            this.lavaHeight = -5.5;
            const geo = new THREE.CylinderGeometry(120, 120, 1, 32);
            const mat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff1100, roughness: 0.4 });
            this.lava = new THREE.Mesh(geo, mat);
            this.lava.position.set(0, this.lavaHeight, 0);
            this.scene.add(this.lava);
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
        } else if (type === 'alien') {
            this.alienInvasionActive = true;
            const ufo = new THREE.Group();
            const body = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.MeshStandardMaterial({ color: 0x59636e, metalness: 0.8, roughness: 0.25 }));
            body.scale.y = 0.22;
            const glow = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 0.35, 24), new THREE.MeshBasicMaterial({ color: 0x55ffbb, transparent: true, opacity: 0.8 }));
            glow.position.y = -1.2;
            ufo.add(body, glow);
            ufo.position.set(0, 55, 0);
            this.ufo = ufo;
            this.scene.add(ufo);
            for (let i = 0; i < 5; i++) this.spawnAlien(i);
        }
    }

    update(player = null) {
        if (this.currentDisaster === 'meteor' && Math.random() < 0.12) {
            this.spawnMeteor();
        }
        this.processMeteors();
        this.processTsunami();
        this.processLava(player);
        this.processAcidRain();
        this.processPhysics();
        this.processFire();
        this.processAliens(player);
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
                if (p.hp <= 0) {
                    p.broken = true;
                    p.velocity.z += 0.6;
                    p.velocity.y += 0.1;
                }
            }
        });
    }

    processLava(player) {
        if (!this.lavaActive || !this.lava) return;
        if (this.lavaHeight < 22) {
            this.lavaHeight += 0.03;
            this.lava.position.y = this.lavaHeight;
        }

        if (player && player.isAlive && player.position.y <= this.lavaHeight + 0.5) {
            player.hp -= 1.5;
        }

        this.parts.forEach(p => {
            if (p.isStatic || p.broken) return;
            if (p.mesh.position.y <= this.lavaHeight) {
                p.hp -= 3;
                if (p.hp <= 0) {
                    p.broken = true;
                    p.mesh.material.color.setHex(0x331100);
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

    spawnAlien(index) {
        const alien = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 1.1, 4, 8), new THREE.MeshStandardMaterial({ color: 0x72d572, roughness: 0.7 }));
        const eyes = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 8), new THREE.MeshBasicMaterial({ color: 0x111827 }));
        eyes.scale.set(1, 0.65, 0.35);
        eyes.position.set(0, 1.05, 0.45);
        alien.add(body, eyes);
        const angle = (index / 5) * Math.PI * 2;
        alien.position.set(Math.cos(angle) * 45, 1, Math.sin(angle) * 45);
        this.scene.add(alien);
        this.aliens.push(alien);
    }

    processAliens(player) {
        if (!this.alienInvasionActive || !player || !player.isAlive) return;
        this.aliens.forEach(alien => {
            const direction = new THREE.Vector3().subVectors(player.position, alien.position);
            direction.y = 0;
            if (direction.length() > 2.2) {
                alien.position.add(direction.normalize().multiplyScalar(0.045));
                alien.lookAt(player.position.x, alien.position.y, player.position.z);
            } else {
                player.hp -= 0.45;
            }
        });
        if (this.ufo) {
            const beamDistance = Math.hypot(player.position.x, player.position.z);
            if (beamDistance < 18) {
                player.position.x *= 0.985;
                player.position.z *= 0.985;
                player.velocity.y = Math.max(player.velocity.y, 0.12);
                player.hp -= 0.18;
            }
        }
    }

    reset() {
        this.parts.forEach(p => this.scene.remove(p.mesh));
        this.meteors.forEach(m => this.scene.remove(m.mesh));
        if (this.tsunami) this.scene.remove(this.tsunami);
        if (this.lava) this.scene.remove(this.lava);
        if (this.rainParticles) this.scene.remove(this.rainParticles);
        if (this.ufo) this.scene.remove(this.ufo);
        this.aliens.forEach(alien => this.scene.remove(alien));

        this.parts = [];
        this.meteors = [];
        this.tsunami = null;
        this.lava = null;
        this.rainParticles = null;
        this.ufo = null;
        this.aliens = [];

        this.alienInvasionActive = false;
        this.tsunamiActive = false;
        this.acidRainActive = false;
        this.lavaActive = false;

        this.fireBricks = [];
        this.currentDisaster = 'none';
        this.createMap();
    }
}
    export class CameraJoystick {
    constructor(camera, target = new THREE.Vector3(0, 0, 0)) {
        this.camera = camera;
        this.target = target;
        this.distance = 80;
        this.angleX = 0;
        this.angleY = 0.4;
        this.isDragging = false;
        this.previousTouch = { x: 0, y: 0 };

        this.createUI();
        this.attachEvents();
        this.updateCamera();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            touch-action: none;
            user-select: none;
            z-index: 1000;
        `;

        this.knob = document.createElement('div');
        this.knob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            margin-top: -20px;
            margin-left: -20px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
        `;

        this.container.appendChild(this.knob);
        document.body.appendChild(this.container);
    }

    attachEvents() {
        const start = (x, y) => {
            this.isDragging = true;
            this.previousTouch = { x, y };
        };

        const move = (x, y) => {
            if (!this.isDragging) return;
            const dx = x - this.previousTouch.x;
            const dy = y - this.previousTouch.y;

            this.angleX -= dx * 0.01;
            this.angleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.angleY + dy * 0.01));

            const knobX = Math.max(-30, Math.min(30, dx));
            const knobY = Math.max(-30, Math.min(30, dy));
            this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

            this.previousTouch = { x, y };
            this.updateCamera();
        };

        const end = () => {
            this.isDragging = false;
            this.knob.style.transform = `translate(0px, 0px)`;
        };

        this.container.addEventListener('pointerdown', e => start(e.clientX, e.clientY));
        window.addEventListener('pointermove', e => move(e.clientX, e.clientY));
        window.addEventListener('pointerup', end);
    }

    updateCamera() {
        this.camera.position.x = this.target.x + this.distance * Math.sin(this.angleX) * Math.cos(this.angleY);
        this.camera.position.y = this.target.y + this.distance * Math.sin(this.angleY);
        this.camera.position.z = this.target.z + this.distance * Math.cos(this.angleX) * Math.cos(this.angleY);
        this.camera.lookAt(this.target);
    }
}
