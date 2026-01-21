const mongoose = require('mongoose');

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

// 2. Mesas
const TableSchema = new mongoose.Schema({
    mesa: { type: String, unique: true },
    senha: String
});

// 3. Admins
const AdminSchema = new mongoose.Schema({
    user: { type: String, unique: true },
    pass: String
});

module.exports = {
    Song: mongoose.model('Song', SongSchema),
    Table: mongoose.model('Table', TableSchema),
    Admin: mongoose.model('Admin', AdminSchema)
};