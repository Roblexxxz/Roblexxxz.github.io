export function loadBaconHair() {
    const hairGroup = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x4e342e });

    // Create the "strips"
    const geo = new THREE.BoxGeometry(1.1, 0.2, 0.3);
    for(let i = 0; i < 3; i++) {
        const strip = new THREE.Mesh(geo, mat);
        strip.position.y = 0.5;
        strip.position.z = (i * 0.3) - 0.3;
        hairGroup.add(strip);
    }
    return hairGroup;
}
