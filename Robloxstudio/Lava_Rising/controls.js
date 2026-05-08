export const Input = {
    isMoving: false,
    keys: {},
    mouse: { x: 0, y: 0 },
    lookSensitivity: 0.002,
    euler: { x: 0, y: 0 },
    cameraMode: '3rd',

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === '1') this.cameraMode = '1st';
            if (e.key === '3') this.cameraMode = '3rd';
            if (e.key.toLowerCase() === 'e') {
                window.location.href = '../../games/gamehome.html';
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.euler.y -= e.movementX * this.lookSensitivity;
                this.euler.x -= e.movementY * this.lookSensitivity;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            }
        });

        window.addEventListener('mousedown', () => {
            document.body.requestPointerLock();
        });
    },

    update() {
        this.isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || 
                        this.keys['arrowup'] || this.keys['arrowdown'] || 
                        this.keys['arrowleft'] || this.keys['arrowright'];
        
        if (this.keys['arrowleft']) this.euler.y += 0.04;
        if (this.keys['arrowright']) this.euler.y -= 0.04;
        if (this.keys['arrowup']) this.euler.x += 0.04;
        if (this.keys['arrowdown']) this.euler.x -= 0.04;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    }
};
