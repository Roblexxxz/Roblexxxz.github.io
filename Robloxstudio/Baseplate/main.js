// Baseplate Game - Roblex
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { loadBaconHair } from '../../Content/Avatar/Assets/BaconHair.js';
import { Input } from '../../Logic/controls.js';

// Game variables
let scene, camera, renderer;
let character, characterGroup;
let baseplate;
let velocity = new THREE.Vector3();
let isGrounded = true;
const gravity = -0.01;
const jumpForce = 0.3;
const moveSpeed = 0.1;

// Initialize the game
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
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
    createCharacter();

    // Initialize controls
    Input.init();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', handleKeyDown);

    // Start game loop
    animate();
}

function createBaseplate() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
    baseplate = new THREE.Mesh(geometry, material);
    baseplate.rotation.x = -Math.PI / 2;
    baseplate.position.y = 0;
    scene.add(baseplate);
}

function createCharacter() {
    characterGroup = new THREE.Group();

    // Body parts (simple boxes like Roblox)
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff });

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.3;

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), shirtMat);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
    leftArm.position.set(-0.8, 0.2, 0);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
    rightArm.position.set(0.8, 0.2, 0);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirtMat);
    leftLeg.position.set(-0.3, -1.2, 0);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirtMat);
    rightLeg.position.set(0.3, -1.2, 0);

    // Add bacon hair
    const baconHair = loadBaconHair();
    baconHair.position.y = 1.8;
    head.add(baconHair);

    characterGroup.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);
    characterGroup.position.set(0, 2, 0);
    scene.add(characterGroup);

    character = characterGroup;
}

function handleKeyDown(event) {
    if (event.code === 'Space' && isGrounded) {
        velocity.y = jumpForce;
        isGrounded = false;
    }
}

function updateCharacter() {
    // Movement
    const moveVector = new THREE.Vector3();

    if (Input.keys['w']) moveVector.z -= 1;
    if (Input.keys['s']) moveVector.z += 1;
    if (Input.keys['a']) moveVector.x -= 1;
    if (Input.keys['d']) moveVector.x += 1;

    if (moveVector.length() > 0) {
        moveVector.normalize();
        moveVector.multiplyScalar(moveSpeed);
        character.position.add(moveVector);

        // Rotate character to face movement direction
        const angle = Math.atan2(moveVector.x, moveVector.z);
        character.rotation.y = angle;
    }

    // Gravity and jumping
    velocity.y += gravity;
    character.position.y += velocity.y;

    // Ground collision
    if (character.position.y <= 2) {
        character.position.y = 2;
        velocity.y = 0;
        isGrounded = true;
    }

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
