import * as THREE from 'three';
import { Survivor } from './character.js';
import { World } from './world.js';
import { Input } from './controls.js';
import { getSpawnPoint } from './spawn.js';

let scene, camera, renderer, player, world, npcs = [];
let gameStarted = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('game-canvas'), 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(10, 50, 10);
    scene.add(sun);

    world = new World(scene);
    
    const spawn = getSpawnPoint(world.platforms);
    
    player = new Survivor(scene, false);
    player.characterGroup.position.copy(spawn.position);

    for (let i = 0; i < 6; i++) {
        const npc = new Survivor(scene, true);
        npc.characterGroup.position.set(Math.random() * 20 - 10, 2, Math.random() * 20 - 10);
        npcs.push(npc);
    }

    Input.init();
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const overlay = document.getElementById('loading-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        return; 
    }

    Input.update();
    world.updateLava();
    
    player.update(Input.keys, world.lava.position.y, world.platforms, Input.euler.y);
    npcs.forEach(npc => npc.update(null, world.lava.position.y, world.platforms));

    if (player.isAlive) {
        if (Input.cameraMode === '1st') {
            camera.position.set(player.position.x, player.position.y + 0.8, player.position.z);
            player.head.visible = false;
        } else {
            const dist = 12;
            camera.position.x = player.position.x + Math.sin(Input.euler.y) * dist;
            camera.position.z = player.position.z + Math.cos(Input.euler.y) * dist;
            camera.position.y = player.position.y + 6 + (Math.sin(Input.euler.x) * dist);
            camera.lookAt(player.position);
            player.head.visible = true;
        }
        
        if (Input.cameraMode === '1st') {
            camera.rotation.order = 'YXZ';
            camera.rotation.y = Input.euler.y;
            camera.rotation.x = Input.euler.x;
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
