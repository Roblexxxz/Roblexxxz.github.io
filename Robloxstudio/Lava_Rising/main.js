import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Survivor } from './character.js';
import { World } from './world.js';
import { Input } from './controls.js';

let scene, camera, renderer, player, world, npcs = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    world = new World(scene);
    player = new Survivor(scene, false);
    player.position.set(0, 2, 0);

    for (let i = 0; i < 6; i++) {
        const npc = new Survivor(scene, true);
        npc.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5);
        npcs.push(npc);
    }

    Input.init();
    createHUD();
    animate();
}

function createHUD() {
    const hud = document.createElement('div');
    hud.id = 'game-ui';
    document.body.appendChild(hud);
}

function updateHUD() {
    const hud = document.getElementById('game-ui');
    let content = `<b style="color:#ff4500">LAVA: ${world.lava.position.y.toFixed(1)}m</b><br>`;
    content += `Height: ${Math.round(player.position.y)}m<br><br>`;
    npcs.forEach((n, i) => {
        content += `CPU ${i + 1}: ${n.isAlive ? Math.round(n.position.y) + 'm' : '<span class="status-dead">OOF</span>'}<br>`;
    });
    hud.innerHTML = content;
}

function animate() {
    requestAnimationFrame(animate);
    world.updateLava();
    
    player.update(Input.keys, world.lava.position.y, world.platforms, Input.euler.y);
    npcs.forEach(npc => npc.update(null, world.lava.position.y, world.platforms));

    if (player.isAlive) {
        camera.position.set(player.position.x, player.position.y + 0.6, player.position.z);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = Input.euler.y;
        camera.rotation.x = Input.euler.x;
        player.head.visible = false;
    }

    updateHUD();
    renderer.render(scene, camera);
}

init();
