export const Input = {
    keys: { w: false, a: false, s: false, d: false },
    isMoving: false,

    init() {
        window.onkeydown = (e) => {
            this.update(e.key.toLowerCase(), true);
        };
        window.onkeyup = (e) => {
            this.update(e.key.toLowerCase(), false);
        };
    },

    update(key, isDown) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = isDown;
        }
        this.isMoving = Object.values(this.keys).some(v => v);
    }
};
