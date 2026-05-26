import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class AvatarAnimator {
    constructor() {
        this.cycle = 0;
    }

    animate(survivor, keys) {
        if (!survivor.isAlive) {
            survivor.leftLeg.rotation.set(0, 0, 0);
            survivor.rightLeg.rotation.set(0, 0, 0);
            if (survivor.leftArm) survivor.leftArm.rotation.set(0, 0, 0);
            if (survivor.rightArm) survivor.rightArm.rotation.set(0, 0, 0);
            return;
        }

        let isMoving = false;
        if (survivor.isNPC) {
            if (survivor.velocity.x !== 0 || survivor.velocity.z !== 0) {
                isMoving = true;
            }
        } else {
            if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
                isMoving = true;
            }
        }

        if (!survivor.isGrounded) {
            survivor.leftLeg.rotation.x = -0.2;
            survivor.rightLeg.rotation.x = 0.4;
            if (survivor.leftArm) survivor.leftArm.rotation.x = 0.4;
            if (survivor.rightArm) survivor.rightArm.rotation.x = -0.2;
            return;
        }

        if (isMoving) {
            this.cycle += survivor.moveSpeed * 1.8;
            const angle = Math.sin(this.cycle) * 0.6;
            
            survivor.leftLeg.rotation.x = angle;
            survivor.rightLeg.rotation.x = -angle;
            
            if (survivor.leftArm) survivor.leftArm.rotation.x = -angle;
            if (survivor.rightArm) survivor.rightArm.rotation.x = angle;
        } else {
            survivor.leftLeg.rotation.set(0, 0, 0);
            survivor.rightLeg.rotation.set(0, 0, 0);
            if (survivor.leftArm) survivor.leftArm.rotation.set(0, 0, 0);
            if (survivor.rightArm) survivor.rightArm.rotation.set(0, 0, 0);
        }
    }
}
