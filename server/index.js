const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameState = require('./game/GameState');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for now, restrict later
    methods: ["GET", "POST"]
  }
});

const game = new GameState();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Add player to game state
  game.addPlayer(socket.id);
  
  // Broadcast updated player list (or just the new player for now)
  io.emit('game_state_update', game.getState());

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    game.removePlayer(socket.id);
    io.emit('game_state_update', game.getState());
  });

  socket.on('get_initial_state', () => {
    socket.emit('initial_state', game.getState());
  });

  socket.on('player_move', (action) => {
    console.log(`Player ${socket.id} moving:`, action);
    const result = game.movePlayer(socket.id, action);
    if (result.success) {
      io.emit('game_state_update', game.getState());
    } else {
      socket.emit('error_message', result.message);
    }
  });

  socket.on('treat_disease', (color) => {
    console.log(`Player ${socket.id} treating ${color}`);
    const result = game.treatDisease(socket.id, color);
    if (result.success) {
      io.emit('game_state_update', game.getState());
    } else {
      socket.emit('error_message', result.message);
    }
  });

  socket.on('build_station', () => {
    console.log(`Player ${socket.id} building station`);
    const result = game.buildResearchStation(socket.id);
    if (result.success) {
      io.emit('game_state_update', game.getState());
    } else {
      socket.emit('error_message', result.message);
    }
  });

  socket.on('discover_cure', (color) => {
    console.log(`Player ${socket.id} discovering cure for ${color}`);
    const result = game.discoverCure(socket.id, color);
    if (result.success) {
      io.emit('game_state_update', game.getState());
    } else {
      socket.emit('error_message', result.message);
    }
  });

  socket.on('share_knowledge', ({ targetPlayerId, cardName }) => {
    console.log(`Player ${socket.id} sharing ${cardName} with ${targetPlayerId}`);
    const result = game.shareKnowledge(socket.id, targetPlayerId, cardName);
    if (result.success) {
      io.emit('game_state_update', game.getState());
    } else {
      socket.emit('error_message', result.message);
    }
  });

  socket.on('end_turn', () => {
    console.log(`Player ${socket.id} ending turn`);
    const result = game.endTurn(socket.id);
    if (result.success) {
      io.emit('game_state_update', game.getState());
      if (result.message) {
          socket.emit('error_message', result.message); 
      }
    } else {
      socket.emit('error_message', result.message);
    }
  });

  socket.on('discard_card', (cardName) => {
    console.log(`Player ${socket.id} discarding ${cardName}`);
    const result = game.discardCard(socket.id, cardName);
    if (result.success) {
      io.emit('game_state_update', game.getState());
    } else {
      socket.emit('error_message', result.message);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
