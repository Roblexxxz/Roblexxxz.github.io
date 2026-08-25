import { initMobileControls } from '../../Logic/mobile-controls.js';

export const Input = {
    keys: {},
    euler: { x: 0, y: 0 },
    cameraMode: '3rd',
    lookSpeed: 0.035,

    init() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            if (e.key === '1') this.cameraMode = '1st';
            if (e.key === '3') this.cameraMode = '3rd';
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });

        initMobileControls(this);
    },

    update() {
        if (this.keys['arrowleft']) this.euler.y += this.lookSpeed;
        if (this.keys['arrowright']) this.euler.y -= this.lookSpeed;
        if (this.keys['arrowup']) this.euler.x += this.lookSpeed;
        if (this.keys['arrowdown']) this.euler.x -= this.lookSpeed;
        this.euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.euler.x));
    }
};
