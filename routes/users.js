const express = require('express');
const db = require('../database/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'psi_secret_key';

// Middleware di autenticazione e controllo ruolo
function authRequired(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token mancante.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token non valido.' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role === 'admin' || req.user.role === 'super_admin') return next();
    res.status(403).json({ success: false, message: 'Permesso negato.' });
}

function superAdminOnly(req, res, next) {
    if (req.user.role === 'super_admin') return next();
    res.status(403).json({ success: false, message: 'Solo il super admin può eseguire questa azione.' });
}

// Lista utenti (solo admin)
router.get('/', authRequired, adminOnly, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Crea nuovo utente (solo admin)
router.post('/', authRequired, adminOnly, async (req, res) => {
    const { username, email, password, role, full_name } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori.' });
    }
    try {
        const user = await db.createUser({ username, email, password, role, full_name });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Modifica utente (solo admin)
router.put('/:id', authRequired, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { username, email, role, status, full_name } = req.body;
    try {
        const user = await db.updateUser(id, { username, email, role, status, full_name });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Elimina utente (solo super admin)
router.delete('/:id', authRequired, superAdminOnly, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.deleteUser(id);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

module.exports = router; 