# Roblex Game Server

This directory contains the server-side code for Roblex multiplayer functionality.

## Files

- `game_server.py` - Python WebSocket server for handling multiplayer connections
- `server_connect.js` - JavaScript client for connecting to the server

## Running the Server

To enable multiplayer functionality, run the Python WebSocket server:

```bash
cd servers
python3 game_server.py
```

The server will start on `ws://localhost:8765` and handle:
- Player connections
- Real-time state synchronization
- Room management for different games

## Features

- **WebSocket Communication**: Real-time bidirectional communication
- **Room-based Games**: Players are grouped by game type (baseplate, etc.)
- **State Synchronization**: Player positions, movements, and actions are synced
- **Automatic Fallback**: If the server is not running, the game falls back to local simulation

## Testing

Open `server_test.html` in your browser to test the WebSocket connection.

## Dependencies

The Python server requires:
- `websockets` library

Install with:
```bash
pip install websockets
```