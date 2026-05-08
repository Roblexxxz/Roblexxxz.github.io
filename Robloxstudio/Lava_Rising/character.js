import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Survivor {
    constructor(scene, isNPC = false) {
        this.scene = scene;
        this.isNPC = isNPC;
        this.isAlive = true;
        this.characterGroup = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.gravity = -0.015;
        this.jumpForce = 0.38;
        this.moveSpeed = isNPC ? 0.07 : 0.14;
        this.oofSound = new Audio('../../Content/sounds/roblox-ooof-made-with-Voicemod.mp3');
        this.targetPlatform = null;
        this.createModel();
    }

    createModel() {
        const skin = new THREE.MeshLambertMaterial({ color: this.isNPC ? 0xead9d9 : 0xffdbac });
        const clothes = new THREE.MeshLambertMaterial({ color: this.isNPC ? 0x333333 : 0x00b2ff });
        this.head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skin);
        this.head.position.y = 1.3;
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), clothes);
        const leg = new THREE.BoxGeometry(0.5, 1.4, 0.5);
        this.leftLeg = new THREE.Mesh(leg, clothes);
        this.leftLeg.position.set(-0.3, -1.2, 0);
        this.rightLeg = new THREE.Mesh(leg, clothes);
        this.rightLeg.position.set(0.3, -1.2, 0);
        this.characterGroup.add(this.head, this.torso, this.leftLeg, this.rightLeg);
        this.scene.add(this.characterGroup);
    }

    update(inputKeys, lavaY, platforms, eulerY = 0) {
        if (!this.isAlive) return;
        if (this.isNPC) {
            this.handleNPCLogic(platforms);
        } else {
            this.handleMovement(inputKeys, eulerY);
        }
        this.applyPhysics(platforms);
        this.checkLava(lavaY);
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
        }
    }

    handleNPCLogic(platforms) {
        if (!this.targetPlatform || this.characterGroup.position.y > this.targetPlatform.position.y + 0.5) {
            const up = platforms.filter(p => p.position.y >= this.characterGroup.position.y);
            if (up.length > 0) {
                this.targetPlatform = up.reduce((prev, curr) => 
                    curr.position.distanceTo(this.characterGroup.position) < prev.position.distanceTo(this.characterGroup.position) ? curr : prev
                );
            }
        }
        if (this.targetPlatform) {
            const dir = new THREE.Vector3().subVectors(this.targetPlatform.position, this.characterGroup.position);
            dir.y = 0;
            const dist = dir.length();
            if (dist > 0.3) {
                dir.normalize().multiplyScalar(this.moveSpeed);
                this.characterGroup.position.add(dir);
                this.characterGroup.rotation.y = Math.atan2(dir.x, dir.z);
            }
            if (dist < 4 && this.targetPlatform.position.y > this.characterGroup.position.y + 0.5 && Math.random() > 0.97) {
                this.jump();
            }
        }
    }

    applyPhysics(platforms) {
        this.velocity.y += this.gravity;
        this.characterGroup.position.y += this.velocity.y;
        this.isGrounded = false;
        const pBox = new THREE.Box3().setFromObject(this.characterGroup);
        for (let p of platforms) {
            const b = new THREE.Box3().setFromObject(p);
            if (pBox.intersectsBox(b) && this.velocity.y < 0 && this.characterGroup.position.y > p.position.y) {
                this.characterGroup.position.y = b.max.y + 1.4;
                this.velocity.y = 0;
                this.isGrounded = true;
                break;
            }
        }
    }

    jump() { if (this.isGrounded) { this.velocity.y = this.jumpForce; this.isGrounded = false; } }

    checkLava(lavaY) { if (this.characterGroup.position.y < lavaY + 0.5) this.die(); }

    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.oofSound.play().catch(() => {});
        this.characterGroup.rotation.x = Math.PI / 2;
        if (!this.isNPC) {
            import('./return.js').then(m => m.handleDeath());
        }
    }

    get position() { return this.characterGroup.position; }
}
