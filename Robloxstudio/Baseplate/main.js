// Baseplate Game - Roblex
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { loadBaconHair } from '../../Content/Avatar/Assets/BaconHair.js';
import { Input } from '../../Logic/controls.js';
import { serverConnection } from '../../servers/server_connect.js';
import { Character } from './character.js';

// Game variables
let scene, camera, renderer;
let character, baseplate;

// Initialize the game
function init() {
    try {
        console.log('Initializing Baseplate game...');

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

        // Connect to server (don't block initialization)
        serverConnection.connect('baseplate').then(connectionData => {
            console.log('Game connected to server:', connectionData);
        }).catch(error => {
            console.warn('Server connection failed, continuing in offline mode:', error.message);
        });

        // Event listeners
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('beforeunload', () => {
            serverConnection.disconnect();
        });

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

    // Send player state to server
    if (serverConnection.isConnected()) {
        const playerState = character.getState();
        // In a real implementation, this would send to the server via WebSocket or HTTP
        // For now, we're just updating the local server connection object
        serverConnection.lastPlayerState = playerState;
    }
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
