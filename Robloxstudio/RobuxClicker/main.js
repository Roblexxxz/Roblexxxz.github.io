import { currentRobux, setRobuxBalance } from '../../data/robux.js';

const robuxCount = document.getElementById('robux-count');
const clickButton = document.getElementById('click-button');
const doneButton = document.getElementById('done-button');

function addRobux() {
    const earnedRobux = Number(robuxCount.textContent) || 0;
    robuxCount.textContent = String(earnedRobux + 1);
}

function addEarnedRobuxToBalance() {
    const earnedRobux = Number(robuxCount.textContent) || 0;
    setRobuxBalance(currentRobux.robuxBalance + earnedRobux);
    window.location.href = '../../index.html';
}

window.addRobux = addRobux;
clickButton.addEventListener('click', addRobux);
doneButton.addEventListener('click', addEarnedRobuxToBalance);