import * as THREE from 'three';

export function getSpawnPoint(platforms) {
    if (platforms.length > 0) {
        const firstPlatform = platforms.position;
        return {
            position: new THREE.Vector3(firstPlatform.x, firstPlatform.y + 5, firstPlatform.z + 10),
            lookAt: firstPlatform
        };
    }
    return {
        position: new THREE.Vector3(0, 5, 10),
        lookAt: new THREE.Vector3(0, 0, 0)
    };
}
