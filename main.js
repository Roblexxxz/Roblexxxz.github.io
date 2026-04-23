// --- IMPORTS (your existing ones) ---
import { SaveSystem } from './Logic/Save.js';
import { Input } from './Logic/Controls.js';
import { applyAnims } from './Content/Avatar/Animations/animations.js';
import { loadBaconHair } from './Content/Avatar/Assets/BaconHair.js';

// --- GLOBALS ---
let scene, camera, renderer, head, torso, is3DActive = false;
let characterParts = {}; 
let currentUser = null;

// --- AUTH ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const statusMsg = document.getElementById('status-msg');

// --- AUTO LOGIN ---
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        enterApp();
    }
});

// --- SIGN UP ---
signupBtn?.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        statusMsg.innerText = "Enter username and password";
        return;
    }

    if (localStorage.getItem(`user_${username}`)) {
        statusMsg.innerText = "User already exists";
        return;
    }

    const user = {
        username,
        password,
        balance: 0,
        inventory: []
    };

    localStorage.setItem(`user_${username}`, JSON.stringify(user));
    statusMsg.innerText = "Account created! Now login.";
});

// --- LOGIN ---
loginBtn?.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const saved = localStorage.getItem(`user_${username}`);
    if (!saved) {
        statusMsg.innerText = "User not found";
        return;
    }

    const user = JSON.parse(saved);

    if (user.password !== password) {
        statusMsg.innerText = "Wrong password";
        return;
    }

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    enterApp();
});

// --- LOGOUT ---
logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    location.reload();
});

// --- ENTER APP ---
function enterApp() {
    document.getElementById('auth-section')?.classList.add('hidden');
    document.getElementById('nav')?.classList.remove('hidden');
    document.getElementById('sidebar')?.classList.remove('hidden');

    document.getElementById('user-display').innerText = currentUser.username;
    document.getElementById('balance-display').innerText = `R$: ${currentUser.balance}`;

    // Start 3D safely
    if (!is3DActive) init3D();
}

// --- YOUR EXISTING 3D FUNCTION (UNCHANGED) ---
function init3D() {
    is3DActive = true;

    const container = document.getElementById('avatar-3d-container');
    if (!container) return; 

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const charGroup = new THREE.Group();
    
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff });

    head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.3;
    
    torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), torsoMat);

    const limbGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);

    const leftLeg = new THREE.Mesh(limbGeo, new THREE.MeshLambertMaterial({color: 0x1d6a06}));
    leftLeg.position.set(-0.35, -1.3, 0);

    const rightLeg = new THREE.Mesh(limbGeo, new THREE.MeshLambertMaterial({color: 0x1d6a06}));
    rightLeg.position.set(0.35, -1.3, 0);

    charGroup.add(head, torso, leftLeg, rightLeg);
    scene.add(charGroup);

    characterParts = { head, torso, leftLeg, rightLeg, group: charGroup };

    // Load hair if owned
    if (currentUser?.inventory?.includes('bacon_hair')) {
        const hair = loadBaconHair();
        head.add(hair);
    }

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);

    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 4;

    function animate() {
        requestAnimationFrame(animate);

        const state = Input.isMoving ? 'walking' : 'idle';
        applyAnims(characterParts, state, Date.now());

        renderer.render(scene, camera);
    }

    animate();
}
```
