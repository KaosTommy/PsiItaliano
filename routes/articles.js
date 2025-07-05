const express = require('express');
const db = require('../database/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

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

// Lista articoli pubblici
router.get('/', async (req, res) => {
    try {
        const articles = await db.getPublishedArticles(20);
        res.json({ success: true, articles });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Lista articoli (admin/editor)
router.get('/all', authRequired, async (req, res) => {
    try {
        const articles = await db.getAllArticles(50, 0);
        res.json({ success: true, articles });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Crea articolo (author, editor, admin, super_admin)
router.post('/', authRequired, async (req, res) => {
    // Verifica ruolo utente
    if (!['admin', 'editor', 'author', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Permessi insufficienti. Solo admin, editor, author e super_admin possono creare articoli.' 
        });
    }
    
    const { title, content, excerpt, category, status } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Titolo e contenuto obbligatori.' });
    }
    try {
        const article = await db.createArticle({
            title,
            content,
            excerpt,
            category,
            author_id: req.user.id,
            status: status || 'draft'
        });
        res.json({ success: true, article });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Modifica articolo (author proprio, admin)
router.put('/:id', authRequired, async (req, res) => {
    const { id } = req.params;
    const { title, content, excerpt, category, status, featured_image } = req.body;
    try {
        // TODO: check permessi (solo autore o admin)
        const article = await db.getArticleById(id);
        if (!article) return res.status(404).json({ success: false, message: 'Articolo non trovato.' });
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && article.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non hai i permessi per modificare questo articolo.' });
        }
        const updated = await db.updateArticle(id, { title, content, excerpt, category, status, featured_image });
        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

// Elimina articolo (admin/super_admin o autore proprio)
router.delete('/:id', authRequired, async (req, res) => {
    const { id } = req.params;
    try {
        const article = await db.getArticleById(id);
        if (!article) return res.status(404).json({ success: false, message: 'Articolo non trovato.' });
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && article.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Non hai i permessi per eliminare questo articolo.' });
        }
        const deleted = await db.deleteArticle(id);
        res.json({ success: true, deleted });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore server', error: err.message });
    }
});

module.exports = router; 