const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import routes (non utilizzati, rimossi per evitare conflitti)
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const articleRoutes = require('./routes/articles');
// const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: 'Troppe richieste da questo IP, riprova più tardi.'
});
app.use('/api/', limiter);

// CORS configurato
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));
app.use('/uploads', express.static('uploads'));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(express.static(__dirname));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurazione Multer per upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

// Upload per immagini (articoli)
const uploadImage = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accetta solo immagini
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo file immagine sono permessi'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Upload per media (file generici)
const uploadMedia = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accetta immagini, video, audio, documenti
        const allowedMimes = [
            'image/', 'video/', 'audio/', 
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime) || file.mimetype === mime);
        
        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new Error('Tipo di file non supportato. Formati permessi: immagini, video, audio, PDF, documenti'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Database
const db = new sqlite3.Database('./database/psi_cms.db', (err) => {
    if (err) {
        console.error('Errore connessione database:', err);
    } else {
        console.log('✅ Database connesso con successo');
    }
});

// Gestione errori database
db.on('error', (err) => {
    console.error('Errore database:', err);
});

// Middleware di autenticazione
const authenticateToken = (req, res, next) => {
    console.log('authenticateToken - Headers:', req.headers);
    const authHeader = req.headers['authorization'];
    console.log('authenticateToken - Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('authenticateToken - Token extracted:', token ? token.substring(0, 20) + '...' : 'No token');

    if (!token) {
        console.log('authenticateToken - No token found');
        return res.status(401).json({ error: 'Token di accesso richiesto' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('authenticateToken - Token verification failed:', err.message);
            return res.status(403).json({ error: 'Token non valido' });
        }
        console.log('authenticateToken - Token verified successfully. User:', user);
        req.user = user;
        next();
    });
};

// Middleware di autorizzazione
const requireRole = (roles) => {
    return (req, res, next) => {
        console.log('requireRole - User:', req.user);
        console.log('requireRole - Required roles:', roles);
        console.log('requireRole - User role:', req.user?.role);
        
        if (!req.user) {
            console.log('requireRole - No user found');
            return res.status(401).json({ error: 'Autenticazione richiesta' });
        }
        
        // Se super_admin, sempre permesso
        if (req.user.role === 'super_admin') {
            console.log('requireRole - Super admin access granted');
            return next();
        }
        
        if (!roles.includes(req.user.role)) {
            console.log('requireRole - Insufficient permissions. User role:', req.user.role, 'Required roles:', roles);
            return res.status(403).json({ error: 'Permessi insufficienti' });
        }
        
        console.log('requireRole - Authorization successful');
        next();
    };
};

// Validazione input (non più utilizzata, rimossa per evitare conflitti)
// const validateArticle = (req, res, next) => {
//     const { title, content, category } = req.body;
//     
//     if (!title || title.trim().length < 3 || title.trim().length > 60) {
//         return res.status(400).json({ error: 'Il titolo deve essere tra 3 e 60 caratteri' });
//     }
//     
//     if (!content || content.trim().length < 10) {
//         return res.status(400).json({ error: 'Il contenuto deve essere almeno di 10 caratteri' });
//     }
//     
//     if (!category || category.trim().length === 0) {
//         return res.status(400).json({ error: 'La categoria è obbligatoria' });
//     }
//     
//     // Sanitizzazione base
//     req.body.title = title.trim().replace(/[<>]/g, '');
//     req.body.content = content.trim();
//     req.body.category = category.trim();
//     
//     next();
// };

const validateUser = (req, res, next) => {
    const { username, email, password, role } = req.body;
    
    if (!username || username.trim().length < 3 || username.trim().length > 50) {
        return res.status(400).json({ error: 'Username deve essere tra 3 e 50 caratteri' });
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Email non valida' });
    }
    
    if (password && password.length < 6) {
        return res.status(400).json({ error: 'Password deve essere almeno di 6 caratteri' });
    }
    
    if (role && !['admin', 'editor', 'author'].includes(role)) {
        return res.status(400).json({ error: 'Ruolo non valido' });
    }
    
    // Sanitizzazione
    req.body.username = username.trim().toLowerCase();
    req.body.email = email.trim().toLowerCase();
    
    next();
};

// API Routes

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password sono obbligatori' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username.trim()], async (err, user) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Credenziali non valide' });
        }
        
        try {
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }
            
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Errore bcrypt:', error);
            res.status(500).json({ error: 'Errore interno del server' });
        }
    });
});

