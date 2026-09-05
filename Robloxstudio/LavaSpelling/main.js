import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Survivor } from './character.js';
import { World } from './world.js';

let scene, camera, renderer, world;
let player, npcs = [];
let allCharacters = [];

// Game Loop State
let roundState = 'TYPING'; // 'TYPING', 'LAVA_RISE', 'INTERMISSION'
let roundTimer = 15;
let roundNumber = 1;
let currentPromptLetter = 'S';

const PROMPT_LETTERS = ['A', 'B', 'C', 'E', 'M', 'P', 'R', 'S', 'T'];

// Player Submission Tracking
let playerSubmittedThisRound = false;

function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a24);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffd59e, 1.2);
    sun.position.set(40, 80, 20);
    scene.add(sun);

    world = new World(scene);
    
    setupGameRound();
    setupUIListeners();

    setInterval(updateGameClock, 1000);
    animate();
}

function setupGameRound() {
    // Clear existing character models from scene
    if (player) scene.remove(player.characterGroup);
    npcs.forEach(n => scene.remove(n.characterGroup));
    npcs = [];
    allCharacters = [];

    // Create 8 total platforms (1 local player + 7 NPCs)
    const positions = world.createSpawnPlatforms(8);

    // Spawn Local Player at Index 0
    player = new Survivor(scene, false);
    player.id = 0;
    player.name = "You";
    player.pillarHeight = 1;
    player.characterGroup.position.set(positions[0].x, positions[0].y, positions[0].z);
    allCharacters.push(player);

    // Spawn NPCs
    const npcNames = ['Builderman', 'Telamon', 'ROBLOX', 'Stickmasterluke', 'jake', 'guest1337', 'Shedletsky'];
    for (let i = 0; i < 7; i++) {
        const npc = new Survivor(scene, true);
        const pos = positions[i + 1];
        npc.id = i + 1;
        npc.name = npcNames[i];
        npc.pillarHeight = 1;
        npc.characterGroup.position.set(pos.x, pos.y, pos.z);
        npcs.push(npc);
        allCharacters.push(npc);
    }

    // Fixed camera position angled toward the player's pillar
    camera.position.set(0, 25, 45);
    camera.lookAt(0, 10, 0);

    startTypingPhase();
}

function startTypingPhase() {
    roundState = 'TYPING';
    roundTimer = 15;
    playerSubmittedThisRound = false;

    // Pick a new random prompt letter
    currentPromptLetter = PROMPT_LETTERS[Math.floor(Math.random() * PROMPT_LETTERS.length)];
    
    // Reset and focus input UI
    const input = document.getElementById('word-input');
    const submitBtn = document.getElementById('submit-btn');
    if (input && submitBtn) {
        input.value = '';
        input.disabled = false;
        submitBtn.disabled = false;
        input.focus();
    }

    world.stopLava();
}

function setupUIListeners() {
    const form = document.getElementById('word-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePlayerWordSubmit();
        });
    }
}

function handlePlayerWordSubmit() {
    if (roundState !== 'TYPING' || playerSubmittedThisRound || !player.isAlive) return;

    const input = document.getElementById('word-input');
    const word = input.value.trim().toUpperCase();

    if (word.length > 0 && word.startsWith(currentPromptLetter)) {
        playerSubmittedThisRound = true;
        input.disabled = true;

        // Add height proportional to word length
        const addedHeight = word.length * 1.5;
        growPlayerPillar(player, addedHeight);
    }
}

function simulateNPCTyping() {
    npcs.forEach(npc => {
        if (!npc.isAlive) return;

        // Random chance for NPC to successfully type a word this turn
        if (Math.random() < 0.8) {
            const wordLength = Math.floor(Math.random() * 5) + 3; // 3 to 7 letters
            const addedHeight = wordLength * 1.5;
            growPlayerPillar(npc, addedHeight);
        }
    });
}

function growPlayerPillar(charObj, heightToAdd) {
    const newTargetY = world.addPillarHeight(charObj.id, heightToAdd);
    charObj.pillarHeight = newTargetY;

    // Smoothly lift player character to the top of their new pillar height
    charObj.characterGroup.position.y = newTargetY + 1;
    charObj.position.y = newTargetY + 1;
}

function updateGameClock() {
    roundTimer--;

    if (roundTimer <= 0) {
        if (roundState === 'TYPING') {
            // End typing phase & trigger NPC answers
            simulateNPCTyping();

            // Transition to Lava Rising phase
            roundState = 'LAVA_RISE';
            roundTimer = 8;
            world.triggerLava(1.0 + (roundNumber * 0.2)); // Lava speeds up each round
        } 
        else if (roundState === 'LAVA_RISE') {
            // Check survivors
            const aliveCount = allCharacters.filter(c => c.isAlive).length;

            if (aliveCount <= 1 || !player.isAlive) {
                // Intermission / Reset round if player dies or last one standing
                roundState = 'INTERMISSION';
                roundTimer = 5;
            } else {
                // Next round
                roundNumber++;
                startTypingPhase();
            }
        } 
        else if (roundState === 'INTERMISSION') {
            roundNumber = 1;
            world.reset();
            setupGameRound();
        }
    }

    updateUI();
}

function updateUI() {
    const promptText = document.getElementById('prompt-text');
    const timerBadge = document.getElementById('timer-badge');
    const playerList = document.getElementById('player-list');

    // Update Top Banner
    if (promptText && timerBadge) {
        timerBadge.textContent = `${roundTimer}s`;

        if (roundState === 'TYPING') {
            promptText.textContent = `Type words starting with "${currentPromptLetter}"`;
        } else if (roundState === 'LAVA_RISE') {
            promptText.textContent = `LAVA IS RISING! STAY HIGH!`;
        } else {
            promptText.textContent = `Round Over! Resetting...`;
        }
    }

    // Update Leaderboard
    if (playerList) {
        let content = '';
        allCharacters.forEach(c => {
            const heightDisplay = c.isAlive 
                ? `<span class="player-height">${Math.round(c.pillarHeight)}m</span>` 
                : `<span class="status-dead">OOFED</span>`;

            content += `
                <div class="player-row">
                    <span class="player-name">${c.name}</span>
                    ${heightDisplay}
                </div>
            `;
        });
        playerList.innerHTML = content;
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Update world logic (lava rising and elimination checks)
    world.update(allCharacters);

    renderer.render(scene, camera);
}

// Adjust canvas on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
