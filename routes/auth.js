const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database/database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'psi_secret_key';
const JWT_EXPIRES = '2h';

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e password obbligatorie.' });
    }
    try {
        const user = await db.getUserByEmail(email);
        if (!user) return res.status(401).json({ success: false, message: 'Credenziali non valide.' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ success: false, message: 'Credenziali non valide.' });
        if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Utente non attivo.' });
        await db.updateLastLogin(user.id);
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role, full_name: user.full_name } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Verifica token
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token mancante.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, user: decoded });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token non valido.' });
    }
});

// Logout (solo client side, basta eliminare il token)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logout effettuato. Elimina il token dal client.' });
});

module.exports = router; 