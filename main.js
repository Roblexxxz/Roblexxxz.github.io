// --- ADD TO THE TOP OF YOUR main.js ---
import { SaveSystem } from './Logic/Save.js';
import { Input } from './Logic/Controls.js';
import { applyAnims } from './Content/Avatar/Animations/animations.js';
import { loadBaconHair } from './Content/Avatar/Assets/BaconHair.js';

// Existing variables + new character group
let scene, camera, renderer, head, torso, is3DActive = false;
let characterParts = {}; 
let currentUser = null;

// --- MODIFIED init3D() ---
function init3D() {
    is3DActive = true;
    const container = document.getElementById('avatar-3d-container');
    if(!container) return; 

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Create the "R6" character group
    const charGroup = new THREE.Group();
    
    // Skin and Shirt materials from your currentUser/SaveSystem
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00b2ff });

    // Build parts
    head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 1.3;
    
    torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), torsoMat);
    
    // Legs & Arms (For animations)
    const limbGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    const leftLeg = new THREE.Mesh(limbGeo, new THREE.MeshLambertMaterial({color: 0x1d6a06}));
    leftLeg.position.set(-0.35, -1.3, 0);
    const rightLeg = new THREE.Mesh(limbGeo, new THREE.MeshLambertMaterial({color: 0x1d6a06}));
    rightLeg.position.set(0.35, -1.3, 0);

    charGroup.add(head, torso, leftLeg, rightLeg);
    scene.add(charGroup);

    // Store parts for the animation file to use
    characterParts = { head, torso, leftLeg, rightLeg, group: charGroup };

    // Check if user has Bacon Hair saved
    if(currentUser.inventory.includes('bacon_hair')) {
        const hair = loadBaconHair();
        head.add(hair); 
    }

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light, new THREE.AmbientLight(0x404040));
    camera.position.z = 4;

    function animate() {
        requestAnimationFrame(animate);
        
        // 1. Check Input from Logic/Controls.js
        const state = Input.isMoving ? 'walking' : 'idle';
        
        // 2. Apply the R6 Animations from Content/Avatar/Animations/
        applyAnims(characterParts, state, Date.now());

        renderer.render(scene, camera);
    }
    animate();
}
