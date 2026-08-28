// --- IMPORTS ---
// Importing Three.js directly from a CDN as a module to fix version errors
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { api, getSession, saveSession } from './Logic/api.js';

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
const navFriends = document.getElementById('btn-nav-friends');
const navAvatar = document.getElementById('btn-nav-avatar');
const navInventory = document.getElementById('btn-nav-inventory');
const navMarketplace = document.getElementById('btn-nav-marketplace');

// --- APP NAVIGATION ---
function showTab(tabName) {
    // Hide all main containers
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('tab-home').classList.add('hidden');
    document.getElementById('tab-friends').classList.add('hidden');
    document.getElementById('tab-avatar').classList.add('hidden');
    document.getElementById('tab-inventory').classList.add('hidden');
    document.getElementById('tab-marketplace').classList.add('hidden');
    
    // Show selected container
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.remove('hidden');

    // Initialize 3D avatar when avatar tab is shown
    if (tabName === 'avatar' && !is3DActive) {
        init3D();
    }

    // Update Sidebar Styling
    document.querySelectorAll('.side-btn').forEach(btn => btn.classList.remove('active'));
    if(tabName === 'home') navHome?.classList.add('active');
    if(tabName === 'friends') { navFriends?.classList.add('active'); loadFriends(); }
    if(tabName === 'avatar') navAvatar?.classList.add('active');
    if(tabName === 'inventory') navInventory?.classList.add('active');
    if(tabName === 'marketplace') navMarketplace?.classList.add('active');
}

navHome?.addEventListener('click', () => showTab('home'));
navFriends?.addEventListener('click', () => showTab('friends'));
navAvatar?.addEventListener('click', () => showTab('avatar'));
navInventory?.addEventListener('click', () => showTab('inventory'));
navMarketplace?.addEventListener('click', () => showTab('marketplace'));

// --- SIGN UP LOGIC ---
signupBtn?.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!user || !pass) {
        updateStatus("Please enter both fields.", "#ff4444");
        return;
    }

    try { await api('/signup', { method: 'POST', body: JSON.stringify({ username: user, password: pass }) }); updateStatus("Account created! You can now Log In.", "#00e676"); }
    catch (error) { updateStatus(error.message, "#ff4444"); }
});

// --- LOGIN LOGIC ---
loginBtn?.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    try { const session = await api('/login', { method: 'POST', body: JSON.stringify({ username: user, password: pass }) }); saveSession(session); currentUser = session.user; enterApp(); }
    catch (error) { updateStatus(error.message, "#ff4444"); }
});

// --- LOGOUT LOGIC ---
logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    location.reload();
});

async function searchUsers() {
    const results = document.getElementById('search-results');
    try {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        let cachedUsers = [];
        try {
            cachedUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        } catch {
            localStorage.removeItem('allUsers');
        }
        if (!Array.isArray(cachedUsers)) cachedUsers = [];
        if (!cachedUsers.length) {
            const data = await api('/users');
            cachedUsers = Array.isArray(data.users) ? data.users : [];
            localStorage.setItem('allUsers', JSON.stringify(cachedUsers));
        }
        const data = { users: cachedUsers.filter(user => user.username.toLowerCase().includes(query) && user.username !== currentUser.username).slice(0, 20) };
        results.innerHTML = data.users.length ? data.users.map(user => `<div class="friend-row"><span>${user.username}</span><button class="primary-btn friend-action" data-user="${user.username}">Add Friend</button></div>`).join('') : '<p>No users found.</p>';
        results.classList.remove('hidden');
        results.querySelectorAll('.friend-action').forEach(button => button.addEventListener('click', async () => { try { await api('/friends/request', { method: 'POST', body: JSON.stringify({ username: button.dataset.user }) }); button.textContent = 'Request sent'; button.disabled = true; } catch (error) { document.getElementById('friend-status').textContent = error.message; } }));
    } catch (error) { document.getElementById('friend-status').textContent = error.message; }
}
document.getElementById('search-btn')?.addEventListener('click', searchUsers);
async function syncUsers() {
    try {
        const data = await api('/users');
        localStorage.setItem('allUsers', JSON.stringify(data.users));
    } catch (error) {
        document.getElementById('friend-status').textContent = error.message;
    }
}
async function loadFriends() {
    try { const data = await api('/friends'); const friends = Array.isArray(data.friends) ? data.friends : []; const requests = Array.isArray(data.requests) ? data.requests : []; document.getElementById('friend-list').innerHTML = friends.length ? friends.map(name => `<p class="friend-row">${name}</p>`).join('') : '<p>No friends yet.</p>'; document.getElementById('request-list').innerHTML = requests.length ? requests.map(name => `<div class="friend-row"><span>${name}</span><span><button class="primary-btn request-action" data-accept="true" data-user="${name}">Accept</button><button class="secondary-btn request-action" data-user="${name}">Decline</button></span></div>`).join('') : '<p>No pending requests.</p>'; document.querySelectorAll('.request-action').forEach(button => button.addEventListener('click', async () => { await api('/friends/respond', { method: 'POST', body: JSON.stringify({ username: button.dataset.user, accept: button.dataset.accept === 'true' }) }); loadFriends(); })); } catch (error) { document.getElementById('friends-status').textContent = error.message; }
}

function updateStatus(text, color) {
    statusMsg.innerText = text;
    statusMsg.style.color = color;
}

function enterApp() {
    document.getElementById('nav').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('user-display').innerText = currentUser.username;
    const badgeUser = currentUser.username.toLowerCase();
    const hasStaffBadge = badgeUser === 'casrymini' || badgeUser === 'casrymini1';
    document.getElementById('moderator-badge').classList.toggle('hidden', !hasStaffBadge);
    document.getElementById('verified-badge').classList.toggle('hidden', !hasStaffBadge);
    document.getElementById('balance-display').innerText = `R$: ${currentUser.balance}`;
    
    showTab('home');
    syncUsers();
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

    // Create a complete R6-style character like in avatar.html
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff });

    head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.3;

    torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), torsoMat);
    
    // Add arms
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
    leftArm.position.set(-0.8, 0.2, 0);
    
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), skinMat);
    rightArm.position.set(0.8, 0.2, 0);
    
    // Add legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), torsoMat);
    leftLeg.position.set(-0.3, -1.2, 0);
    
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), torsoMat);
    rightLeg.position.set(0.3, -1.2, 0);
    
    const charGroup = new THREE.Group();
    charGroup.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);
    scene.add(charGroup);

    characterParts = { head, torso, leftArm, rightArm, leftLeg, rightLeg, group: charGroup };

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
        // Also update arms to match skin color
        if (characterParts.leftArm) characterParts.leftArm.material.color.setHex(parseInt(colorValue));
        if (characterParts.rightArm) characterParts.rightArm.material.color.setHex(parseInt(colorValue));
    });
});

// Check Session on Load
window.addEventListener('load', () => {
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
        currentUser = getSession();
        enterApp();
    }
});
