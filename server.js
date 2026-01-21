require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const yts = require('yt-search');
const mongoose = require('mongoose');

// === CONEXÃO COM O BANCO ===
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Conectado ao MongoDB!");
        criarAdminPadrao(); // <--- Cria o admin se não existir
    })
    .catch(err => console.error("❌ Erro ao conectar no MongoDB:", err));

// === MODELOS (SCHEMAS) ===

// 1. Músicas
const SongSchema = new mongoose.Schema({
    id: String,
    titulo: String,
    capa: String,
    duracao: String,
    autor: String,
    mesa: String,
    createdAt: { type: Date, default: Date.now }
});
const Song = mongoose.model('Song', SongSchema);

// 2. Mesas (Usuários Temporários)
const TableSchema = new mongoose.Schema({
    mesa: { type: String, unique: true },
    senha: String
});
const Table = mongoose.model('Table', TableSchema);

// 3. Admins (Usuários Fixos) <--- NOVO!
const AdminSchema = new mongoose.Schema({
    user: { type: String, unique: true },
    pass: String // Num projeto real, usaríamos hash (bcrypt) aqui
});
const Admin = mongoose.model('Admin', AdminSchema);

// === FUNÇÃO PARA GARANTIR QUE EXISTE UM ADMIN ===
async function criarAdminPadrao() {
    try {
        const adminExiste = await Admin.findOne({ user: 'admin' });
        if (!adminExiste) {
            await Admin.create({ user: 'admin', pass: 'admin123' });
            console.log("👑 Admin padrão criado: admin / admin123");
        }
    } catch (e) {
        console.error("Erro ao criar admin padrão:", e);
    }
}

// === CONFIGURAÇÃO DO SERVIDOR ===
const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Variáveis de memória (Estado volátil)
let volumeAtual = 100;
let avisoAtual = "Bem-vindo ao Jukebox! Peça sua música.";
let inicioMusicaAtual = null; 

// Funções Auxiliares
function ehConteudoSeguro(titulo) {
    const proibidos = ['explicit', '+18', 'sex', 'nude', 'violencia', 'porn'];
    return !proibidos.some(p => titulo.toLowerCase().includes(p));
}

async function getPlaylist() {
    return await Song.find().sort({ createdAt: 1 });
}

function getTempoDecorrido() {
    if (!inicioMusicaAtual) return 0;
    const segundos = (Date.now() - inicioMusicaAtual) / 1000;
    return segundos > 0 ? segundos : 0;
}

// === SOCKET.IO (COMUNICAÇÃO EM TEMPO REAL) ===
io.on('connection', async (socket) => {
    console.log(`Conectado: ${socket.id}`);

    // Estado inicial
    const playlist = await getPlaylist();
    socket.emit('update_tv', { lista: playlist, tempo: getTempoDecorrido() });
    socket.emit('update_aviso', avisoAtual);
    socket.emit('update_volume', volumeAtual);

    // --- REAÇÕES / EMOJIS ---
    socket.on('enviar_reacao', (emoji) => {
        io.emit('receber_reacao', emoji);
    });

    // ==========================================
    // 🔐 ÁREA DO ADMIN (ATUALIZADA)
    // ==========================================
    
    socket.on('admin_login', async (credenciais) => {
        // Agora buscamos no BANCO DE DADOS, não mais no código fixo
        const adminEncontrado = await Admin.findOne({ 
            user: credenciais.user, 
            pass: credenciais.pass 
        });

        if(adminEncontrado) {
            const todasMesas = await Table.find();
            const listaFormatada = {};
            todasMesas.forEach(t => listaFormatada[t.mesa] = t.senha);
            socket.emit('admin_auth_ok', { mesas: listaFormatada });
        } else {
            socket.emit('admin_auth_fail');
        }
    });

    socket.on('admin_volume', (vol) => { volumeAtual = vol; io.emit('update_volume', vol); });
    socket.on('admin_aviso', (txt) => { avisoAtual = txt; io.emit('update_aviso', txt); });
    
    socket.on('admin_criar_mesa', async (dados) => {
        try {
            await Table.findOneAndUpdate({ mesa: dados.mesa }, { senha: dados.senha }, { upsert: true, new: true });
            const todas = await Table.find();
            const lista = {}; todas.forEach(t => lista[t.mesa] = t.senha);
            socket.emit('admin_update_mesas', lista);
        } catch (e) { console.error(e); }
    });

    socket.on('admin_remover_mesa', async (mesa) => {
        await Table.deleteOne({ mesa: mesa });
        const todas = await Table.find();
        const lista = {}; todas.forEach(t => lista[t.mesa] = t.senha);
        socket.emit('admin_update_mesas', lista);
    });

    socket.on('admin_pular', async () => {
        const playlist = await getPlaylist();
        if (playlist.length > 0) {
            await Song.findByIdAndDelete(playlist[0]._id);
            inicioMusicaAtual = Date.now(); 
            const novaLista = await getPlaylist();
            if (novaLista.length === 0) inicioMusicaAtual = null;
            io.emit('update_tv', { lista: novaLista, tempo: 0 });
        }
    });

    socket.on('admin_pausar', () => { io.emit('comando_controle', 'toggle_pause'); });

    // ==========================================
    // 📱 ÁREA DO CLIENTE
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

    socket.on('add_song', async (data) => {
        const mesaEncontrada = await Table.findOne({ mesa: data.mesa });
        
        if (!mesaEncontrada || mesaEncontrada.senha !== data.senha) {
            socket.emit('feedback_usuario', { sucesso: false, mensagem: "Senha ou Mesa incorreta!" });
            return;
        }

        if (!ehConteudoSeguro(data.titulo)) {
            socket.emit('feedback_usuario', { sucesso: false, mensagem: "Conteúdo bloqueado (+18)." });
            return;
        }

        const jaExiste = await Song.findOne({ id: data.id });
        if (jaExiste) {
            socket.emit('feedback_usuario', { sucesso: false, mensagem: "Música já está na fila!" });
            return;
        }

        const estavaVazia = (await Song.countDocuments()) === 0;

        await Song.create({
            id: data.id, titulo: data.titulo, capa: data.capa, 
            duracao: data.duracao, autor: data.autor, mesa: data.mesa
        });

        if (estavaVazia) inicioMusicaAtual = Date.now();

        socket.emit('feedback_usuario', { sucesso: true, mensagem: "Pedido enviado para a TV!" });
        
        const novaLista = await getPlaylist();
        io.emit('update_tv', { lista: novaLista, tempo: getTempoDecorrido() });
    });

    socket.on('proxima_musica', async () => {
        const playlist = await getPlaylist();
        if (playlist.length > 0) {
            await Song.findByIdAndDelete(playlist[0]._id);
            const novaLista = await getPlaylist();
            
            if (novaLista.length > 0) {
                inicioMusicaAtual = Date.now();
                io.emit('update_tv', { lista: novaLista, tempo: 0 });
            } else {
                inicioMusicaAtual = null;
                io.emit('update_tv', { lista: [], tempo: 0 });
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => { console.log(`Jukebox rodando na porta ${PORT}`); });