import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.pillars = {};
        this.lavaActive = false;
        this.lavaSpeed = 0.08;
        this.currentLavaHeight = 0;
        this.targetLavaHeight = 0;
        
        this.createEnvironment();
    }

    createEnvironment() {
        // Base arena floor
        const floorGeo = new THREE.PlaneGeometry(120, 120);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.9 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);

        // Lava block - scaled smoothly on the Y axis
        const lavaGeo = new THREE.BoxGeometry(120, 1, 120);
        const lavaMat = new THREE.MeshStandardMaterial({ 
            color: 0xff3300, 
            emissive: 0xff1100, 
            roughness: 0.2 
        });
        this.lava = new THREE.Mesh(lavaGeo, lavaMat);
        this.lava.position.set(0, -0.5, 0);
        this.scene.add(this.lava);
    }

    createSpawnPlatforms(count = 8) {
        // Clear old pillars if re-initializing
        Object.keys(this.pillars).forEach(id => {
            if (this.pillars[id].mesh) {
                this.scene.remove(this.pillars[id].mesh);
            }
        });
        this.pillars = {};

        const positions = [];
        const radius = 14;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const geo = new THREE.CylinderGeometry(1.5, 1.5, 1, 24);
            const mat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.5 });
            const pillar = new THREE.Mesh(geo, mat);
            
            pillar.scale.y = 2;
            pillar.position.set(x, 1, z);
            this.scene.add(pillar);

            this.pillars[i] = {
                mesh: pillar,
                height: 2,
                baseX: x,
                baseZ: z
            };

            positions.push({ x, y: 2, z });
        }

        return positions;
    }

    addPillarHeight(id, addedHeight) {
        const pillarData = this.pillars[id];
        if (!pillarData) return 1;

        pillarData.height += addedHeight;
        
        // Dynamic pillar resizing
        pillarData.mesh.scale.y = pillarData.height;
        pillarData.mesh.position.y = pillarData.height / 2;

        return pillarData.height;
    }

    triggerLava(riseUnits = 4) {
        this.lavaActive = true;
        const safeRise = Math.min(Math.max(riseUnits, 1), 12);
        this.targetLavaHeight = this.currentLavaHeight + safeRise;
    }

    stopLava() {
        this.lavaActive = false;
    }

    reset() {
        this.lavaActive = false;
        this.currentLavaHeight = 0;
        this.targetLavaHeight = 0;

        if (this.lava) {
            this.lava.scale.y = 1;
            this.lava.position.set(0, -0.5, 0);
        }

        Object.keys(this.pillars).forEach(id => {
            const p = this.pillars[id];
            p.height = 2;
            p.mesh.scale.y = 2;
            p.mesh.position.y = 1;
        });
    }

    update() {
        if (this.lavaActive && this.lava) {
            if (this.currentLavaHeight < this.targetLavaHeight) {
                this.currentLavaHeight += this.lavaSpeed;
                if (this.currentLavaHeight > this.targetLavaHeight) {
                    this.currentLavaHeight = this.targetLavaHeight;
                }

                this.lava.scale.y = Math.max(this.currentLavaHeight, 0.1);
                this.lava.position.y = (this.currentLavaHeight / 2) - 0.5;
            } else {
                this.lavaActive = false;
            }
        }
    }
}
