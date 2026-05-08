import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Survivor {
    constructor(scene, isNPC = false) {
        this.scene = scene;
        this.isNPC = isNPC;
        this.isAlive = true;
        this.characterGroup = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.gravity = -0.012;
        this.jumpForce = 0.35;
        this.moveSpeed = isNPC ? 0.08 : 0.12;
        this.oofSound = new Audio('../../Content/sounds/roblox-ooof-made-with-Voicemod.mp3');
        this.targetPlatform = null;
        this.createModel();
    }

    createModel() {
        const skinMat = new THREE.MeshLambertMaterial({ color: this.isNPC ? 0xead9d9 : 0xffdbac });
        const shirtMat = new THREE.MeshLambertMaterial({ color: this.isNPC ? 0x333333 : 0x00b2ff });
        this.head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
        this.head.position.y = 1.3;
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), shirtMat);
        this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
        this.leftArm.position.set(-0.8, 0.2, 0);
        this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
        this.rightArm.position.set(0.8, 0.2, 0);
        this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirtMat);
        this.leftLeg.position.set(-0.3, -1.2, 0);
        this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirtMat);
        this.rightLeg.position.set(0.3, -1.2, 0);
        this.characterGroup.add(this.head, this.torso, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);
        this.scene.add(this.characterGroup);
    }

    update(inputKeys, lavaY, worldPlatforms = []) {
        if (!this.isAlive) return;
        if (this.isNPC) {
            this.handleNPCLogic(worldPlatforms);
        } else {
            this.handleMovement(inputKeys);
        }
        this.applyPhysics();
        this.checkLava(lavaY);
    }

    handleMovement(keys) {
        const move = new THREE.Vector3();
        if (keys['w']) move.z -= 1;
        if (keys['s']) move.z += 1;
        if (keys['a']) move.x -= 1;
        if (keys['d']) move.x += 1;
        if (move.length() > 0) {
            move.normalize().multiplyScalar(this.moveSpeed);
            this.characterGroup.position.add(move);
            this.characterGroup.rotation.y = Math.atan2(move.x, move.z);
        }
    }

    handleNPCLogic(worldPlatforms) {
        if (!this.targetPlatform || this.characterGroup.position.y > this.targetPlatform.position.y) {
            const potentialTargets = worldPlatforms.filter(p => p.position.y > this.characterGroup.position.y - 1);
            if (potentialTargets.length > 0) {
                this.targetPlatform = potentialTargets.reduce((prev, curr) => {
                    const distPrev = prev.position.distanceTo(this.characterGroup.position);
                    const distCurr = curr.position.distanceTo(this.characterGroup.position);
                    return distCurr < distPrev ? curr : prev;
                });
            }
        }

        if (this.targetPlatform) {
            const direction = new THREE.Vector3().subVectors(this.targetPlatform.position, this.characterGroup.position);
            const distXZ = new THREE.Vector2(direction.x, direction.z).length();
            
            direction.y = 0;
            direction.normalize();
            
            if (distXZ > 0.5) {
                const move = direction.clone().multiplyScalar(this.moveSpeed);
                this.characterGroup.position.add(move);
                this.characterGroup.rotation.y = Math.atan2(direction.x, direction.z);
            }

            if (distXZ < 3.5 && this.targetPlatform.position.y > this.characterGroup.position.y + 0.5) {
                if (Math.random() > 0.96) this.jump();
            }

            if (distXZ < 1 && this.isGrounded && Math.random() > 0.98) {
                this.jump();
            }
        }
    }

    applyPhysics() {
        this.velocity.y += this.gravity;
        this.characterGroup.position.y += this.velocity.y;
        if (this.characterGroup.position.y <= 1.4) {
            this.characterGroup.position.y = 1.4;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    checkLava(lavaY) {
        if (this.characterGroup.position.y < lavaY + 0.6) {
            this.die();
        }
    }

    die() {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.oofSound.play().catch(() => {});
    this.characterGroup.rotation.x = Math.PI / 2;
    this.characterGroup.position.y -= 0.5;

    if (!this.isNPC) {
        import('./return.js').then(module => {
            module.handleDeath();
        });
    }
}

    get position() { return this.characterGroup.position; }
}
