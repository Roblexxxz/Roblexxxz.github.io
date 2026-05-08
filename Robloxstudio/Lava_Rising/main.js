import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Survivor } from './character.js';
import { World } from './world.js';

let scene, camera, renderer, player, world, npcs = [];
const keys = {};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(ambient, sun);

    world = new World(scene);
    player = new Survivor(scene, false);
    player.position.set(0, 2, 0);

    for (let i = 0; i < 8; i++) {
        const npc = new Survivor(scene, true);
        npc.position.set(Math.random() * 10 - 5, 2, Math.random() * 10 - 5);
        npcs.push(npc);
    }

    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (e.code === 'Space') player.jump();
    });
    window.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = false;
    });

    createHUD();
    animate();
}

function createHUD() {
    const hud = document.createElement('div');
    hud.id = 'game-ui';
    hud.style.cssText = 'position:fixed;top:20px;right:20px;background:rgba(0,0,0,0.7);color:white;padding:15px;font-family:Arial;border-radius:10px;min-width:150px;';
    document.body.appendChild(hud);
}

function updateHUD() {
    const hud = document.getElementById('game-ui');
    let content = '<b style="color:#ff4500">LAVA ALTITUDE: ' + world.lava.position.y.toFixed(1) + 'm</b><br><br>';
    content += 'Player: ' + (player.isAlive ? Math.round(player.position.y) + 'm' : '<span style="color:red">OOFED</span>') + '<br>';
    npcs.forEach((n, i) => {
        content += 'NPC ' + (i + 1) + ': ' + (n.isAlive ? Math.round(n.position.y) + 'm' : '<span style="color:red">OOFED</span>') + '<br>';
    });
    hud.innerHTML = content;
}

function animate() {
    requestAnimationFrame(animate);
    world.updateLava();
    player.update(keys, world.lava.position.y);
    npcs.forEach(npc => npc.update(null, world.lava.position.y));

    if (player.isAlive) {
        const targetCam = new THREE.Vector3(player.position.x, player.position.y + 6, player.position.z + 12);
        camera.position.lerp(targetCam, 0.1);
        camera.lookAt(player.position);
    }

    updateHUD();
    renderer.render(scene, camera);
}

init();
