import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Survivor {
    constructor(scene, isNPC = false) {
        this.scene = scene;
        this.isNPC = isNPC;
        this.isAlive = true;
        this.hp = 100;
        this.pillarHeight = 1;
        this.characterGroup = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.gravity = -0.015;
        this.oofSound = new Audio('../Content/sounds/roblox-ooof-made-with-Voicemod.mp3');
        this.createModel();
    }

    createModel() {
        const skinMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0xdcdde1 : 0xffdbac, roughness: 0.8 });
        const torsoMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x2f3640 : 0x00b2ff, roughness: 0.8 });
        const legMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x1e272e : 0x333333, roughness: 0.8 });
        const armMat = new THREE.MeshStandardMaterial({ color: this.isNPC ? 0x2f3640 : 0x00b2ff, roughness: 0.8 });

        // Head
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skinMat);
        this.head.position.y = 1.25;
        this.characterGroup.add(this.head);

        // Torso
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), torsoMat);
        this.torso.position.y = 0.2;
        this.characterGroup.add(this.torso);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.35, -1.2, 0);
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.35, -1.2, 0);
        this.characterGroup.add(this.leftLeg, this.rightLeg);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.95, 0.2, 0);
        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(0.95, 0.2, 0);
        this.characterGroup.add(this.leftArm, this.rightArm);

        this.scene.add(this.characterGroup);
    }

    update(inputKeys = {}, world = null) {
        if (!this.isAlive) return;

        this.applyPhysics(world);
        if (world) this.checkHazards(world);
    }

    handleMovement() {
        // Disabled: Players and NPCs remain stationary on top of pillars
        return;
    }

    jump() {
        // Disabled: Jumping turned off for Word Tower mode
        return;
    }

    applyPhysics(world) {
        this.velocity.y += this.gravity;
        this.characterGroup.position.y += this.velocity.y;
        this.isGrounded = false;

        // Keep character clamped above their pillar baseline height
        const minY = (this.pillarHeight || 1) + 1.2;
        if (this.characterGroup.position.y <= minY) {
            this.characterGroup.position.y = minY;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }

    checkHazards(world) {
        if (!world) return;

        // Lava damage: check if lava level reaches character height
        if (world.lavaActive && world.lava) {
            const lavaTop = world.lava.position.y + 0.5;
            if (this.characterGroup.position.y - 1.2 <= lavaTop) {
                this.hp -= 5.0; // Rapid damage when submerged in rising lava
            }
        }

        if (this.hp <= 0) this.die();
    }

    die() {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.hp = 0;
        this.oofSound.play().catch(() => {});
        
        // "OOF" death pose: tip character over
        this.characterGroup.rotation.z = Math.PI / 2;
        this.characterGroup.position.y -= 0.5;
    }

    get position() { 
        return this.characterGroup.position; 
    }
}
