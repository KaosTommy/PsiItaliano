const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'psi_secret_key';

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

// Configurazione Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage });

// Upload file
router.post('/upload', authRequired, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nessun file caricato.' });
    try {
        const fileData = {
            filename: req.file.filename,
            original_name: req.file.originalname,
            mime_type: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/uploads/${req.file.filename}`,
            uploaded_by: req.user.id
        };
        const media = await db.saveMedia(fileData);
        res.json({ success: true, media });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Lista media (pubblica)
router.get('/', async (req, res) => {
    try {
        const media = await db.getAllMedia(50);
        res.json(media); // Ritorna direttamente l'array per compatibilità con il frontend
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

module.exports = router; 