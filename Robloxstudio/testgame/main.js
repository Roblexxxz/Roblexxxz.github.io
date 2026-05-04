// Baseplate Game - Roblex
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { loadBaconHair } from '../../Content/Avatar/Assets/BaconHair.js';
import { Input } from '../../Logic/controls.js';
import { Character } from './character.js';

// Game variables
let scene, camera, renderer;
let character, baseplate;
let roomId = 'baseplate';
let channel = null;
let playerId = `player_${Math.random().toString(36).slice(2, 10)}`;
const players = new Set();

function getRoomId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'baseplate';
}

function createRoomHud() {
    const hud = document.createElement('div');
    hud.id = 'room-hud';
    hud.style.position = 'fixed';
    hud.style.left = '10px';
    hud.style.top = '10px';
    hud.style.padding = '10px 14px';
    hud.style.background = 'rgba(0, 0, 0, 0.65)';
    hud.style.color = '#fff';
    hud.style.fontFamily = 'Arial, sans-serif';
    hud.style.fontSize = '14px';
    hud.style.lineHeight = '1.4';
    hud.style.borderRadius = '8px';
    hud.style.zIndex = '1000';
    hud.innerText = 'Joining room...';
    document.body.appendChild(hud);
}

function updateRoomHud() {
    const hud = document.getElementById('room-hud');
    if (!hud) return;
    hud.innerText = `Room: ${roomId}\nPlayers: ${players.size}`;
}

function initRoomSync() {
    roomId = getRoomId();
    players.add(playerId);
    createRoomHud();

    if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(`roblex_baseplate_${roomId}`);

        channel.onmessage = (event) => {
            const { type, id } = event.data || {};
            if (!id) return;

            if (type === 'player_join') {
                players.add(id);
                updateRoomHud();
            } else if (type === 'player_leave') {
                players.delete(id);
                updateRoomHud();
            }
        };

        channel.postMessage({ type: 'player_join', id: playerId });
        updateRoomHud();

        window.addEventListener('beforeunload', () => {
            channel.postMessage({ type: 'player_leave', id: playerId });
        });
    } else {
        const hud = document.getElementById('room-hud');
        if (hud) hud.innerText += '\n(Shared room not available in this browser.)';
    }
}

// Initialize the game
function init() {
    try {
        console.log('Initializing Baseplate game...');
        initRoomSync();

        // Check if canvas exists
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // Sky blue

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 10);

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);

        // Create baseplate
        createBaseplate();

        // Create character
        console.log('Creating character...');
        character = new Character(scene);
        console.log('Character created successfully');

        // Initialize controls
        Input.init();

        // Event listeners
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('keydown', handleKeyDown);

        // Start game loop
        console.log('Starting game loop...');
        animate();

        console.log('Baseplate game initialized successfully!');

        // Hide loading screen
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error initializing game:', error);

        // Hide loading screen and show error
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <h2>Failed to Load Game</h2>
                <p>${error.message}</p>
                <p>Check the browser console for more details.</p>
                <button onclick="location.reload()">Retry</button>
            `;
        }
    }
}

function createBaseplate() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
    baseplate = new THREE.Mesh(geometry, material);
    baseplate.rotation.x = -Math.PI / 2;
    baseplate.position.y = 0;
    scene.add(baseplate);
}


function handleKeyDown(event) {
    if (event.code === 'Space') {
        character.jump();
    }
}

function updateCharacter() {
    // Update character movement
    character.updateMovement(Input.keys);

    // Update camera to follow character
    camera.position.x = character.position.x;
    camera.position.z = character.position.z + 10;
    camera.position.y = character.position.y + 5;
    camera.lookAt(character.position);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    updateCharacter();
    renderer.render(scene, camera);
}

// Start the game
init();
