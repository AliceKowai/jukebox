const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const yts = require('yt-search');

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// === DADOS NA MEMÓRIA ===
let playlist = [];

// Mesas cadastradas
let mesasCadastradas = {
    "01": "1234" 
};

// Dados do Admin
const ADMIN_LOGIN = { user: "admin", pass: "admin123" };
let volumeAtual = 100;
let avisoAtual = "Bem-vindo ao Jukebox! Peça sua música.";

// Função auxiliar
function ehConteudoSeguro(titulo) {
    const proibidos = ['explicit', '+18', 'sex', 'nude', 'violencia', 'porn'];
    return !proibidos.some(p => titulo.toLowerCase().includes(p));
}

io.on('connection', (socket) => {
    console.log(`Conectado: ${socket.id}`);

    // Sincronização inicial
    socket.emit('update_tv', playlist);
    socket.emit('update_aviso', avisoAtual);
    socket.emit('update_volume', volumeAtual);

    // ==========================================
    // ÁREA DO ADMIN
    // ==========================================
    
    socket.on('admin_login', (credenciais) => {
        if(credenciais.user === ADMIN_LOGIN.user && credenciais.pass === ADMIN_LOGIN.pass) {
            socket.emit('admin_auth_ok', { mesas: mesasCadastradas });
        } else {
            socket.emit('admin_auth_fail');
        }
    });

    // CONTROLE DE VOLUME (O servidor apenas guarda e repassa)
    socket.on('admin_volume', (novoVolume) => {
        console.log("Volume alterado para:", novoVolume);
        volumeAtual = novoVolume;
        io.emit('update_volume', volumeAtual); 
    });

    socket.on('admin_aviso', (texto) => {
        avisoAtual = texto;
        io.emit('update_aviso', avisoAtual);
    });

    socket.on('admin_criar_mesa', (dados) => {
        mesasCadastradas[dados.mesa] = dados.senha;
        socket.emit('admin_update_mesas', mesasCadastradas);
    });

    socket.on('admin_remover_mesa', (mesa) => {
        delete mesasCadastradas[mesa];
        socket.emit('admin_update_mesas', mesasCadastradas);
    });

    // CONTROLES DE PLAYBACK
    socket.on('admin_pular', () => {
        if (playlist.length > 0) {
            console.log("Admin pulou a música.");
            playlist.shift(); 
            io.emit('update_tv', playlist);
        }
    });

    socket.on('admin_pausar', () => {
        console.log("Admin solicitou Pause/Play.");
        io.emit('comando_controle', 'toggle_pause');
    });

    // ==========================================
    // ÁREA DO CLIENTE (MESA)
    // ==========================================

    socket.on('buscar_musica', async (termo) => {
        try {
            const busca = await yts(termo + " audio official");
            const resultados = busca.videos.slice(0, 5).map(v => ({
                id: v.videoId, titulo: v.title, capa: v.thumbnail, duracao: v.timestamp, autor: v.author.name
            }));
            socket.emit('resultado_busca', resultados);
        } catch (e) { console.error(e); }
    });

    socket.on('add_song', (data) => {
        const senhaReal = mesasCadastradas[data.mesa];
        if (!senhaReal || senhaReal !== data.senha) {
            socket.emit('feedback_usuario', { sucesso: false, mensagem: "Senha ou Mesa inválida!" });
            return;
        }

        if (!ehConteudoSeguro(data.titulo)) {
            socket.emit('feedback_usuario', { sucesso: false, mensagem: "Conteúdo bloqueado (+18)." });
            return;
        }

        if (playlist.find(m => m.id === data.id)) {
            socket.emit('feedback_usuario', { sucesso: false, mensagem: "Música já está na fila." });
            return;
        }

        playlist.push(data);
        socket.emit('feedback_usuario', { sucesso: true, mensagem: "Adicionada com sucesso!" });
        io.emit('update_tv', playlist);
    });

    socket.on('proxima_musica', () => {
        if (playlist.length > 0) {
            playlist.shift();
            io.emit('update_tv', playlist);
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`JukeBox Admin rodando em: http://localhost:${PORT}/admin.html`);
});