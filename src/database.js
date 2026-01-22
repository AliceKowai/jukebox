const mongoose = require('mongoose');
const { Admin } = require('./models');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado ao MongoDB!");
        await criarAdminPadrao();
    } catch (err) {
        console.error("❌ Erro ao conectar no MongoDB:", err);
        process.exit(1);
    }
}

async function criarAdminPadrao() {
    try {
        const adminExiste = await Admin.findOne({ user: 'admin' });
        if (!adminExiste) {
            await Admin.create({ user: 'admin', pass: 'admin123' });
            console.log("👑 Admin padrão criado: admin / admin123");
        }
    } catch (e) {
        console.error("Erro ao criar admin:", e);
    }
}

module.exports = connectDB;