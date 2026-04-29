#!/usr/bin/env python3
"""
Roblex Game Server
Handles multiplayer connections and game state synchronization
"""

import asyncio
import json
import logging
import websockets
from datetime import datetime
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GameServer:
    def __init__(self):
        self.connected_clients = {}  # client_id -> websocket
        self.game_rooms = defaultdict(dict)  # room_id -> {client_id: player_data}
        self.client_rooms = {}  # client_id -> room_id

    async def handle_connection(self, websocket, path):
        """Handle a new WebSocket connection"""
        client_id = None
        try:
            # Wait for client to send identification
            async for message in websocket:
                data = json.loads(message)
                message_type = data.get('type')

                if message_type == 'connect':
                    client_id = data.get('client_id')
                    game_id = data.get('game_id', 'baseplate')

                    if client_id:
                        self.connected_clients[client_id] = websocket
                        self.client_rooms[client_id] = game_id

                        # Send connection confirmation
                        await websocket.send(json.dumps({
                            'type': 'connected',
                            'client_id': client_id,
                            'room_id': game_id,
                            'timestamp': datetime.now().isoformat()
                        }))

                        logger.info(f"Client {client_id} connected to room {game_id}")

                elif message_type == 'player_state':
                    if client_id and client_id in self.client_rooms:
                        room_id = self.client_rooms[client_id]
                        player_state = data.get('state', {})

                        # Store player state
                        self.game_rooms[room_id][client_id] = {
                            'state': player_state,
                            'timestamp': datetime.now().isoformat()
                        }

                        # Broadcast to other players in the same room
                        await self.broadcast_to_room(room_id, client_id, {
                            'type': 'player_update',
                            'client_id': client_id,
                            'state': player_state
                        })

                elif message_type == 'disconnect':
                    if client_id:
                        await self.disconnect_client(client_id)
                    break

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Connection closed for client {client_id}")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            if client_id:
                await self.disconnect_client(client_id)

    async def disconnect_client(self, client_id):
        """Clean up when a client disconnects"""
        if client_id in self.connected_clients:
            del self.connected_clients[client_id]

        if client_id in self.client_rooms:
            room_id = self.client_rooms[client_id]
            if room_id in self.game_rooms and client_id in self.game_rooms[room_id]:
                del self.game_rooms[room_id][client_id]
            del self.client_rooms[client_id]

        logger.info(f"Client {client_id} disconnected")

    async def broadcast_to_room(self, room_id, exclude_client_id, message):
        """Send a message to all clients in a room except the sender"""
        if room_id not in self.game_rooms:
            return

        for client_id, player_data in self.game_rooms[room_id].items():
            if client_id != exclude_client_id and client_id in self.connected_clients:
                try:
                    await self.connected_clients[client_id].send(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send to client {client_id}: {e}")

    async def get_room_state(self, room_id):
        """Get the current state of all players in a room"""
        if room_id not in self.game_rooms:
            return {}

        return {
            client_id: player_data['state']
            for client_id, player_data in self.game_rooms[room_id].items()
        }

async def main():
    """Start the WebSocket server"""
    server = GameServer()

    # Start WebSocket server on port 8765
    async with websockets.serve(server.handle_connection, "localhost", 8765):
        logger.info("Roblex Game Server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())