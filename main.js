import { SaveSystem } from './Logic/Save.js';
import { Input } from './Logic/Controls.js';
import { applyAnims } from './Content/Avatar/Animations/animations.js';
import { loadBaconHair } from './Content/Avatar/Assets/BaconHair.js';

let scene, camera, renderer, head, torso, is3DActive = false;
let characterParts = {}; 
let currentUser = null;

// Auth UI
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const statusMsg = document.getElementById('status-msg');

// Navigation UI
const navHome = document.getElementById('btn-nav-home');
const navAvatar = document.getElementById('btn-nav-avatar');

// --- APP NAVIGATION ---
function showTab(tabName) {
    // Hide all containers
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('tab-home').classList.add('hidden');
    document.getElementById('tab-avatar').classList.add('hidden');
    
    // Show selected container
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Update active button styling
    document.querySelectorAll('.side-btn').forEach(btn => btn.classList.remove('active'));
    if(tabName === 'home') navHome.classList.add('active');
    if(tabName === 'avatar') navAvatar.classList.add('active');
}

navHome?.addEventListener('click', () => showTab('home'));
navAvatar?.addEventListener('click', () => showTab('avatar'));

// --- SIGN UP ---
signupBtn?.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!user || !pass) {
        statusMsg.innerText = "Please fill all fields.";
        statusMsg.style.color = "#ff4444";
        return;
    }

    if (localStorage.getItem(`user_${user}`)) {
        statusMsg.innerText = "Username already taken.";
        return;
    }

    const userData = { username: user, password: pass, balance: 100, inventory: ['classic_shirt'] };
    localStorage.setItem(`user_${user}`, JSON.stringify(userData));
    statusMsg.innerText = "Account created! You can now log in.";
    statusMsg.style.color = "#00e676";
});

// --- LOGIN ---
loginBtn?.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    const storedData = localStorage.getItem(`user_${user}`);
    if (!storedData) {
        statusMsg.innerText = "User not found.";
        return;
    }

    const parsedUser = JSON.parse(storedData);
    if (parsedUser.password !== pass) {
        statusMsg.innerText = "Incorrect password.";
        return;
    }

    currentUser = parsedUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    enterApp();
});

// --- LOGOUT ---
logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    location.reload();
});

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

    // Simple R6 Character
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.3;
    torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), new THREE.MeshLambertMaterial({ color: 0x00b2ff }));
    
    const charGroup = new THREE.Group();
    charGroup.add(head, torso);
    scene.add(charGroup);
    characterParts = { head, torso, group: charGroup };

    const light = new THREE.PointLight(0xffffff, 1.5, 100);
    light.position.set(2, 5, 5);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));
    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        charGroup.rotation.y += 0.01; // Just a little spin
        renderer.render(scene, camera);
    }
    animate();
}

// Skin color selector
document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        const color = swatch.getAttribute('data-color');
        if(head) head.material.color.setHex(parseInt(color));
    });
});

// Check if already logged in
window.addEventListener('load', () => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        enterApp();
    }
});
