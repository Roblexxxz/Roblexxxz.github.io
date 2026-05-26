import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Survivor } from './character.js';
import { World } from './world.js';
import { Input } from './controls.js';

let scene, camera, renderer, player, world, npcs = [];
let roundState = 'intermission';
let roundTimer = 20;
let disasterType = 'none';

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3dd);
    
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(40, 100, 20);
    scene.add(sun);

    world = new World(scene);
    spawnPlayers();
    
    Input.init();
    setInterval(updateGameClock, 1000);
    animate();
}

function spawnPlayers() {
    if (player) scene.remove(player.characterGroup);
    npcs.forEach(n => scene.remove(n.characterGroup));
    npcs = [];

    player = new Survivor(scene, false);
    player.characterGroup.position.set(0, 5, 0);

    for (let i = 0; i < 7; i++) {
        const npc = new Survivor(scene, true);
        npc.characterGroup.position.set(Math.random() * 20 - 10, 5, Math.random() * 20 - 10);
        npcs.push(npc);
    }
}

function updateGameClock() {
    roundTimer--;
    if (roundTimer <= 0) {
        if (roundState === 'intermission') {
            roundState = 'disaster';
            roundTimer = 60;
            disasterType = Math.random() > 0.5 ? 'meteor' : 'tsunami';
            world.triggerDisaster(disasterType);
        } else {
            roundState = 'intermission';
            roundTimer = 20;
            disasterType = 'none';
            world.reset();
            spawnPlayers();
        }
    }
}

function updateHUD() {
    const hud = document.getElementById('game-ui');
    if (!hud) return;

    let content = `<div style="font-size:18px; color:#ffcc00; text-align:center;">`;
    if (roundState === 'intermission') {
        content += `NEXT DISASTER IN: ${roundTimer}s`;
    } else {
        content += `DISASTER: ${disasterType.toUpperCase()} (${roundTimer}s)`;
    }
    content += `</div><br>`;

    content += `Your HP: <span style="color:${player.hp > 40 ? '#00ff88' : '#ff0000'}">${Math.round(player.hp)}</span><br><br>`;
    npcs.forEach((n, i) => {
        content += `CPU ${i + 1}: ${n.isAlive ? 'ALIVE (' + Math.round(n.hp) + ')' : '<span class="status-dead">OOFED</span>'}<br>`;
    });

    hud.innerHTML = content;
}

function animate() {
    requestAnimationFrame(animate);
    Input.update();
    world.update();

    player.update(Input.keys, world, Input.euler.y);
    npcs.forEach(npc => npc.update(null, world));

    if (player.isAlive) {
        if (Input.cameraMode === '1st') {
            camera.position.set(player.position.x, player.position.y + 0.6, player.position.z);
            camera.rotation.order = 'YXZ';
            camera.rotation.y = Input.euler.y;
            camera.rotation.x = Input.euler.x;
            player.head.visible = false;
        } else {
            const dist = 18;
            camera.position.x = player.position.x + Math.sin(Input.euler.y) * dist;
            camera.position.z = player.position.z + Math.cos(Input.euler.y) * dist;
            camera.position.y = player.position.y + 7 + (Math.sin(Input.euler.x) * dist);
            camera.lookAt(player.position);
            player.head.visible = true;
        }
    }

    updateHUD();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
