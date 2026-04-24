// --- IMPORTS ---
// Importing Three.js directly from a CDN as a module to fix version errors
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Commented out 404 resources - Uncomment when files exist
// import { SaveSystem } from './Logic/Save.js';
// import { Input } from './Logic/Controls.js';

// --- GLOBALS & MOCKS ---
let scene, camera, renderer, head, torso, is3DActive = false;
let characterParts = {}; 
let currentUser = null;

// Mocking Input so the animate loop doesn't crash if Logic/Controls.js is missing
const MockInput = { isMoving: false };

// UI Selectors
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const statusMsg = document.getElementById('status-msg');

const navHome = document.getElementById('btn-nav-home');
const navAvatar = document.getElementById('btn-nav-avatar');

// --- APP NAVIGATION ---
function showTab(tabName) {
    // Hide all main containers
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('tab-home').classList.add('hidden');
    document.getElementById('tab-avatar').classList.add('hidden');
    
    // Show selected container
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.remove('hidden');

    // Update Sidebar Styling
    document.querySelectorAll('.side-btn').forEach(btn => btn.classList.remove('active'));
    if(tabName === 'home') navHome?.classList.add('active');
    if(tabName === 'avatar') navAvatar?.classList.add('active');
}

navHome?.addEventListener('click', () => showTab('home'));
navAvatar?.addEventListener('click', () => showTab('avatar'));

// --- SIGN UP LOGIC ---
signupBtn?.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!user || !pass) {
        updateStatus("Please enter both fields.", "#ff4444");
        return;
    }

    if (localStorage.getItem(`user_${user}`)) {
        updateStatus("Username already exists.", "#ff4444");
        return;
    }

    const userData = {
        username: user,
        password: pass,
        balance: 50,
        inventory: []
    };

    localStorage.setItem(`user_${user}`, JSON.stringify(userData));
    updateStatus("Account created! You can now Log In.", "#00e676");
});

// --- LOGIN LOGIC ---
loginBtn?.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    const storedData = localStorage.getItem(`user_${user}`);
    if (!storedData) {
        updateStatus("User not found.", "#ff4444");
        return;
    }

    const parsedUser = JSON.parse(storedData);
    if (parsedUser.password !== pass) {
        updateStatus("Incorrect password.", "#ff4444");
        return;
    }

    currentUser = parsedUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    enterApp();
});

// --- LOGOUT LOGIC ---
logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    location.reload();
});

function updateStatus(text, color) {
    statusMsg.innerText = text;
    statusMsg.style.color = color;
}

function enterApp() {
    document.getElementById('nav').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('user-display').innerText = currentUser.username;
    document.getElementById('balance-display').innerText = `R$: ${currentUser.balance}`;
    
    showTab('home');
    if (!is3DActive) init3D();
}

// --- 3D AVATAR SYSTEM ---
function init3D() {
    is3DActive = true;
    const container = document.getElementById('avatar-3d-container');
    if (!container) return; 

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Create a basic R6-style character
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff });

    head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.3;

    torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), torsoMat);
    
    const charGroup = new THREE.Group();
    charGroup.add(head, torso);
    scene.add(charGroup);

    characterParts = { head, torso, group: charGroup };

    // Lighting
    const light = new THREE.PointLight(0xffffff, 1.5, 100);
    light.position.set(5, 5, 5);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        // Simple rotation if no walking logic is present
        charGroup.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

// Handle Color Changes via Data Attributes
document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        const colorValue = swatch.getAttribute('data-color');
        if (head) head.material.color.setHex(parseInt(colorValue));
    });
});

// Check Session on Load
window.addEventListener('load', () => {
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
        enterApp();
    }
});
