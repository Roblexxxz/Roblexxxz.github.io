function buildBaseCharacter() {
    const group = new THREE.Group();
    
    // Materials based on SaveSystem data
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Yellow
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff }); // Blue
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1d6a06 }); // Green

    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.5;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.5), torsoMat);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), skinMat);
    leftArm.position.set(-0.8, 0, 0);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), skinMat);
    rightArm.position.set(0.8, 0, 0);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), legMat);
    leftLeg.position.set(-0.3, -1.2, 0);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), legMat);
    rightLeg.position.set(0.3, -1.2, 0);

    group.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);

    return { group, head, torso, leftArm, rightArm, leftLeg, rightLeg };
}
