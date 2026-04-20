import { SaveSystem } from './Logic/Save.js';
import { Input } from './Logic/Controls.js';
import { applyAnims } from './Content/Avatar/Animations/animations.js';
import { loadBaconHair } from './Content/Avatar/Assets/BaconHair.js';

let scene, camera, renderer, character;

function init() {
    SaveSystem.init();
    Input.init();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Build the R6 Body Parts
    character = buildBaseCharacter();
    scene.add(character.group);

    // Load saved hair if applicable
    if (SaveSystem.data.avatar.head === "bacon_hair") {
        const hair = loadBaconHair();
        character.head.add(hair);
    }

    camera.position.z = 5;
    camera.position.y = 2;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    const state = Input.isMoving ? 'walking' : 'idle';
    applyAnims(character, state, Date.now());

    renderer.render(scene, camera);
}

init();
