const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 Aggiornamento ruolo admin a super_admin...');

const dbPath = path.join(__dirname, 'database/psi_cms.db');
const db = new sqlite3.Database(dbPath);

// Aggiorna il ruolo dell'admin a super_admin
db.run("UPDATE users SET role = 'super_admin' WHERE username = 'admin'", function(err) {
    if (err) {
        console.error('❌ Errore aggiornamento ruolo:', err);
    } else {
        console.log('✅ Ruolo admin aggiornato a super_admin con successo!');
        console.log('📊 Righe modificate:', this.changes);
    }
    
    // Verifica il risultato
    db.get("SELECT username, role FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
            console.error('❌ Errore verifica:', err);
        } else {
            console.log('👤 Utente admin:', row);
        }
        db.close();
    });
}); 