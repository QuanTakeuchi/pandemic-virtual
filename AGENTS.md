# Pandemic Virtual - LLM Context

## Project Overview
A web-based multiplayer implementation of the Pandemic board game.

## Architecture
- **Client (`/client`)**: React frontend built with Vite. Uses Socket.io-client for real-time communication. Renders an SVG-based map for the game board.
- **Server (`/server`)**: Node.js backend using Express and Socket.io. Maintains the authoritative game state (`GameState.js`).
- **Shared (`/shared`)**: Contains shared JSON data like `cities.json` (city coordinates, colors, connections) and `constants.json`.
- **Planning (`/planning`)**: Documentation, task lists (`MASTER_PLAN.md`, `STATUS.md`).

## Current Status
- Project is largely complete up to Day 7.
- Working features: Map rendering, player movement, infection engine (epidemics, outbreaks), player cards, actions (treat, build, cure).
- Pending features (Day 8): Game indicators (Infection Rate, Outbreaks, Cures), UI polish, and "Share Knowledge" action.

## Tech Stack
- **Frontend**: React 19, Vite
- **Backend**: Node.js, Express, Socket.io

## Important LLM Instruction
Whenever an LLM loads this file into context and makes changes to the package, it must update this AGENTS.md file if there are any major changes to the structure or logic of the code package. If the changes are minor tweaks no need to update the AGENTS.md files
