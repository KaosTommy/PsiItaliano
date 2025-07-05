const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🚀 Inizializzazione database PSI CMS...');

const dbPath = path.join(__dirname, '../database/psi_cms.db');
let db;

try {
    db = new Database(dbPath);
    console.log('✅ Database connesso con successo');
} catch (err) {
    console.error('❌ Errore connessione database:', err);
    process.exit(1);
}

console.log('📊 Creazione tabelle...');

try {
    // Tabella utenti
    db.exec(`
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
    console.log('✅ Tabella users creata');

    // Tabella articoli
    db.exec(`
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
    console.log('✅ Tabella articles creata');

    // Tabella media
    db.exec(`
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            path TEXT NOT NULL,
            url TEXT NOT NULL,
            uploaded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by) REFERENCES users (id)
        )
    `);
    console.log('✅ Tabella media creata');

    // Tabella categorie
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ Tabella categories creata');

    // Inserisci categorie di default
    db.exec(`
        INSERT OR IGNORE INTO categories (name, slug, description) VALUES 
        ('Primo Piano', 'primo-piano', 'Notizie di prima pagina'),
        ('News', 'news', 'Notizie generali'),
        ('Politica', 'politica', 'Notizie politiche'),
        ('Economia', 'economia', 'Notizie economiche'),
        ('Ambiente', 'ambiente', 'Notizie ambientali'),
        ('In Evidenza', 'in-evidenza', 'Contenuti in evidenza')
    `);
    console.log('✅ Categorie di default inserite');

    // Crea super admin
    bcrypt.hash('admin123', 10).then(hash => {
        try {
            const stmt = db.prepare(`
                INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run('admin', 'admin@partitosocialista.it', hash, 'super_admin', 'Amministratore PSI', 'active');
            
            console.log('✅ Super Admin creato');
            console.log('📧 Email: admin@partitosocialista.it');
            console.log('🔑 Password: admin123');
            
            // Chiudi il database
            db.close();
            console.log('✅ Database inizializzato con successo!');
            console.log('🚀 Ora puoi avviare il server con: npm start');
        } catch (err) {
            console.error('❌ Errore creazione super admin:', err);
            db.close();
        }
    }).catch(err => {
        console.error('❌ Errore hash password:', err);
        db.close();
    });
} catch (error) {
    console.error('❌ Errore creazione tabelle:', error);
    db.close();
} 