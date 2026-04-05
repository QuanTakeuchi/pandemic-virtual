# Pandemic Virtual Server - LLM Context

## Overview
This is the backend for the Pandemic Virtual board game implementation.

## Tech Stack
- **Environment**: Node.js
- **Networking**: Express, `socket.io` for handling real-time, bidirectional client-server communication.

## Key Files
- `index.js`: Main entry point, sets up the Express server, Socket.io, and handles client events (connections, actions).
- `game/GameState.js`: The core logic and authoritative state of the game. Manages turn phases, player movements, card decks, infections, outbreaks, and win/loss conditions.
- `package.json`: Defines dependencies and start scripts (use `npm run dev` with nodemon).

## Dependencies
Relies on data from the root `/shared` directory (`cities.json`, `constants.json`) for the board topology and game constants.

## Current Tasks
Handling remaining game actions like "Share Knowledge" and ensuring all state changes are properly emitted to clients for UI updates (Day 8 polish).

## Important LLM Instruction
Whenever an LLM loads this file into context and makes changes to the package, it must update this AGENTS.md file if there are any major changes to the structure or logic of the code package. If the changes are minor tweaks no need to update the AGENTS.md files
