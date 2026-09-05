import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.pillars = new Map();
        this.lava = null;
        this.lavaHeight = -5;
        this.lavaActive = false;
        this.lavaSpeed = 0.03;

        this.initEnvironment();
    }

    initEnvironment() {
        const arenaGeo = new THREE.CylinderGeometry(40, 45, 2, 32);
        const arenaMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
        const arena = new THREE.Mesh(arenaGeo, arenaMat);
        arena.position.y = -6;
        this.scene.add(arena);
        const lavaGeo = new THREE.CylinderGeometry(120, 120, 1, 32);
        const lavaMat = new THREE.MeshStandardMaterial({
            color: 0xff3300,
            emissive: 0xff1100,
            emissiveIntensity: 0.6,
            roughness: 0.2
        });
        this.lava = new THREE.Mesh(lavaGeo, lavaMat);
        this.lava.position.y = this.lavaHeight;
        this.scene.add(this.lava);
        const lavaLight = new THREE.PointLight(0xff4400, 1.5, 100);
        lavaLight.position.set(0, 0, 0);
        this.scene.add(lavaLight);
    }

    createSpawnPlatforms(totalPlayers) {
        const radius = 22; 
        const platformPositions = [];

        for (let i = 0; i < totalPlayers; i++) {
            const angle = (i / totalPlayers) * Math.PI * 2;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            const y = 0;
            const geo = new THREE.CylinderGeometry(3, 3, 2, 16);
            const mat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.6 });
            const platform = new THREE.Mesh(geo, mat);
            platform.position.set(x, y, z);
            this.scene.add(platform);

            this.platforms.push(platform);
            platformPositions.push({ x, y: y + 1, z, id: i });
            this.pillars.set(i, {
                currentHeight: 1,
                basePos: new THREE.Vector3(x, y, z),
                blocks: [platform]
            });
        }

        return platformPositions;
    }

    addPillarHeight(playerId, heightToAdd) {
        const pillarData = this.pillars.get(playerId);
        if (!pillarData) return pillarData ? pillarData.currentHeight : 1;

        const geo = new THREE.CylinderGeometry(2.8, 2.8, heightToAdd, 16);
        const mat = new THREE.MeshStandardMaterial({ 
            color: playerId === 0 ? 0x00ff88 : 0x3388ff,
            roughness: 0.4 
        });
        const block = new THREE.Mesh(geo, mat);
        const newY = pillarData.currentHeight + (heightToAdd / 2);
        block.position.set(pillarData.basePos.x, newY, pillarData.basePos.z);

        this.scene.add(block);
        pillarData.blocks.push(block);
        pillarData.currentHeight += heightToAdd;

        return pillarData.currentHeight;
    }

    triggerLava(speedMultiplier = 1.0) {
        this.lavaActive = true;
        this.lavaSpeed = 0.03 * speedMultiplier;
    }

    stopLava() {
        this.lavaActive = false;
    }

    update(players) {
        if (this.lavaActive && this.lava) {
            this.lavaHeight += this.lavaSpeed;
            this.lava.position.y = this.lavaHeight;
            players.forEach(p => {
                if (p.isAlive && p.position.y <= this.lavaHeight + 0.5) {
                    p.hp = 0;
                    p.isAlive = false;
                }
            });
        }
    }

    reset() {
        // Reset lava position
        this.lavaHeight = -5;
        this.lavaActive = false;
        if (this.lava) this.lava.position.y = this.lavaHeight;
        this.pillars.forEach((data) => {
            for (let i = 1; i < data.blocks.length; i++) {
                this.scene.remove(data.blocks[i]);
            }
            data.blocks = [data.blocks[0]];
            data.currentHeight = 1;
        });
    }
}
