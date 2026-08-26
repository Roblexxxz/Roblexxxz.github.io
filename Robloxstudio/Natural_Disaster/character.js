import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { applyBaconHair } from '../../Content/Avatar/Assets/BaconHair.js';
import { AvatarAnimator } from '../../Content/Avatar/Animations/animations.js';

export class Survivor {
    constructor(scene, isNPC = false) {
        this.scene = scene;
        this.isNPC = isNPC;
        this.isAlive = true;
        this.hp = 100;
        this.characterGroup = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.gravity = -0.015;
        this.jumpForce = 0.38;
        this.moveSpeed = isNPC ? 0.085 : 0.16;
        this.aiTarget = null;
        this.lastDisaster = 'none';
        this.hostile = false;
        this.attackCooldown = 0;
        this.animator = new AvatarAnimator();
        this.oofSound = new Audio('../../Content/sounds/roblox-ooof-made-with-Voicemod.mp3');
        this.createModel();
    }

    createModel() {
        const skinMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0xdcdde1 : 0xffdbac, roughness: 0.8 });
        const torsoMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x2f3640 : 0x00b2ff, roughness: 0.8 });
        const legMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x1e272e : 0x333333, roughness: 0.8 });
        const armMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x2f3640 : 0x00b2ff, roughness: 0.8 });

        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skinMat);
        this.head.position.y = 1.25;
        this.characterGroup.add(this.head);

        if (!this.isNPC) {
            applyBaconHair(this.characterGroup, this.head);
        }

        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), torsoMat);
        this.torso.position.y = 0.2;
        this.characterGroup.add(this.torso);

        const legGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.35, -1.2, 0);
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.35, -1.2, 0);
        this.characterGroup.add(this.leftLeg, this.rightLeg);

        const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.95, 0.2, 0);
        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(0.95, 0.2, 0);
        this.characterGroup.add(this.leftArm, this.rightArm);
        if (!this.isNPC) this.createSword();

        this.scene.add(this.characterGroup);
    }

    createSword() {
        const sword = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.25, 0.22), new THREE.MeshStandardMaterial({ color: 0xdce6f2, metalness: 0.7, roughness: 0.25 }));
        blade.position.y = 0.7;
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.16), new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.5 }));
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), new THREE.MeshStandardMaterial({ color: 0x6b3f22 }));
        grip.position.y = -0.25;
        sword.add(blade, guard, grip);
        sword.position.set(0.1, -0.25, 0.25);
        sword.rotation.z = -0.35;
        this.rightArm.add(sword);
        this.sword = sword;
    }

    attack(zombies) {
        if (this.isNPC || this.attackCooldown > 0 || !this.isAlive) return;
        const attackDamage = 4;
        const facing = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.characterGroup.rotation.y);
        zombies.filter(zombie => zombie.isNPC && zombie.hostile && zombie.isAlive).forEach(zombie => {
            const offset = new THREE.Vector3().subVectors(zombie.position, this.position);
            if (offset.length() <= 3 && facing.dot(offset.normalize()) > 0.15) zombie.hp -= attackDamage;
        });
        this.attackCooldown = 18;
        this.sword.rotation.z = -1.05;
        setTimeout(() => { if (this.sword) this.sword.rotation.z = -0.35; }, 140);
    }

    update(inputKeys, world, eulerY = 0, target = null) {
        if (!this.isAlive) return;
        if (this.attackCooldown > 0) this.attackCooldown--;

        if (this.isNPC) {
            this.handleNPCLogic(world, target);
        } else {
            this.handleMovement(inputKeys, eulerY);
        }

        this.applyPhysics(world.parts);
        this.checkHazards(world);
        this.animator.animate(this, inputKeys);
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

    jump() {
        if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    handleNPCLogic(world, target) {
        this.hostile = world.currentDisaster === 'zombie';
        this.head.material.color.setHex(this.hostile ? 0x7f8c52 : 0xdcdde1);
        this.torso.material.color.setHex(this.hostile ? 0x6b1f2a : 0x2f3640);
        if (this.hostile && target && target.isAlive) {
            this.aiTarget = target;
        }
        if (!this.hostile && (!this.aiTarget || Math.random() > 0.99 || world.currentDisaster !== this.lastDisaster)) {
            this.lastDisaster = world.currentDisaster;
            const validParts = world.parts.filter(p => !p.broken);
            
            if (world.currentDisaster === 'tsunami') {
                this.aiTarget = validParts.reduce((highest, curr) => curr.mesh.position.y > highest.mesh.position.y ? curr : highest, validParts);
            } else if (world.currentDisaster === 'meteor' || world.currentDisaster === 'acidrain' || world.currentDisaster === 'alien') {
                const shelters = validParts.filter(p => p.mesh.position.y > 4 && p.mesh.geometry.type === 'BoxGeometry');
                this.aiTarget = shelters.length > 0 ? shelters[Math.floor(Math.random() * shelters.length)] : validParts[Math.floor(Math.random() * validParts.length)];
            } else {
                this.aiTarget = validParts[Math.floor(Math.random() * validParts.length)];
            }
        }

        const targetObject = this.aiTarget && (this.aiTarget.mesh || this.aiTarget.characterGroup);
        if (targetObject) {
            const tPos = targetObject.position;
            const cPos = this.characterGroup.position;
            const dir = new THREE.Vector3(tPos.x - cPos.x, 0, tPos.z - cPos.z);
            const dist = dir.length();

            if (dist > 1.8) {
                dir.normalize().multiplyScalar(this.moveSpeed);
                this.characterGroup.position.add(dir);
                this.characterGroup.rotation.y = Math.atan2(dir.x, dir.z);
                this.velocity.x = dir.x;
                this.velocity.z = dir.z;
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
                if (this.hostile && target && target.isAlive) target.hp -= 0.35;
            }

            if (tPos.y > cPos.y + 1 && this.isGrounded && Math.random() > 0.92) {
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
                if (p.broken && p.velocity.length() > 0.08) {
                    this.hp -= p.velocity.length() * 55;
                    this.velocity.add(p.velocity.clone().multiplyScalar(0.7));
                }
                if (this.velocity.y < 0 && this.characterGroup.position.y > p.mesh.position.y) {
                    this.characterGroup.position.y = pBox.max.y + 1.3;
                    this.velocity.y = 0;
                    this.isGrounded = true;
                    break;
                }
            }
        }

        if (this.characterGroup.position.y < -5.8) {
            this.hp -= 2.5;
            this.velocity.multiplyScalar(0.7);
        }
    }

    checkHazards(world) {
        if (world.tsunamiActive && world.tsunami) {
            const tBox = new THREE.Box3().setFromObject(world.tsunami);
            const charBox = new THREE.Box3().setFromObject(this.characterGroup);
            if (tBox.intersectsBox(charBox)) {
                this.hp -= 6;
                this.characterGroup.position.z += 1.1;
                this.characterGroup.position.y += 0.15;
            }
        }

        if (world.acidRainActive) {
            let sheltered = false;
            const cPos = this.characterGroup.position;
            for (let p of world.parts) {
                if (p.broken) continue;
                const pBox = new THREE.Box3().setFromObject(p.mesh);
                if (cPos.x >= pBox.min.x && cPos.x <= pBox.max.x && cPos.z >= pBox.min.z && cPos.z <= pBox.max.z && pBox.min.y > cPos.y) {
                    sheltered = true;
                    break;
                }
            }
            if (!sheltered && Math.random() < 0.15) {
                this.hp -= 1.5;
            }
        }

        world.fireBricks.forEach(f => {
            if (this.characterGroup.position.distanceTo(f.mesh.position) < 3) {
                this.hp -= 3;
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
        this.characterGroup.position.y -= 0.5;
        
        if (!this.isNPC) {
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

    get position() { return this.characterGroup.position; }
}
