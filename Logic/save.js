export const SaveSystem = {
    key: "ROBLEX_USER_DATA",

    data: {
        avatar: {
            head: "bacon_hair",
            shirt: "noob_blue",
            skin: 0xffff00
        },
        stats: {
            robux: 0,
            wins: 0,
            exp: 0
        },
        inventory: []
    },

    init() {
        const localData = localStorage.getItem(this.key);
        if (localData) {
            this.data = JSON.parse(localData);
        } else {
            this.save(); 
        }
    },

    save() {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    },

    updateAvatar(category, itemId) {
        this.data.avatar[category] = itemId;
        this.save();
    },

    addWin() {
        this.data.stats.wins += 1;
        this.data.stats.exp += 50;
        this.save();
    },

    addRobux(amount) {
        this.data.stats.robux += amount;
        this.save();
    }
};
