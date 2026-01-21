const yts = require('yt-search');
const { Song, Table, Admin } = require('./models');

// Variáveis de memória
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

// A Grande Função de Socket
module.exports = (io) => {
    io.on('connection', async (socket) => {
        console.log(`Conectado: ${socket.id}`);

        // Estado inicial
        const playlist = await getPlaylist();
        socket.emit('update_tv', { lista: playlist, tempo: getTempoDecorrido() });
        socket.emit('update_aviso', avisoAtual);
        socket.emit('update_volume', volumeAtual);

        // --- EMOJIS ---
        socket.on('enviar_reacao', (emoji) => io.emit('receber_reacao', emoji));

        // --- ADMIN ---
        socket.on('admin_login', async ({ user, pass }) => {
            const admin = await Admin.findOne({ user, pass });
            if (admin) {
                const mesas = await Table.find();
                const lista = {};
                mesas.forEach(t => lista[t.mesa] = t.senha);
                socket.emit('admin_auth_ok', { mesas: lista });
            } else {
                socket.emit('admin_auth_fail');
            }
        });

        socket.on('admin_volume', (vol) => { volumeAtual = vol; io.emit('update_volume', vol); });
        socket.on('admin_aviso', (txt) => { avisoAtual = txt; io.emit('update_aviso', txt); });

        socket.on('admin_criar_mesa', async ({ mesa, senha }) => {
            await Table.findOneAndUpdate({ mesa }, { senha }, { upsert: true });
            const mesas = await Table.find();
            const lista = {};
            mesas.forEach(t => lista[t.mesa] = t.senha);
            socket.emit('admin_update_mesas', lista);
        });

        socket.on('admin_remover_mesa', async (mesa) => {
            await Table.deleteOne({ mesa });
            const mesas = await Table.find();
            const lista = {};
            mesas.forEach(t => lista[t.mesa] = t.senha);
            socket.emit('admin_update_mesas', lista);
        });

        socket.on('admin_pular', async () => {
            const playlist = await getPlaylist();
            if (playlist.length > 0) {
                await Song.findByIdAndDelete(playlist[0]._id);
                inicioMusicaAtual = Date.now();
                const nova = await getPlaylist();
                if (nova.length === 0) inicioMusicaAtual = null;
                io.emit('update_tv', { lista: nova, tempo: 0 });
            }
        });

        socket.on('admin_pausar', () => io.emit('comando_controle', 'toggle_pause'));

        // --- CLIENTE ---
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
            const mesaValida = await Table.findOne({ mesa: data.mesa, senha: data.senha });
            
            if (!mesaValida) return socket.emit('feedback_usuario', { sucesso: false, mensagem: "Senha/Mesa inválida!" });
            if (!ehConteudoSeguro(data.titulo)) return socket.emit('feedback_usuario', { sucesso: false, mensagem: "Conteúdo bloqueado." });
            
            const jaExiste = await Song.findOne({ id: data.id });
            if (jaExiste) return socket.emit('feedback_usuario', { sucesso: false, mensagem: "Já está na fila!" });

            const estavaVazia = (await Song.countDocuments()) === 0;

            await Song.create(data);

            if (estavaVazia) inicioMusicaAtual = Date.now();

            socket.emit('feedback_usuario', { sucesso: true, mensagem: "Pedido enviado!" });
            io.emit('update_tv', { lista: await getPlaylist(), tempo: getTempoDecorrido() });
        });

        socket.on('proxima_musica', async () => {
            const playlist = await getPlaylist();
            if (playlist.length > 0) {
                await Song.findByIdAndDelete(playlist[0]._id);
                const nova = await getPlaylist();
                if (nova.length > 0) {
                    inicioMusicaAtual = Date.now();
                    io.emit('update_tv', { lista: nova, tempo: 0 });
                } else {
                    inicioMusicaAtual = null;
                    io.emit('update_tv', { lista: [], tempo: 0 });
                }
            }
        });
    });
};