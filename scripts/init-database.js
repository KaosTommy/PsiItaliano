const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🚀 Inizializzazione database PSI CMS...');

const dbPath = path.join(__dirname, '../database/psi_cms.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('📊 Creazione tabelle...');
    
    // Tabella utenti
    db.run(`
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
    `, (err) => {
        if (err) console.error('❌ Errore tabella users:', err);
        else console.log('✅ Tabella users creata');
    });

    // Tabella articoli
    db.run(`
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
    `, (err) => {
        if (err) console.error('❌ Errore tabella articles:', err);
        else console.log('✅ Tabella articles creata');
    });

    // Tabella media
    db.run(`
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
    `, (err) => {
        if (err) console.error('❌ Errore tabella media:', err);
        else console.log('✅ Tabella media creata');
    });

    // Tabella categorie
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('❌ Errore tabella categories:', err);
        else console.log('✅ Tabella categories creata');
    });

    // Inserisci categorie di default
    db.run(`
        INSERT OR IGNORE INTO categories (name, slug, description) VALUES 
        ('Primo Piano', 'primo-piano', 'Notizie di prima pagina'),
        ('News', 'news', 'Notizie generali'),
        ('Politica', 'politica', 'Notizie politiche'),
        ('Economia', 'economia', 'Notizie economiche'),
        ('Ambiente', 'ambiente', 'Notizie ambientali'),
        ('In Evidenza', 'in-evidenza', 'Contenuti in evidenza')
    `, (err) => {
        if (err) console.error('❌ Errore inserimento categorie:', err);
        else console.log('✅ Categorie di default inserite');
    });

    // Crea super admin
    bcrypt.hash('admin123', 10).then(hash => {
        db.run(`
            INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            'admin',
            'admin@partitosocialista.it',
            hash,
            'super_admin',
            'Amministratore PSI',
            'active'
        ], (err) => {
            if (err) {
                console.error('❌ Errore creazione super admin:', err);
            } else {
                console.log('✅ Super Admin creato');
                console.log('📧 Email: admin@partitosocialista.it');
                console.log('🔑 Password: admin123');
            }
            
            // Chiudi il database
            db.close((err) => {
                if (err) {
                    console.error('❌ Errore chiusura database:', err);
                } else {
                    console.log('✅ Database inizializzato con successo!');
                    console.log('🚀 Ora puoi avviare il server con: npm start');
                }
            });
        });
    }).catch(err => {
        console.error('❌ Errore hash password:', err);
        db.close();
    });
}); 