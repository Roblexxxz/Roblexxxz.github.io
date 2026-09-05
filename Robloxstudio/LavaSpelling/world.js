import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Survivor } from './character.js';
import { World } from './world.js';
import { WORD_BANK, IS_VALID_WORD } from './wordBank.js';

let scene, camera, renderer, world;
let player, npcs = [];
let allCharacters = [];

let roundState = 'TYPING';
let roundTimer = 15;
let roundNumber = 1;
let currentPromptLetter = 'A';

const ALL_LETTERS = Object.keys(WORD_BANK);
let playerSubmittedThisRound = false;

function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a24);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

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
    if (player) scene.remove(player.characterGroup);
    npcs.forEach(n => scene.remove(n.characterGroup));
    npcs = [];
    allCharacters = [];

    const positions = world.createSpawnPlatforms(8);

    player = new Survivor(scene, false);
    player.id = 0;
    player.name = "You";
    player.pillarHeight = 1;
    player.characterGroup.position.set(positions[0].x, positions[0].y, positions[0].z);
    allCharacters.push(player);

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

    camera.position.set(0, 25, 45);
    camera.lookAt(0, 10, 0);

    startTypingPhase();
}

function startTypingPhase() {
    roundState = 'TYPING';
    roundTimer = 15;
    playerSubmittedThisRound = false;

    currentPromptLetter = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    
    const input = document.getElementById('word-input');
    const submitBtn = document.getElementById('submit-btn');
    if (input && submitBtn) {
        input.value = '';
        input.disabled = false;
        submitBtn.disabled = false;
        input.placeholder = `Type a real word starting with ${currentPromptLetter}...`;
        input.focus();
    }

    clearSpeechBubbles();
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

    if (word.length > 0 && word.startsWith(currentPromptLetter) && IS_VALID_WORD(word)) {
        playerSubmittedThisRound = true;
        input.disabled = true;

        const addedHeight = word.length * 1.5;
        growPlayerPillar(player, addedHeight);
        showSpeechBubble(player, word);
    } else {
        input.value = '';
        input.placeholder = 'INVALID WORD! Try again...';
    }
}

function simulateNPCTyping() {
    const validWords = WORD_BANK[currentPromptLetter] || [currentPromptLetter + "EXTRAORDINARY"];

    npcs.forEach(npc => {
        if (!npc.isAlive) return;

        if (Math.random() < 0.90) {
            const chosenWord = validWords[Math.floor(Math.random() * validWords.length)];
            const addedHeight = chosenWord.length * 1.5;
            growPlayerPillar(npc, addedHeight);
            showSpeechBubble(npc, chosenWord);
        }
    });
}

function growPlayerPillar(charObj, heightToAdd) {
    const newTargetY = world.addPillarHeight(charObj.id, heightToAdd);
    charObj.pillarHeight = newTargetY;
    charObj.characterGroup.position.y = newTargetY + 1;
    charObj.position.y = newTargetY + 1;
}

function showSpeechBubble(charObj, text) {
    const bubbleContainer = document.getElementById('speech-bubbles');
    if (!bubbleContainer) return;

    let bubble = document.getElementById(`bubble-${charObj.id}`);
    if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = `bubble-${charObj.id}`;
        bubble.className = 'speech-bubble';
        bubbleContainer.appendChild(bubble);
    }
    bubble.textContent = text;
    bubble.style.display = 'block';
}

function updateSpeechBubbles() {
    allCharacters.forEach(c => {
        const bubble = document.getElementById(`bubble-${c.id}`);
        if (!bubble) return;

        if (!c.isAlive || roundState === 'INTERMISSION') {
            bubble.style.display = 'none';
            return;
        }

        const screenPos = c.position.clone();
        screenPos.y += 3.0;
        screenPos.project(camera);

        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
    });
}

function clearSpeechBubbles() {
    const bubbleContainer = document.getElementById('speech-bubbles');
    if (bubbleContainer) bubbleContainer.innerHTML = '';
}

function updateGameClock() {
    roundTimer--;

    if (roundTimer <= 0) {
        if (roundState === 'TYPING') {
            simulateNPCTyping();

            roundState = 'LAVA_RISE';
            roundTimer = 8;
            
            const randomRise = Math.floor(Math.random() * 8) + 6;
            world.triggerLava(randomRise);
        } 
        else if (roundState === 'LAVA_RISE') {
            const aliveCount = allCharacters.filter(c => c.isAlive).length;

            if (aliveCount <= 1 || !player.isAlive) {
                roundState = 'INTERMISSION';
                roundTimer = 5;
            } else {
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

function updateCameraPosition() {
    let focusY = player && player.isAlive ? player.position.y : 0;

    allCharacters.forEach(c => {
        if (c.isAlive && c.position.y > focusY) {
            focusY = c.position.y;
        }
    });

    const targetY = focusY + 15;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.lookAt(0, focusY, 0);
}

function animate() {
    requestAnimationFrame(animate);

    world.update();
    allCharacters.forEach(c => c.update({}, world));
    
    updateCameraPosition();
    updateSpeechBubbles();

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
