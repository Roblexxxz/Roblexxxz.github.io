export function applyAnims(character, state, time) {
    const { leftArm, rightArm, leftLeg, rightLeg, head } = character;

    if (state === 'idle') {
        const breathe = Math.sin(time * 0.002) * 0.05;
        leftArm.rotation.x = breathe;
        rightArm.rotation.x = -breathe;
    } 
    
    if (state === 'walking') {
        const angle = Math.sin(time * 0.01) * 0.6;
        leftLeg.rotation.x = angle;
        rightLeg.rotation.x = -angle;
        leftArm.rotation.x = -angle;
        rightArm.rotation.x = angle;
    }
}
