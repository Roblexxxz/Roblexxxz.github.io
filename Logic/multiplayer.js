import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

function labelSprite(name) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.font = 'bold 28px Arial'; context.textAlign = 'center'; context.fillText(name, 128, 40);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })); sprite.scale.set(3, 0.75, 1); sprite.position.y = 2.8; return sprite;
}
function avatar(name) {
    const group = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xffdbac }); const shirt = new THREE.MeshStandardMaterial({ color: 0xff8a3d });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skin); head.position.y = 1.25;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), shirt);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), shirt); legs.position.y = -1.2;
    group.add(head, torso, legs, labelSprite(name)); return group;
}
export class Multiplayer {
    constructor(scene, game, getState) { this.scene = scene; this.getState = getState; this.remote = new Map(); this.socket = null; const authToken = localStorage.getItem('authToken'); if (!authToken) return; const configuredServer = localStorage.getItem('serverUrl') || window.ROBLEX_SERVER_URL; const serverUrl = configuredServer || location.origin; const websocketUrl = serverUrl.replace(/^http/, 'ws').replace(/\/$/, ''); this.socket = new WebSocket(`${websocketUrl}/?token=${encodeURIComponent(authToken)}&game=${encodeURIComponent(game)}`); this.socket.onmessage = event => this.receive(JSON.parse(event.data)); }
    receive(message) { if (message.type === 'player_leave') { const player = this.remote.get(message.username); if (player) { this.scene.remove(player.model); this.remote.delete(message.username); } return; } const player = message.player; if (!player || !player.username) return; let remote = this.remote.get(player.username); if (!remote) { remote = { model: avatar(player.username) }; this.remote.set(player.username, remote); this.scene.add(remote.model); } if (player.position) remote.model.position.set(player.position.x, player.position.y, player.position.z); if (player.rotation) remote.model.rotation.y = player.rotation.y; }
    update() { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'state', state: this.getState() })); }
}
