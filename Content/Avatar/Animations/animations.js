export function applyAnims(parts, state, time) {
    const { head, leftLeg, rightLeg, group } = parts;

    if (state === 'idle') {
        // Slow Roblox Sway
        group.rotation.y = Math.sin(time * 0.001) * 0.1;
        head.rotation.x = Math.sin(time * 0.002) * 0.05;
    }

    if (state === 'walking') {
        // Classic R6 Leg Swing
        const walkSpeed = 0.01;
        const walkAngle = Math.sin(time * walkSpeed) * 0.6;
        
        leftLeg.rotation.x = walkAngle;
        rightLeg.rotation.x = -walkAngle;
    }
}
