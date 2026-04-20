export const Input = {
    isMoving: false,
    keys: {},

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.updateMoving();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.updateMoving();
        });
    },

    updateMoving() {
        this.isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'];
    }
};
