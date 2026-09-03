export class CameraJoystick {
    constructor(camera, target = new THREE.Vector3(0, 0, 0)) {
        this.camera = camera;
        this.target = target;
        this.distance = 80;
        this.angleX = 0;
        this.angleY = 0.4;
        this.isDragging = false;
        this.previousTouch = { x: 0, y: 0 };

        this.createUI();
        this.attachEvents();
        this.updateCamera();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            touch-action: none;
            user-select: none;
            z-index: 1000;
        `;

        this.knob = document.createElement('div');
        this.knob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            margin-top: -20px;
            margin-left: -20px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
        `;

        this.container.appendChild(this.knob);
        document.body.appendChild(this.container);
    }

    attachEvents() {
        const start = (x, y) => {
            this.isDragging = true;
            this.previousTouch = { x, y };
        };

        const move = (x, y) => {
            if (!this.isDragging) return;
            const dx = x - this.previousTouch.x;
            const dy = y - this.previousTouch.y;

            this.angleX -= dx * 0.01;
            this.angleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.angleY + dy * 0.01));

            const knobX = Math.max(-30, Math.min(30, dx));
            const knobY = Math.max(-30, Math.min(30, dy));
            this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

            this.previousTouch = { x, y };
            this.updateCamera();
        };

        const end = () => {
            this.isDragging = false;
            this.knob.style.transform = `translate(0px, 0px)`;
        };

        this.container.addEventListener('pointerdown', e => start(e.clientX, e.clientY));
        window.addEventListener('pointermove', e => move(e.clientX, e.clientY));
        window.addEventListener('pointerup', end);
    }

    updateCamera() {
        this.camera.position.x = this.target.x + this.distance * Math.sin(this.angleX) * Math.cos(this.angleY);
        this.camera.position.y = this.target.y + this.distance * Math.sin(this.angleY);
        this.camera.position.z = this.target.z + this.distance * Math.cos(this.angleX) * Math.cos(this.angleY);
        this.camera.lookAt(this.target);
    }
}
