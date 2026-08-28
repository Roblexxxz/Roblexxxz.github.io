# Roblex

A Roblox-inspired web game platform built with HTML, CSS, JavaScript, and Three.js.

## Features

- **3D Avatar Editor**: Customize your character's appearance
- **Baseplate Game**: Classic Roblox-style gameplay with 3D characters
- **User Authentication**: Sign up and log in to save your progress
- **Friends**: Search real registered users, send requests, and accept them
- **Multiplayer rooms**: See authenticated players currently in the same game

## Getting Started

1. Install dependencies and start the application server:
	`npm install && npm start`
2. Open `http://localhost:8080/index.html` in your web browser
3. Sign up for an account or log in
4. Click "Games" and join a game

## Global Multiplayer Hosting

GitHub Pages only hosts static files and cannot run the multiplayer server. Deploy
this Node application to a host that supports Node.js and WebSockets, then set
the server URL before loading the site:

```js
localStorage.setItem('serverUrl', 'https://your-server.example.com');
```

The frontend will use that server for login, friends, and WebSocket game rooms.
All players must use the same server URL, and each player must log in there.

The games use ES modules, so they must be opened through HTTP. Opening
`index.html` directly as a `file://` URL prevents browsers from loading the
game modules.

## Game Controls

- **WASD**: Move character
- **Space**: Jump
- **Mouse**: Look around (camera follows character)

## Project Structure

```
├── index.html          # Main application
├── main.js            # Main application logic
├── style.css          # Styling
├── Content/           # Game content
│   └── Avatar/        # Avatar editor
├── Logic/             # Game logic
├── Robloxstudio/      # Game worlds
│   └── Baseplate/     # Baseplate game
└── games/             # Game selection
```

## Technologies Used

- **Three.js**: 3D graphics and rendering
- **HTML5 Canvas**: Game rendering
- **Node.js and WebSockets**: Shared accounts, friend requests, and room presence
- **ES6 Modules**: Code organization

## Browser Support

Works in all modern browsers that support ES6 modules and WebGL.