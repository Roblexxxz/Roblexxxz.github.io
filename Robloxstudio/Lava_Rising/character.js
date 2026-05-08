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
        this.moveSpeed = isNPC ? 0.07 : 0.12;
        this.oofSound = new Audio('../../Content/sounds/roblox-ooof-made-with-Voicemod.mp3');
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

    update(inputKeys, lavaY) {
        if (!this.isAlive) return;
        if (this.isNPC) {
            this.handleNPCLogic();
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

    handleNPCLogic() {
        if (Math.random() > 0.985) this.jump();
        const move = new THREE.Vector3(Math.sin(Date.now() * 0.001) * 0.5, 0, -1);
        move.normalize().multiplyScalar(this.moveSpeed);
        this.characterGroup.position.add(move);
        this.characterGroup.rotation.y = Math.atan2(move.x, move.z);
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
    }

    get position() { return this.characterGroup.position; }
}
