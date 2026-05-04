// Character creation and management for Roblex Baseplate game
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { loadBaconHair } from '../../Content/Avatar/Assets/BaconHair.js';

export class Character {
    constructor(scene) {
        this.scene = scene;
        this.characterGroup = null;
        this.head = null;
        this.torso = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.gravity = -0.01;
        this.jumpForce = 0.3;
        this.moveSpeed = 0.1;

        this.createCharacter();
    }

    createCharacter() {
        try {
            this.characterGroup = new THREE.Group();

            // Body parts (simple boxes like Roblox)
            const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
            const shirtMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff });

            // Head
            this.head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
            this.head.position.y = 1.3;

            // Torso
            this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), shirtMat);

            // Arms
            this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
            this.leftArm.position.set(-0.8, 0.2, 0);

            this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
            this.rightArm.position.set(0.8, 0.2, 0);

            // Legs
            this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirtMat);
            this.leftLeg.position.set(-0.3, -1.2, 0);

            this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirtMat);
            this.rightLeg.position.set(0.3, -1.2, 0);

            // Add bacon hair
            try {
                const baconHair = loadBaconHair();
                baconHair.position.y = 1.8;
                this.head.add(baconHair);
            } catch (hairError) {
                console.warn('Failed to load bacon hair:', hairError);
            }

            this.characterGroup.add(this.head, this.torso, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);
            this.characterGroup.position.set(0, 2, 0);
            this.scene.add(this.characterGroup);
        } catch (error) {
            console.error('Error creating character:', error);
            throw error;
        }
    }

    get position() {
        return this.characterGroup.position;
    }

    get rotation() {
        return this.characterGroup.rotation;
    }

    updateMovement(inputKeys) {
        // Movement
        const moveVector = new THREE.Vector3();

        if (inputKeys['w']) moveVector.z -= 1;
        if (inputKeys['s']) moveVector.z += 1;
        if (inputKeys['a']) moveVector.x -= 1;
        if (inputKeys['d']) moveVector.x += 1;

        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(this.moveSpeed);
            this.characterGroup.position.add(moveVector);

            // Rotate character to face movement direction
            const angle = Math.atan2(moveVector.x, moveVector.z);
            this.characterGroup.rotation.y = angle;
        }

        // Gravity and jumping
        this.velocity.y += this.gravity;
        this.characterGroup.position.y += this.velocity.y;

        // Ground collision
        if (this.characterGroup.position.y <= 2) {
            this.characterGroup.position.y = 2;
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

    getState() {
        return {
            position: {
                x: this.characterGroup.position.x,
                y: this.characterGroup.position.y,
                z: this.characterGroup.position.z
            },
            rotation: {
                y: this.characterGroup.rotation.y
            },
            velocity: {
                y: this.velocity.y
            },
            isGrounded: this.isGrounded
        };
    }

    setState(state) {
        if (state.position) {
            this.characterGroup.position.set(state.position.x, state.position.y, state.position.z);
        }
        if (state.rotation) {
            this.characterGroup.rotation.y = state.rotation.y;
        }
        if (state.velocity) {
            this.velocity.y = state.velocity.y;
        }
        this.isGrounded = state.isGrounded || false;
    }

    remove() {
        if (this.characterGroup && this.scene) {
            this.scene.remove(this.characterGroup);
        }
    }
}

