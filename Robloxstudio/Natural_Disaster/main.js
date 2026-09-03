import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Survivor } from './character.js';
import { World, CameraJoystick } from './world.js';
import { Input } from './controls.js';
import { Multiplayer } from '../../Logic/multiplayer.js';

let scene, camera, renderer, player, world, npcs = [];
let multiplayer;
let cameraJoystick;
let roundState = 'intermission';
let roundTimer = 25;
let disasterType = 'none';
let currentIntermissionText = 'Intermission';

function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3dd);
    
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(50, 120, 30);
    scene.add(sun);

    world = new World(scene);
    spawnPlayers();
    
    Input.init();

    // Initialize Camera Joystick safely
    if (typeof CameraJoystick !== 'undefined') {
        cameraJoystick = new CameraJoystick(camera, player.position);
    }

    window.addEventListener('mobilejump', () => player?.jump());
    window.addEventListener('keydown', event => { if (event.code === 'KeyE') player?.attack(npcs); });
    window.addEventListener('pointerdown', () => player?.attack(npcs));
    
    setInterval(updateGameClock, 1000);
    animate();
}

function spawnPlayers() {
    if (player) scene.remove(player.characterGroup);
    npcs.forEach(n => scene.remove(n.characterGroup));
    npcs = [];

    player = new Survivor(scene, false);
    player.characterGroup.position.set(0, 12, 0);
    
    try {
        multiplayer = new Multiplayer(scene, 'natural-disaster', () => ({ 
            position: { x: player.position.x, y: player.position.y, z: player.position.z }, 
            rotation: { y: player.characterGroup.rotation.y } 
        }));
    } catch (e) {
        console.warn('Multiplayer connection failed or file missing:', e);
    }

    const names = ['Builderman', 'Telamon', 'ROBLOX', 'Stickmasterluke', 'jake', 'guest1337', 'Shedletsky'];
    for (let i = 0; i < 7; i++) {
        const npc = new Survivor(scene, true);
        npc.characterGroup.position.set(Math.random() * 30 - 15, 12, Math.random() * 30 - 15);
        npc.name = names[i];
        npcs.push(npc);
    }
}

function updateGameClock() {
    roundTimer--;
    if (roundTimer <= 0) {
        if (roundState === 'intermission') {
            roundState = 'disaster';
            roundTimer = 60;
            const disasters = ['meteor', 'tsunami', 'acidrain', 'zombie', 'alien', 'lava'];
            disasterType = disasters[Math.floor(Math.random() * disasters.length)];
            world.triggerDisaster(disasterType);
            currentIntermissionText = 'Survive!';
        } else {
            roundState = 'intermission';
            roundTimer = 25;
            disasterType = 'none';
            currentIntermissionText = 'Intermission';
            world.reset();
            spawnPlayers();
        }
    }
}

function updateHUD() {
    const hud = document.getElementById('game-ui');
    if (!hud) return;

    let textTop = '';
    if (roundState === 'intermission') {
        textTop = `${currentIntermissionText} - Next disaster in ${roundTimer} seconds`;
    } else {
        if (disasterType === 'meteor') textTop = `Disaster: Meteor Shower! (${roundTimer}s)`;
        if (disasterType === 'tsunami') textTop = `Disaster: Tsunami Wave! (${roundTimer}s)`;
        if (disasterType === 'acidrain') textTop = `Disaster: Acid Rain Storm! (${roundTimer}s)`;
        if (disasterType === 'zombie') textTop = `Disaster: Zombie Attack! (${roundTimer}s)`;
        if (disasterType === 'alien') textTop = `Disaster: Alien Invasion! (${roundTimer}s)`;
        if (disasterType === 'lava') textTop = `Disaster: Lava Rising! Climb High! (${roundTimer}s)`;
    }

    let content = `<div class="disaster-banner">${textTop}</div>`;
    content += `<div class="leaderboard-header">Survivors Status</div>`;
    content += `<div class="player-row"><b>You</b>: <span style="color:${player.hp > 40 ? '#00ff88' : '#ff3333'}">${Math.round(player.hp)} HP</span></div>`;
    
    npcs.forEach(n => {
        content += `<div class="player-row"><span>${n.name}</span>: ${n.isAlive ? '<span style="color:#00ff88">ALIVE</span>' : '<span class="status-dead">OOFED</span>'}</div>`;
    });

    hud.innerHTML = content;
}

function animate() {
    requestAnimationFrame(animate);
    Input.update();
    world.update(player);

    player.update(Input.keys, world, Input.euler.y);
    multiplayer?.update();
    npcs.forEach(npc => npc.update(null, world, 0, player));

    if (player.isAlive) {
        if (Input.cameraMode === '1st') {
            camera.position.set(player.position.x, player.position.y + 0.65, player.position.z);
            camera.rotation.order = 'YXZ';
            camera.rotation.y = Input.euler.y;
            camera.rotation.x = Input.euler.x;
            player.head.visible = false;
        } else {
            player.head.visible = true;
            
            // Camera control through joystick or default mouse follow
            if (cameraJoystick && cameraJoystick.isDragging) {
                cameraJoystick.target.copy(player.position);
                cameraJoystick.updateCamera();
            } else {
                const dist = 22;
                camera.position.x = player.position.x + Math.sin(Input.euler.y) * dist;
                camera.position.z = player.position.z + Math.cos(Input.euler.y) * dist;
                camera.position.y = player.position.y + 9 + (Math.sin(Input.euler.x) * dist);
                camera.lookAt(player.position);
            }
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

// Wait for DOM to load before starting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
