export const Lobby = {
    code: null,
    isHost: false,

    host() {
        this.isHost = true;
        this.code = Math.floor(100000 + Math.random() * 900000).toString();
        const data = { players: ["Host"], started: false };
        localStorage.setItem('lobby_' + this.code, JSON.stringify(data));
        localStorage.setItem('current_lobby_code', this.code);
        return this.code;
    },

    getPlayers(code) {
        const data = JSON.parse(localStorage.getItem('lobby_' + code));
        return data ? data.players : [];
    },

    startGame(code) {
        const data = JSON.parse(localStorage.getItem('lobby_' + code));
        data.started = true;
        localStorage.setItem('lobby_' + code, JSON.stringify(data));
    },

    checkStarted(code) {
        const data = JSON.parse(localStorage.getItem('lobby_' + code));
        return data ? data.started : false;
    }
};
