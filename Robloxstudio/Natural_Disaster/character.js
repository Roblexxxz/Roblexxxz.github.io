import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Survivor {
    constructor(scene, isNPC = false) {
        this.scene = scene;
        this.isNPC = isNPC;
        this.isAlive = true;
        this.hp = 100;
        this.characterGroup = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.gravity = -0.014;
        this.jumpForce = 0.36;
        this.moveSpeed = isNPC ? 0.08 : 0.15;
        this.aiTarget = null;
        this.oofSound = new Audio('../../Content/sounds/roblox-ooof-made-with-Voicemod.mp3');
        this.createModel();
    }

    createModel() {
        const skinMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0xe0e0e0 : 0xffdbac, roughness: 0.8 });
        const torsoMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x222222 : 0x00b2ff, roughness: 0.8 });
        const legMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x111111 : 0x333333, roughness: 0.8 });

        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skinMat);
        this.head.position.y = 1.2;
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.6), torsoMat);
        
        const legGeo = new THREE.BoxGeometry(0.5, 1.3, 0.5);
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.35, -1.1, 0);
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.35, -1.1, 0);

        this.characterGroup.add(this.head, this.torso, this.leftLeg, this.rightLeg);
        this.scene.add(this.characterGroup);
    }

    update(inputKeys, world, eulerY = 0) {
        if (!this.isAlive) return;

        if (this.isNPC) {
            this.handleNPCLogic(world);
        } else {
            this.handleMovement(inputKeys, eulerY);
        }

        this.applyPhysics(world.parts);
        this.checkHazards(world);
    }

    handleMovement(keys, eulerY) {
        const move = new THREE.Vector3();
        if (keys['w']) move.z -= 1;
        if (keys['s']) move.z += 1;
        if (keys['a']) move.x -= 1;
        if (keys['d']) move.x += 1;

        if (move.length() > 0) {
            move.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), eulerY);
            this.characterGroup.position.add(move.multiplyScalar(this.moveSpeed));
            this.characterGroup.rotation.y = Math.atan2(move.x, move.z);
        }
        if (keys[' '] && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    handleNPCLogic(world) {
        if (!this.aiTarget || Math.random() > 0.985 || world.currentDisaster !== this.lastDisaster) {
            this.lastDisaster = world.currentDisaster;
            const validParts = world.parts.filter(p => !p.broken);
            
            if (world.currentDisaster === 'tsunami') {
                this.aiTarget = validParts.reduce((highest, curr) => curr.mesh.position.y > highest.mesh.position.y ? curr : highest, validParts);
            } else if (world.currentDisaster === 'meteor') {
                const shelters = validParts.filter(p => p.mesh.position.y > 4 && p.mesh.geometry.type === 'BoxGeometry');
                this.aiTarget = shelters.length > 0 ? shelters[Math.floor(Math.random() * shelters.length)] : validParts[Math.floor(Math.random() * validParts.length)];
            } else {
                this.aiTarget = validParts[Math.floor(Math.random() * validParts.length)];
            }
        }

        if (this.aiTarget && this.aiTarget.mesh) {
            const tPos = this.aiTarget.mesh.position;
            const cPos = this.characterGroup.position;
            const dir = new THREE.Vector3(tPos.x - cPos.x, 0, tPos.z - cPos.z);
            const dist = dir.length();

            if (dist > 1.5) {
                dir.normalize().multiplyScalar(this.moveSpeed);
                this.characterGroup.position.add(dir);
                this.characterGroup.rotation.y = Math.atan2(dir.x, dir.z);
            } else if (tPos.y > cPos.y + 1 && this.isGrounded && Math.random() > 0.9) {
                this.velocity.y = this.jumpForce;
                this.isGrounded = false;
            }
        }
    }

    applyPhysics(parts) {
        this.velocity.y += this.gravity;
        this.characterGroup.position.y += this.velocity.y;
        this.isGrounded = false;

        const charBox = new THREE.Box3().setFromObject(this.characterGroup);
        
        for (let p of parts) {
            const pBox = new THREE.Box3().setFromObject(p.mesh);
            if (charBox.intersectsBox(pBox)) {
                if (p.broken && p.velocity.length() > 0.05) {
                    this.hp -= p.velocity.length() * 45;
                    this.velocity.add(p.velocity.clone().multiplyScalar(0.6));
                }
                if (this.velocity.y < 0 && this.characterGroup.position.y > p.mesh.position.y) {
                    this.characterGroup.position.y = pBox.max.y + 1.2;
                    this.velocity.y = 0;
                    this.isGrounded = true;
                    break;
                }
            }
        }

        if (this.characterGroup.position.y < -4.8) {
            this.hp -= 1.5;
            this.velocity.multiplyScalar(0.8);
        }
    }

    checkHazards(world) {
        if (world.tsunamiActive && world.tsunami) {
            const tBox = new THREE.Box3().setFromObject(world.tsunami);
            const charBox = new THREE.Box3().setFromObject(this.characterGroup);
            if (tBox.intersectsBox(charBox)) {
                this.hp -= 4;
                this.characterGroup.position.z += 0.7;
                this.characterGroup.position.y += 0.1;
            }
        }

        world.fireBricks.forEach(f => {
            if (this.characterGroup.position.distanceTo(f.mesh.position) < 2.5) {
                this.hp -= 2;
            }
        });

        if (this.hp <= 0) this.die();
    }

    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.hp = 0;
        this.oofSound.play().catch(() => {});
        this.characterGroup.rotation.x = Math.PI / 2;
        this.characterGroup.position.y -= 0.4;
    }

    get position() { return this.characterGroup.position; }
}
