require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Nossos módulos novos
const connectDB = require('./src/database');
const socketHandler = require('./src/socket');

// 1. Inicialização
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 2. Middlewares
app.use(cors());
app.use(express.static('public'));

// 3. Conexão com Banco
connectDB();

// 4. Inicia a Lógica do Socket
socketHandler(io);

// 5. Inicia o Servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Jukebox rodando na porta ${PORT}`);
});