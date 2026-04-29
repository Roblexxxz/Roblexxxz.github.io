// Server connection module for Roblex games
class ServerConnection {
    constructor() {
        this.connected = false;
        this.serverId = null;
        this.playerId = null;
        this.lastPlayerState = null;
        this.otherPlayers = {};
        this.updateInterval = null;
    }

    async connect(gameId = 'baseplate') {
        console.log('Connecting to server...');

        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate server assignment
        this.serverId = `server_${Date.now()}`;
        this.playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
        this.connected = true;

        console.log(`Connected to server ${this.serverId} as ${this.playerId}`);
        
        // Start periodic state updates to server
        this.startStateSync();
        
        return {
            serverId: this.serverId,
            playerId: this.playerId,
            gameId: gameId
        };
    }

    disconnect() {
        if (this.connected) {
            console.log('Disconnecting from server...');
            this.stopStateSync();
            this.connected = false;
            this.serverId = null;
            this.playerId = null;
            this.lastPlayerState = null;
            this.otherPlayers = {};
        }
    }

    isConnected() {
        return this.connected;
    }

    getServerInfo() {
        return {
            serverId: this.serverId,
            playerId: this.playerId,
            connected: this.connected
        };
    }

    startStateSync() {
        // Send player state to server every 100ms (10 updates per second)
        this.updateInterval = setInterval(() => {
            if (this.lastPlayerState) {
                this.sendPlayerState(this.lastPlayerState);
            }
        }, 100);
    }

    stopStateSync() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    sendPlayerState(playerState) {
        // In a real implementation, this would send data via WebSocket or HTTP
        // Format: { playerId, serverId, state: playerState }
        const data = {
            playerId: this.playerId,
            serverId: this.serverId,
            state: playerState,
            timestamp: Date.now()
        };
        
        // Optionally log for debugging
        // console.log('Sending player state:', data);
        
        return data;
    }

    receivePlayerUpdate(playerId, playerState) {
        // Handle updates from other players
        if (playerId !== this.playerId) {
            this.otherPlayers[playerId] = {
                state: playerState,
                timestamp: Date.now()
            };
        }
    }

    getOtherPlayers() {
        return this.otherPlayers;
    }

    clearOtherPlayers() {
        this.otherPlayers = {};
    }
}

// Export for use in games
export const serverConnection = new ServerConnection();