// Verifica token
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Gestione utenti
app.get('/api/users', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
    db.all('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        res.json(users);
    });
});

app.post('/api/users', authenticateToken, requireRole(['admin']), validateUser, async (req, res) => {
    const { username, email, password, role } = req.body;
    
    // Verifica se username o email esistono già
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username o email già esistenti' });
        }
        
        try {
            const hashedPassword = await bcrypt.hash(password, 12);
            
            db.run(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, role || 'author'],
                function(err) {
                    if (err) {
                        console.error('Errore database:', err);
                        return res.status(500).json({ error: 'Errore interno del server' });
                    }
                    
                    res.json({ 
                        id: this.lastID,
                        username,
                        email,
                        role: role || 'author'
                    });
                }
            );
        } catch (error) {
            console.error('Errore bcrypt:', error);
            res.status(500).json({ error: 'Errore interno del server' });
        }
    });
});

app.put('/api/users/:id', authenticateToken, requireRole(['admin']), validateUser, async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    
    // Verifica se l'utente esiste
    db.get('SELECT id FROM users WHERE id = ?', [id], async (err, user) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        // Verifica se username o email esistono già (escludendo l'utente corrente)
        db.get('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, id], async (err, existingUser) => {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            if (existingUser) {
                return res.status(400).json({ error: 'Username o email già esistenti' });
            }
            
            try {
                let updateQuery = 'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?';
                let params = [username, email, role, id];
                
                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 12);
                    updateQuery = 'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?';
                    params = [username, email, hashedPassword, role, id];
                }
                
                db.run(updateQuery, params, function(err) {
                    if (err) {
                        console.error('Errore database:', err);
                        return res.status(500).json({ error: 'Errore interno del server' });
                    }
                    
                    res.json({ 
                        id: parseInt(id),
                        username,
                        email,
                        role
                    });
                });
            } catch (error) {
                console.error('Errore bcrypt:', error);
                res.status(500).json({ error: 'Errore interno del server' });
            }
        });
    });
});

app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    const { id } = req.params;
    
    // Impedisce di eliminare se stesso
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Non puoi eliminare il tuo account' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        res.json({ message: 'Utente eliminato con successo' });
    });
});

// Gestione articoli
app.get('/api/articles', (req, res) => {
    console.log('GET /api/articles - Query params:', req.query);
    const { status, category } = req.query;
    let query = 'SELECT a.*, u.username as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id';
    let params = [];
    
    if (status) {
        query += ' WHERE a.status = ?';
        params.push(status);
    }
    
    if (category) {
        query += status ? ' AND a.category = ?' : ' WHERE a.category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    console.log('Query:', query);
    console.log('Params:', params);
    
    db.all(query, params, (err, articles) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        console.log('Articoli trovati:', articles ? articles.length : 0);
        res.json(articles || []);
    });
});

app.get('/api/articles/:id', (req, res) => {
    const { id } = req.params;
    console.log('GET /api/articles/:id - ID:', id);
    
    db.get('SELECT a.*, u.username as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = ?', [id], (err, article) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        console.log('Articolo trovato:', article ? 'Sì' : 'No');
        
        if (!article) {
            return res.status(404).json({ error: 'Articolo non trovato' });
        }
        
        res.json(article);
    });
});

