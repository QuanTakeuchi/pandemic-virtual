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
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
