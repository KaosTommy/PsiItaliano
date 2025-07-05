const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Aggiornamento ruolo admin a super_admin...');

const dbPath = path.join(__dirname, 'database/psi_cms.db');
let db;

try {
    db = new Database(dbPath);
    console.log('✅ Database connesso con successo');
} catch (err) {
    console.error('❌ Errore connessione database:', err);
    process.exit(1);
}

try {
    // Aggiorna il ruolo dell'admin a super_admin
    const updateStmt = db.prepare("UPDATE users SET role = 'super_admin' WHERE username = 'admin'");
    const result = updateStmt.run();
    
    console.log('✅ Ruolo admin aggiornato a super_admin con successo!');
    console.log('📊 Righe modificate:', result.changes);
    
    // Verifica il risultato
    const checkStmt = db.prepare("SELECT username, role FROM users WHERE username = 'admin'");
    const row = checkStmt.get();
    console.log('👤 Utente admin:', row);
    
    db.close();
} catch (error) {
    console.error('❌ Errore:', error);
    db.close();
} 