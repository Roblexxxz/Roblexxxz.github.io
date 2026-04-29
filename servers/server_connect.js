// Server connection module for Roblex games
class ServerConnection {
    constructor() {
        this.connected = false;
        this.serverId = null;
        this.playerId = null;
        this.lastPlayerState = null;
        this.otherPlayers = {};
        this.updateInterval = null;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async connect(gameId = 'baseplate') {
        console.log('Connecting to server...');

        // Try WebSocket first, fallback to local simulation
        try {
            await this.connectWebSocket(gameId);
        } catch (error) {
            console.log('WebSocket connection failed, using local simulation:', error.message);
            await this.connectLocal(gameId);
        }
    }

    async connectWebSocket(gameId) {
        return new Promise((resolve, reject) => {
            // Generate unique player ID
            this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Connect to WebSocket server
            this.websocket = new WebSocket('ws://localhost:8765');

            this.websocket.onopen = () => {
                console.log('WebSocket connection established');

                // Send connection message
                this.websocket.send(JSON.stringify({
                    type: 'connect',
                    client_id: this.playerId,
                    game_id: gameId
                }));

                this.connected = true;
                this.reconnectAttempts = 0;
                this.startStateSync();

                resolve({
                    serverId: 'ws_server',
                    playerId: this.playerId,
                    gameId: gameId
                });
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (e) {
                    console.error('Failed to parse server message:', e);
                }
            };

            this.websocket.onclose = () => {
                console.log('WebSocket connection closed');
                this.connected = false;
                this.stopStateSync();
            };

            this.websocket.onerror = (error) => {
                reject(error);
            };

            // Connection timeout
            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('Connection timeout'));
                }
            }, 3000);
        });
    }

    async connectLocal(gameId) {
        // Local simulation when WebSocket server is not available
        console.log('Using local server simulation');

        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 500));

        this.playerId = `local_player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.serverId = `local_server_${Date.now()}`;
        this.connected = true;
        this.startStateSync();

        return {
            serverId: this.serverId,
            playerId: this.playerId,
            gameId: gameId
        };
    }

    disconnect() {
        if (this.connected && this.websocket) {
            // Send disconnect message
            this.websocket.send(JSON.stringify({
                type: 'disconnect'
            }));

            this.websocket.close();
        }

        this.stopStateSync();
        this.connected = false;
        this.serverId = null;
        this.playerId = null;
        this.lastPlayerState = null;
        this.otherPlayers = {};
        this.websocket = null;
    }

    isConnected() {
        return this.connected && this.websocket && this.websocket.readyState === WebSocket.OPEN;
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
            if (this.lastPlayerState && this.isConnected()) {
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
        if (!this.isConnected()) return;

        // Format data for server
        const data = {
            type: 'player_state',
            state: playerState,
            timestamp: Date.now()
        };

        try {
            this.websocket.send(JSON.stringify(data));
        } catch (e) {
            console.error('Failed to send player state:', e);
        }
    }

    handleServerMessage(data) {
        const messageType = data.type;

        switch (messageType) {
            case 'connected':
                console.log(`Connected to server as ${data.client_id}`);
                this.serverId = data.room_id;
                break;

            case 'player_update':
                // Update other player's state
                const clientId = data.client_id;
                if (clientId !== this.playerId) {
                    this.receivePlayerUpdate(clientId, data.state);
                }
                break;

            default:
                console.log('Unknown server message:', data);
        }
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

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return false;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        try {
            await this.connect();
            return true;
        } catch (error) {
            console.error('Reconnection failed:', error);
            // Wait before next attempt
            setTimeout(() => this.reconnect(), 2000);
            return false;
        }
    }
}

// Export for use in games
export const serverConnection = new ServerConnection();
