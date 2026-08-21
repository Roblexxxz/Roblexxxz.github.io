# Roblex

A Roblox-inspired web game platform built with HTML, CSS, JavaScript, and Three.js.

## Features

- **3D Avatar Editor**: Customize your character's appearance
- **Baseplate Game**: Classic Roblox-style gameplay with 3D characters
- **User Authentication**: Sign up and log in to save your progress
- **Offline Gameplay**: Play without internet connection

## Getting Started

1. Start a local web server from the project folder, for example:
	`python3 -m http.server 8000`
2. Open `http://localhost:8000/index.html` in your web browser
3. Sign up for an account or log in
4. Click "Games" and join a game

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
- **Local Storage**: Data persistence
- **ES6 Modules**: Code organization

## Browser Support

Works in all modern browsers that support ES6 modules and WebGL.