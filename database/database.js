const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'psi_cms.db');
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    init() {
        this.db.serialize(() => {
            // Tabella utenti
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'author',
                    status TEXT NOT NULL DEFAULT 'active',
                    full_name TEXT,
                    avatar TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabella articoli
            this.db.run(`
                CREATE TABLE IF NOT EXISTS articles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    slug TEXT UNIQUE,
                    content TEXT,
                    excerpt TEXT,
                    featured_image TEXT,
                    category TEXT DEFAULT 'news',
                    status TEXT NOT NULL DEFAULT 'draft',
                    author_id INTEGER,
                    published_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    views INTEGER DEFAULT 0,
                    FOREIGN KEY (author_id) REFERENCES users (id)
                )
            `);

            // Tabella media
            this.db.run(`
                CREATE TABLE IF NOT EXISTS media (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    original_name TEXT NOT NULL,
                    mime_type TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    path TEXT NOT NULL,
                    url TEXT NOT NULL,
                    title TEXT,
                    description TEXT,
                    photo_date DATE NOT NULL,
                    uploaded_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (uploaded_by) REFERENCES users (id)
                )
            `);

            // Tabella categorie
            this.db.run(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Inserisci categorie di default
            this.db.run(`
                INSERT OR IGNORE INTO categories (name, slug, description) VALUES 
                ('Primo Piano', 'primo-piano', 'Notizie di prima pagina'),
                ('News', 'news', 'Notizie generali'),
                ('Politica', 'politica', 'Notizie politiche'),
                ('Economia', 'economia', 'Notizie economiche'),
                ('Ambiente', 'ambiente', 'Notizie ambientali'),
                ('In Evidenza', 'in-evidenza', 'Contenuti in evidenza')
            `);

            // Aggiungi colonne mancanti alla tabella media se non esistono
            this.db.run(`ALTER TABLE media ADD COLUMN title TEXT`);
            this.db.run(`ALTER TABLE media ADD COLUMN description TEXT`);
            this.db.run(`ALTER TABLE media ADD COLUMN photo_date DATE DEFAULT CURRENT_DATE`);

            // Crea super admin se non esiste
            this.createSuperAdmin();
        });
    }

    async createSuperAdmin() {
        const adminExists = await this.getUserByEmail('admin@partitosocialista.it');
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            this.db.run(`
                INSERT INTO users (username, email, password_hash, role, full_name, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                'admin',
                'admin@partitosocialista.it',
                hashedPassword,
                'super_admin',
                'Amministratore PSI',
                'active'
            ], (err) => {
                if (err) {
                    console.error('Errore creazione super admin:', err);
                } else {
                    console.log('✅ Super Admin creato: admin@partitosocialista.it / admin123');
                }
            });
        }
    }

    // Metodi per utenti
    async createUser(userData) {
        return new Promise((resolve, reject) => {
            const { username, email, password, role, full_name } = userData;
            
            bcrypt.hash(password, 10).then(hash => {
                this.db.run(`
                    INSERT INTO users (username, email, password_hash, role, full_name)
                    VALUES (?, ?, ?, ?, ?)
                `, [username, email, hash, role || 'author', full_name], function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...userData });
                });
            }).catch(reject);
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT id, username, email, role, status, full_name, created_at, last_login FROM users ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async updateUser(id, userData) {
        return new Promise((resolve, reject) => {
            const { username, email, role, status, full_name } = userData;
            
            this.db.run(`
                UPDATE users 
                SET username = ?, email = ?, role = ?, status = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [username, email, role, status, full_name, id], function(err) {
                if (err) reject(err);
                else resolve({ id, ...userData });
            });
        });
    }

    async deleteUser(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    }

    // Metodi per articoli
    async createArticle(articleData) {
        return new Promise((resolve, reject) => {
            const { title, content, excerpt, category, author_id, status } = articleData;
            const slug = this.generateSlug(title);
            
            this.db.run(`
                INSERT INTO articles (title, slug, content, excerpt, category, author_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [title, slug, content, excerpt, category, author_id, status || 'draft'], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, slug, ...articleData });
            });
        });
    }

    async getArticleById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT a.*, u.username as author_name, u.full_name as author_full_name
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.id = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getAllArticles(limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT a.*, u.username as author_name, u.full_name as author_full_name
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getPublishedArticles(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT a.*, u.username as author_name, u.full_name as author_full_name
                FROM articles a
                LEFT JOIN users u ON a.author_id = u.id
                WHERE a.status = 'published'
                ORDER BY a.published_at DESC
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async updateArticle(id, articleData) {
        return new Promise((resolve, reject) => {
            const { title, content, excerpt, category, status, featured_image } = articleData;
            const slug = title ? this.generateSlug(title) : null;
            
            let query = 'UPDATE articles SET updated_at = CURRENT_TIMESTAMP';
            let params = [];
            
            if (title) {
                query += ', title = ?, slug = ?';
                params.push(title, slug);
            }
            if (content !== undefined) {
                query += ', content = ?';
                params.push(content);
            }
            if (excerpt !== undefined) {
                query += ', excerpt = ?';
                params.push(excerpt);
            }
            if (category) {
                query += ', category = ?';
                params.push(category);
            }
            if (status) {
                query += ', status = ?';
                params.push(status);
                if (status === 'published') {
                    query += ', published_at = CURRENT_TIMESTAMP';
                }
            }
            if (featured_image) {
                query += ', featured_image = ?';
                params.push(featured_image);
            }
            
            query += ' WHERE id = ?';
            params.push(id);
            
            this.db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ id, updated: this.changes > 0 });
            });
        });
    }

    async deleteArticle(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM articles WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ deleted: this.changes > 0 });
            });
        });
    }

    // Metodi per media
    async saveMedia(mediaData) {
        return new Promise((resolve, reject) => {
            const { filename, original_name, mime_type, size, path, url, title, description, photo_date, uploaded_by } = mediaData;
            
            this.db.run(`
                INSERT INTO media (filename, original_name, mime_type, size, path, url, title, description, photo_date, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [filename, original_name, mime_type, size, path, url, title, description, photo_date, uploaded_by], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...mediaData });
            });
        });
    }

    async getAllMedia(limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT m.*, u.username as uploaded_by_name
                FROM media m
                LEFT JOIN users u ON m.uploaded_by = u.id
                ORDER BY m.photo_date DESC, m.created_at DESC
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async updateMedia(id, mediaData) {
        return new Promise((resolve, reject) => {
            const { title, description, photo_date } = mediaData;
            
            this.db.run(`
                UPDATE media 
                SET title = ?, description = ?, photo_date = ?
                WHERE id = ?
            `, [title, description, photo_date, id], function(err) {
                if (err) reject(err);
                else resolve({ id, updated: this.changes > 0 });
            });
        });
    }

    // Metodi per categorie
    async getAllCategories() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Utility methods
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = new Database(); 