app.post('/api/articles', authenticateToken, requireRole(['admin', 'editor', 'author', 'super_admin']), uploadImage.single('image'), (req, res) => {
    console.log('POST /api/articles - Body:', req.body);
    console.log('POST /api/articles - File:', req.file);
    
    const { title, content, category, status = 'draft', published } = req.body;
    
    // Validazione
    if (!title || title.trim().length < 3 || title.trim().length > 60) {
        console.log('Errore validazione titolo:', { title, length: title ? title.length : 0 });
        return res.status(400).json({ error: 'Il titolo deve essere tra 3 e 60 caratteri' });
    }
    
    if (!content || content.trim().length < 10) {
        console.log('Errore validazione contenuto:', { content, length: content ? content.length : 0 });
        return res.status(400).json({ error: 'Il contenuto deve essere almeno di 10 caratteri' });
    }
    
    // Categoria opzionale con default
    const finalCategory = category && category.trim().length > 0 ? category.trim() : 'Generale';
    
    // Sanitizzazione
    const sanitizedTitle = title.trim().replace(/[<>]/g, '');
    const sanitizedContent = content.trim();
    const sanitizedCategory = finalCategory;
    const isPublished = published === 'true' || published === true;
    
            // Gestione immagine
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        
        const finalStatus = isPublished ? 'published' : 'draft';
        
        if (isPublished) {
            db.run(
                'INSERT INTO articles (title, content, category, status, author_id, published_at, featured_image) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
                [sanitizedTitle, sanitizedContent, sanitizedCategory, finalStatus, req.user.id, imageUrl],
            function(err) {
                if (err) {
                    console.error('Errore database:', err);
                    return res.status(500).json({ error: 'Errore interno del server' });
                }
                res.json({
                    id: this.lastID,
                    title: sanitizedTitle,
                    content: sanitizedContent,
                    category: sanitizedCategory,
                    status: finalStatus,
                    author_id: req.user.id,
                    image_url: imageUrl
                });
            }
        );
            } else {
            db.run(
                'INSERT INTO articles (title, content, category, status, author_id, featured_image) VALUES (?, ?, ?, ?, ?, ?)',
                [sanitizedTitle, sanitizedContent, sanitizedCategory, finalStatus, req.user.id, imageUrl],
            function(err) {
                if (err) {
                    console.error('Errore database:', err);
                    return res.status(500).json({ error: 'Errore interno del server' });
                }
                res.json({
                    id: this.lastID,
                    title: sanitizedTitle,
                    content: sanitizedContent,
                    category: sanitizedCategory,
                    status: finalStatus,
                    author_id: req.user.id,
                    image_url: imageUrl
                });
            }
        );
    }
});

app.put('/api/articles/:id', authenticateToken, requireRole(['admin', 'editor', 'author', 'super_admin']), uploadImage.single('image'), (req, res) => {
    const { id } = req.params;
    const { title, content, category, status, published } = req.body;
    
    console.log('PUT /api/articles/:id - Body:', req.body);
    console.log('Published value:', published, 'Type:', typeof published);
    console.log('All body fields:', Object.keys(req.body));
    console.log('Form data fields:', req.body);
    console.log('Raw body:', req.body);
    console.log('Published from body:', req.body.published);
    
    // Validazione
    if (!title || title.trim().length < 3 || title.trim().length > 60) {
        return res.status(400).json({ error: 'Il titolo deve essere tra 3 e 60 caratteri' });
    }
    
    if (!content || content.trim().length < 10) {
        return res.status(400).json({ error: 'Il contenuto deve essere almeno di 10 caratteri' });
    }
    
    // Categoria opzionale con default
    const finalCategory = category && category.trim().length > 0 ? category.trim() : 'Generale';
    
    // Sanitizzazione
    const sanitizedTitle = title.trim().replace(/[<>]/g, '');
    const sanitizedContent = content.trim();
    const sanitizedCategory = finalCategory;
    const isPublished = published === 'true' || published === true;
    const finalStatus = isPublished ? 'published' : 'draft';
    
            // Verifica se l'articolo esiste e se l'utente ha i permessi
        db.get('SELECT author_id, status, featured_image FROM articles WHERE id = ?', [id], (err, article) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (!article) {
            return res.status(404).json({ error: 'Articolo non trovato' });
        }
        
        // Solo admin/editor possono modificare articoli di altri utenti
        if (article.author_id !== req.user.id && !['admin', 'editor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Permessi insufficienti' });
        }
        
        // Gestione immagine
        let imageUrl = article.featured_image; // Mantieni l'immagine esistente
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
            
            // Elimina la vecchia immagine se esiste
            if (article.featured_image) {
                const oldImagePath = path.join(__dirname, article.featured_image.replace('/uploads/', 'uploads/'));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        
        const updateQuery = isPublished ? 
            'UPDATE articles SET title = ?, content = ?, category = ?, status = ?, featured_image = ?, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?' :
            'UPDATE articles SET title = ?, content = ?, category = ?, status = ?, featured_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        
        const params = [sanitizedTitle, sanitizedContent, sanitizedCategory, finalStatus, imageUrl, id];
        
        db.run(updateQuery, params, function(err) {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            res.json({
                id: parseInt(id),
                title: sanitizedTitle,
                content: sanitizedContent,
                category: sanitizedCategory,
                status: finalStatus,
                image_url: imageUrl
            });
        });
    });
});

