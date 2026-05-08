import * as THREE from 'three';
import { Survivor } from './character.js';
import { World } from './world.js';
import { Input } from './controls.js';
import { getSpawnPoint } from './spawn.js';

let scene, camera, renderer, player, world, npcs = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    world = new World(scene);
    
    const spawn = getSpawnPoint(world.platforms);
    
    player = new Survivor(scene, false);
    player.characterGroup.position.copy(spawn.position);

    for (let i = 0; i < 6; i++) {
        const npc = new Survivor(scene, true);
        npc.characterGroup.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5);
        npcs.push(npc);
    }

    Input.init();
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    Input.update();
    world.updateLava();
    
    player.update(Input.keys, world.lava.position.y, world.platforms, Input.euler.y);
    npcs.forEach(npc => npc.update(null, world.lava.position.y, world.platforms));

    if (player.isAlive) {
        if (Input.cameraMode === '1st') {
            camera.position.set(player.position.x, player.position.y + 0.6, player.position.z);
            player.head.visible = false;
        } else {
            const dist = 8;
            camera.position.x = player.position.x + Math.sin(Input.euler.y) * dist;
            camera.position.z = player.position.z + Math.cos(Input.euler.y) * dist;
            camera.position.y = player.position.y + 4 + (Math.sin(Input.euler.x) * dist);
            camera.lookAt(player.position);
            player.head.visible = true;
        }
        camera.rotation.order = 'YXZ';
        if (Input.cameraMode === '1st') {
            camera.rotation.y = Input.euler.y;
            camera.rotation.x = Input.euler.x;
        }
    }

    renderer.render(scene, camera);
}

init();
