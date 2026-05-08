export const Input = {
    isMoving: false,
    keys: {},
    mouse: { x: 0, y: 0 },
    lookSensitivity: 0.002,
    euler: { x: 0, y: 0 },

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.updateMoving();
            if (e.key.toLowerCase() === 'e') {
                window.location.href = '../../games/gamehome.html';
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.updateMoving();
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.euler.y -= e.movementX * this.lookSensitivity;
                this.euler.x -= e.movementY * this.lookSensitivity;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            }
        });

        let touchX = 0;
        let touchY = 0;
        window.addEventListener('touchstart', (e) => {
            touchX = e.touches.pageX;
            touchY = e.touches.pageY;
        });

        window.addEventListener('touchmove', (e) => {
            const dx = e.touches.pageX - touchX;
            const dy = e.touches.pageY - touchY;
            this.euler.y -= dx * 0.005;
            this.euler.x -= dy * 0.005;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            touchX = e.touches.pageX;
            touchY = e.touches.pageY;
        });

        window.addEventListener('mousedown', () => {
            document.body.requestPointerLock();
        });
    },

    updateMoving() {
        this.isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || 
                        this.keys['arrowup'] || this.keys['arrowdown'] || 
                        this.keys['arrowleft'] || this.keys['arrowright'];
        
        if (this.keys['arrowleft']) this.euler.y += 0.05;
        if (this.keys['arrowright']) this.euler.y -= 0.05;
        if (this.keys['arrowup']) this.euler.x += 0.05;
        if (this.keys['arrowdown']) this.euler.x -= 0.05;
    }
};