app.delete('/api/articles/:id', authenticateToken, requireRole(['admin', 'editor', 'author', 'super_admin']), (req, res) => {
    const { id } = req.params;
    
    // Verifica se l'articolo esiste e se l'utente ha i permessi
    db.get('SELECT author_id, featured_image FROM articles WHERE id = ?', [id], (err, article) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (!article) {
            return res.status(404).json({ error: 'Articolo non trovato' });
        }
        
        // Solo admin/editor possono eliminare articoli di altri utenti
        if (article.author_id !== req.user.id && !['admin', 'editor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Permessi insufficienti' });
        }
        
        // Elimina l'immagine associata se esiste
        if (article.featured_image) {
            const imagePath = path.join(__dirname, article.featured_image.replace('/uploads/', 'uploads/'));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        db.run('DELETE FROM articles WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            res.json({ message: 'Articolo eliminato con successo' });
        });
    });
});

// Gestione utenti
app.post('/api/users', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
    const { username, email, password, full_name, role } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email e password sono obbligatori' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });
    }
    
    bcrypt.hash(password, 10).then(hash => {
        db.run(
            'INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hash, full_name || null, role || 'author', 'active'],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('username')) {
                            return res.status(400).json({ error: 'Username già esistente' });
                        } else if (err.message.includes('email')) {
                            return res.status(400).json({ error: 'Email già esistente' });
                        }
                    }
                    console.error('Errore database:', err);
                    return res.status(500).json({ error: 'Errore interno del server' });
                }
                
                res.json({
                    id: this.lastID,
                    username,
                    email,
                    full_name,
                    role,
                    status: 'active'
                });
            }
        );
    }).catch(err => {
        console.error('Errore hash password:', err);
        res.status(500).json({ error: 'Errore interno del server' });
    });
});

app.put('/api/users/:id', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
    const { id } = req.params;
    const { username, email, full_name, role, status } = req.body;
    
    if (!username || !email) {
        return res.status(400).json({ error: 'Username ed email sono obbligatori' });
    }
    
    db.run(
        'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [username, email, full_name || null, role, status || 'active', id],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('username')) {
                        return res.status(400).json({ error: 'Username già esistente' });
                    } else if (err.message.includes('email')) {
                        return res.status(400).json({ error: 'Email già esistente' });
                    }
                }
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Utente non trovato' });
            }
            
            res.json({
                id: parseInt(id),
                username,
                email,
                full_name,
                role,
                status
            });
        }
    );
});

app.delete('/api/users/:id', authenticateToken, requireRole(['admin', 'super_admin']), (req, res) => {
    const { id } = req.params;
    
    // Non permettere di eliminare se stessi
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Non puoi eliminare il tuo account' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        res.json({ message: 'Utente eliminato con successo' });
    });
});

