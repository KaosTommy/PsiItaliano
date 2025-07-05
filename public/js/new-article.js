// Carica categorie dall'API
fetch('/api/categories').then(r => r.json()).then(cats => {
    const sel = document.getElementById('category');
    const catMsg = document.getElementById('catMsg');
    if (Array.isArray(cats) && cats.length > 0) {
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = cat.name;
            sel.appendChild(opt);
        });
        catMsg.textContent = '';
    } else {
        catMsg.textContent = 'Nessuna categoria disponibile. Contatta l\'amministratore.';
    }
}).catch(() => {
    document.getElementById('catMsg').textContent = 'Errore nel caricamento categorie.';
});

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('articleForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Debug: verifica token
            const token = localStorage.getItem('adminToken');
            console.log('Token presente:', !!token);
            console.log('Token:', token ? token.substring(0, 20) + '...' : 'Nessun token');
            
            if (!token) {
                document.getElementById('msg').innerText = 'Errore: Non sei autenticato. Effettua il login.';
                return;
            }
            
            const title = document.getElementById('title').value;
            const category = document.getElementById('category').value;
            const content = document.getElementById('content').value;
            const status = document.getElementById('status').value;
            
            console.log('Dati articolo:', { title, category, content, status });
            
            try {
                const headers = { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + token 
                };
                console.log('Headers:', headers);
                
                const res = await fetch('/api/articles', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ title, content, category, status })
                });
                
                console.log('Response status:', res.status);
                console.log('Response headers:', res.headers);
                
                if (res.ok) {
                    const data = await res.json();
                    console.log('Success response:', data);
                    document.getElementById('msg').innerText = 'Articolo creato con successo!';
                    form.reset();
                } else {
                    const data = await res.json();
                    console.error('Errore server:', res.status, data);
                    document.getElementById('msg').innerText = data.message || data.error || 'Errore durante la creazione';
                }
            } catch (error) {
                console.error('Errore di rete:', error);
                document.getElementById('msg').innerText = 'Errore di connessione. Riprova.';
            }
        });
    }
}); 