// Gestione media
app.get('/api/media', (req, res) => {
    db.all('SELECT * FROM media ORDER BY created_at DESC', (err, media) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        res.json(media);
    });
});

app.post('/api/media', authenticateToken, requireRole(['admin', 'editor', 'author', 'super_admin']), uploadMedia.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
    }
    
    const { title, description, photo_date } = req.body;
    
    // Validazione data obbligatoria
    if (!photo_date) {
        return res.status(400).json({ error: 'La data della foto è obbligatoria' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    db.run(
        'INSERT INTO media (filename, original_name, mime_type, size, path, url, title, description, photo_date, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.file.path, fileUrl, title, description, photo_date, req.user.id],
        function(err) {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            res.json({
                id: this.lastID,
                filename: req.file.filename,
                original_name: req.file.originalname,
                mime_type: req.file.mimetype,
                size: req.file.size,
                url: fileUrl,
                title,
                description,
                photo_date,
                uploaded_by: req.user.id
            });
        }
    );
});

app.put('/api/media/:id', authenticateToken, requireRole(['admin', 'editor', 'author', 'super_admin']), (req, res) => {
    const { id } = req.params;
    const { title, description, photo_date } = req.body;
    
    // Validazione data obbligatoria
    if (!photo_date) {
        return res.status(400).json({ error: 'La data della foto è obbligatoria' });
    }
    
    db.run(
        'UPDATE media SET title = ?, description = ?, photo_date = ? WHERE id = ?',
        [title, description, photo_date, id],
        function(err) {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Media non trovato' });
            }
            
            res.json({ message: 'Media aggiornato con successo' });
        }
    );
});

app.delete('/api/media/:id', authenticateToken, requireRole(['admin', 'editor', 'author', 'super_admin']), (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT path FROM media WHERE id = ?', [id], (err, media) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        
        if (!media) {
            return res.status(404).json({ error: 'File non trovato' });
        }
        
        // Elimina il file fisico
        if (media.path && fs.existsSync(media.path)) {
            fs.unlinkSync(media.path);
        }
        
        db.run('DELETE FROM media WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            
            res.json({ message: 'File eliminato con successo' });
        });
    });
});

// Categorie
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        res.json(categories);
    });
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {};
    
    // Conta utenti
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
        stats.users = result.count;
        
        // Conta articoli
        db.get('SELECT COUNT(*) as count FROM articles', (err, result) => {
            if (err) {
                console.error('Errore database:', err);
                return res.status(500).json({ error: 'Errore interno del server' });
            }
            stats.articles = result.count;
            
            // Conta articoli pubblicati
            db.get('SELECT COUNT(*) as count FROM articles WHERE status = "published"', (err, result) => {
                if (err) {
                    console.error('Errore database:', err);
                    return res.status(500).json({ error: 'Errore interno del server' });
                }
                stats.published = result.count;
                
                // Conta media
                db.get('SELECT COUNT(*) as count FROM media', (err, result) => {
                    if (err) {
                        console.error('Errore database:', err);
                        return res.status(500).json({ error: 'Errore interno del server' });
                    }
                    stats.media = result.count;
                    
                    res.json(stats);
                });
            });
        });
    });
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Serve main site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Serve article page
app.get('/article/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Errore non gestito:', err);
    
    // Gestione errori multer
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Il file è troppo grande. Dimensione massima: 5MB' });
        }
        return res.status(400).json({ error: 'Errore nel caricamento del file' });
    }
    
    // Gestione errori di tipo file
    if (err.message === 'Solo file immagine sono permessi') {
        return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Errore interno del server' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint non trovato' });
});

app.listen(PORT, () => {
    console.log(`🚩 Server PSI CMS avviato sulla porta ${PORT}`);
    console.log(`📱 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🌐 Sito principale: http://localhost:${PORT}`);
});

module.exports = app; 