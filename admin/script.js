// Variabili globali
let currentUser = null;
let articles = [];
let users = [];
let media = [];
let categories = [];

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadCategories();
});

// Controllo autenticazione
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginScreen();
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
            loadDashboardStats();
        } else {
            localStorage.removeItem('adminToken');
            showLoginScreen();
        }
    } catch (error) {
        console.error('Errore verifica token:', error);
        localStorage.removeItem('adminToken');
        showLoginScreen();
    }
}

// Login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;

    if (!username || !password) {
        showAlert('Inserisci username e password', 'error');
        return;
    }

    loginBtn.textContent = 'Accesso in corso...';
    loginBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            currentUser = data.user;
            showDashboard();
            loadDashboardStats();
            showAlert('Accesso effettuato con successo!', 'success');
        } else {
            showAlert(data.error || 'Errore durante l\'accesso', 'error');
        }
    } catch (error) {
        console.error('Errore login:', error);
        showAlert('Errore di connessione', 'error');
    } finally {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    currentUser = null;
    showLoginScreen();
    showAlert('Logout effettuato', 'success');
}

// Mostra schermata login
function showLoginScreen() {
    document.body.innerHTML = `
        <div class="login-screen">
            <div class="login-container">
                <div class="login-header">
                    <h1>🔴 PSI CMS</h1>
                    <p>Pannello di Amministrazione</p>
                </div>
                <form class="login-form" id="loginForm" autocomplete="on">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" autocomplete="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" autocomplete="current-password" required>
                    </div>
                    <button type="submit" id="loginBtn" class="btn btn-primary">Accedi</button>
                </form>
                <div id="alertContainer"></div>
            </div>
        </div>
    `;
    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        login();
    });
}

// Mostra dashboard
function showDashboard() {
    document.body.innerHTML = `
        <div class="dashboard">
            <header class="admin-header">
                <h1><span class="logo">🔴</span> PSI CMS - Pannello Amministrazione</h1>
                <div class="header-right">
                    <span class="user-info">${currentUser.username} (${currentUser.role})</span>
                    <button id="logoutBtn" class="btn btn-secondary">Logout</button>
                </div>
            </header>
            
            <div class="admin-container">
                <aside class="admin-sidebar">
                    <h3>Menu</h3>
                    <ul class="nav-menu">
                        <li><a href="#" id="menu-dashboard" class="active"><i>📊</i> Dashboard</a></li>
                        <li><a href="#" id="menu-articles"><i>📝</i> Articoli</a></li>
                        <li><a href="#" id="menu-users"><i>👥</i> Utenti</a></li>
                        <li><a href="#" id="menu-media"><i>📁</i> Media</a></li>
                    </ul>
                </aside>
                
                <main class="admin-content">
                    <div id="dashboard-section" class="content-section active">
                        <h2>Dashboard</h2>
                        <div class="dashboard-stats" id="statsContainer">
                            <div class="loading">Caricamento statistiche...</div>
                        </div>
                    </div>
                    
                    <div id="articles-section" class="content-section">
                        <div class="section-header">
                            <h2>Gestione Articoli</h2>
                            <button id="newArticleBtn" class="btn btn-primary">Nuovo Articolo</button>
                        </div>
                        <div id="articlesContainer">
                            <div class="loading">Caricamento articoli...</div>
                        </div>
                    </div>
                    
                    <div id="users-section" class="content-section">
                        <div class="section-header">
                            <h2>Gestione Utenti</h2>
                            <button id="newUserBtn" class="btn btn-primary">Nuovo Utente</button>
                        </div>
                        <div id="usersContainer">
                            <div class="loading">Caricamento utenti...</div>
                        </div>
                    </div>
                    
                    <div id="media-section" class="content-section">
                        <div class="section-header">
                            <h2>Gestione Media</h2>
                            <button id="uploadMediaBtn" class="btn btn-primary">Carica Media</button>
                        </div>
                        <div id="mediaContainer">
                            <div class="loading">Caricamento media...</div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        
        <div id="modalContainer"></div>
        <div id="alertContainer"></div>
    `;
    // Event listener CSP-safe
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('menu-dashboard').addEventListener('click', function(e) { e.preventDefault(); showSection('dashboard'); });
    document.getElementById('menu-articles').addEventListener('click', function(e) { e.preventDefault(); showSection('articles'); });
    document.getElementById('menu-users').addEventListener('click', function(e) { e.preventDefault(); showSection('users'); });
    document.getElementById('menu-media').addEventListener('click', function(e) { e.preventDefault(); showSection('media'); });
    document.getElementById('newArticleBtn').addEventListener('click', showCreateArticleModal);
    document.getElementById('newUserBtn').addEventListener('click', showCreateUserModal);
    document.getElementById('uploadMediaBtn').addEventListener('click', showUploadMediaModal);
    loadArticles();
    loadUsers();
    loadMedia();
}

// Cambia sezione
function showSection(sectionName) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Rimuovi classe active da tutti i link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostra sezione selezionata
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Aggiungi classe active al link
    event.target.classList.add('active');
}

// Carica statistiche dashboard
async function loadDashboardStats() {
    try {
        const response = await fetch('http://localhost:3001/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('statsContainer').innerHTML = `
                <div class="stat-card">
                    <h3>${stats.users}</h3>
                    <p>Utenti Totali</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.articles}</h3>
                    <p>Articoli Totali</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.published}</h3>
                    <p>Articoli Pubblicati</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.media}</h3>
                    <p>File Media</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Errore caricamento statistiche:', error);
    }
}

// Carica articoli
async function loadArticles() {
    try {
        const response = await fetch('http://localhost:3001/api/articles', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            articles = await response.json();
            // Usa requestAnimationFrame per ottimizzare il rendering
            requestAnimationFrame(() => displayArticles());
        }
    } catch (error) {
        console.error('Errore caricamento articoli:', error);
        showAlert('Errore nel caricamento degli articoli', 'error');
    }
}

// Mostra articoli
function displayArticles() {
    const container = document.getElementById('articlesContainer');
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="text-center">Nessun articolo trovato</p>';
        return;
    }

    // Pre-calcola le date per evitare calcoli ripetuti
    const articlesWithDates = articles.map(article => ({
        ...article,
        formattedDate: new Date(article.created_at).toLocaleDateString('it-IT'),
        shortTitle: article.title.length > 50 ? article.title.substring(0, 50) + '...' : article.title
    }));

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Titolo</th>
                    <th>Categoria</th>
                    <th>Autore</th>
                    <th>Stato</th>
                    <th>Data</th>
                    <th>Azioni</th>
                </tr>
            </thead>
            <tbody>
                ${articlesWithDates.map(article => `
                    <tr>
                        <td>${article.shortTitle}</td>
                        <td>${article.category}</td>
                        <td>${article.author_name || 'N/A'}</td>
                        <td>
                            <span class="status-badge status-${article.status}">
                                ${article.status === 'published' ? 'Pubblicato' : 'Bozza'}
                            </span>
                        </td>
                        <td>${article.formattedDate}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm edit-article-btn" data-id="${article.id}">Modifica</button>
                            ${article.status === 'draft' ? 
                                `<button class="btn btn-success btn-sm publish-article-btn" data-id="${article.id}">Pubblica</button>` : 
                                `<span class="text-success"><i class="fas fa-check"></i> Pubblicato</span>`
                            }
                            <button class="btn btn-danger btn-sm delete-article-btn" data-id="${article.id}">Elimina</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Event listeners ottimizzati con delegazione
    container.addEventListener('click', function(e) {
        const target = e.target;
        
        if (target.classList.contains('edit-article-btn')) {
            editArticle(target.dataset.id);
        } else if (target.classList.contains('publish-article-btn')) {
            publishArticle(target.dataset.id);
        } else if (target.classList.contains('delete-article-btn')) {
            deleteArticle(target.dataset.id);
        }
    });
}

// Pubblica articolo
async function publishArticle(id) {
    if (!confirm('Sei sicuro di voler pubblicare questo articolo?')) return;

    // Mostra indicatore di caricamento immediatamente
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Pubblicazione...';

    try {
        const article = articles.find(a => a.id === id);
        if (!article) {
            showAlert('Articolo non trovato', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', article.title);
        formData.append('content', article.content);
        formData.append('category', article.category || 'Generale');
        formData.append('published', 'true');

        const response = await fetch(`http://localhost:3001/api/articles/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });

        if (response.ok) {
            showAlert('Articolo pubblicato con successo!', 'success');
            // Ricarica articoli in background
            setTimeout(() => loadArticles(), 100);
        } else {
            const data = await response.json();
            console.error('Errore pubblicazione:', data);
            showAlert(data.error || 'Errore durante la pubblicazione', 'error');
        }
    } catch (error) {
        console.error('Errore pubblicazione:', error);
        showAlert('Errore di connessione', 'error');
    } finally {
        // Ripristina il pulsante
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Depubblica articolo
async function unpublishArticle(id) {
    if (!confirm('Sei sicuro di voler depubblicare questo articolo?')) return;

    // Mostra indicatore di caricamento immediatamente
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Depubblicazione...';

    try {
        const article = articles.find(a => a.id === id);
        if (!article) {
            showAlert('Articolo non trovato', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', article.title);
        formData.append('content', article.content);
        formData.append('category', article.category || 'Generale');
        formData.append('published', 'false');

        const response = await fetch(`http://localhost:3001/api/articles/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });

        if (response.ok) {
            showAlert('Articolo depubblicato con successo!', 'success');
            // Ricarica articoli in background
            setTimeout(() => loadArticles(), 100);
        } else {
            const data = await response.json();
            console.error('Errore depubblicazione:', data);
            showAlert(data.error || 'Errore durante la depubblicazione', 'error');
        }
    } catch (error) {
        console.error('Errore depubblicazione:', error);
        showAlert('Errore di connessione', 'error');
    } finally {
        // Ripristina il pulsante
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Elimina articolo
async function deleteArticle(id) {
    if (!confirm('Sei sicuro di voler eliminare questo articolo? Questa azione non può essere annullata.')) return;

    try {
        const response = await fetch(`http://localhost:3001/api/articles/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            showAlert('Articolo eliminato con successo!', 'success');
            loadArticles();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('Errore eliminazione:', error);
        showAlert('Errore di connessione', 'error');
    }
}

// Carica utenti
async function loadUsers() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showAlert('Token di autenticazione mancante. Fai logout e accedi di nuovo.', 'error');
        return;
    }
    try {
        const response = await fetch('http://localhost:3001/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            users = await response.json();
            if (!Array.isArray(users)) users = [];
            displayUsers();
        } else if (response.status === 403) {
            showAlert('Permessi insufficienti per visualizzare gli utenti.', 'error');
            users = [];
            displayUsers();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Errore durante il caricamento utenti', 'error');
            users = [];
            displayUsers();
        }
    } catch (error) {
        console.error('Errore caricamento utenti:', error);
        showAlert('Errore nel caricamento degli utenti', 'error');
        users = [];
        displayUsers();
    }
}

// Mostra utenti
function displayUsers() {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-center">Nessun utente trovato</p>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Data Registrazione</th>
                    <th>Azioni</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>
                            <span class="status-badge status-${user.role}">
                                ${user.role === 'admin' ? 'Amministratore' : 
                                  user.role === 'editor' ? 'Editore' : 'Autore'}
                            </span>
                        </td>
                        <td>${new Date(user.created_at).toLocaleDateString('it-IT')}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm edit-user-btn" data-id="${user.id}">Modifica</button>
                            ${user.id !== currentUser.id ? 
                                `<button class="btn btn-danger btn-sm delete-user-btn" data-id="${user.id}">Elimina</button>` : 
                                '<span class="text-muted">Utente corrente</span>'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    // Event listener CSP-safe
    container.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editUser(this.dataset.id);
        });
    });
    container.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteUser(this.dataset.id);
        });
    });
}

// Carica media
async function loadMedia() {
    try {
        const response = await fetch('http://localhost:3001/api/media', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            media = await response.json();
            displayMedia();
        }
    } catch (error) {
        console.error('Errore caricamento media:', error);
        showAlert('Errore nel caricamento dei media', 'error');
    }
}

// Mostra media
function displayMedia() {
    const container = document.getElementById('mediaContainer');
    
    if (media.length === 0) {
        container.innerHTML = '<p class="text-center">Nessun file media trovato</p>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nome File</th>
                    <th>Tipo</th>
                    <th>Dimensione</th>
                    <th>Data Upload</th>
                    <th>Azioni</th>
                </tr>
            </thead>
            <tbody>
                ${media.map(file => `
                    <tr>
                        <td>${file.filename}</td>
                        <td>${file.filetype}</td>
                        <td>${formatFileSize(file.filesize)}</td>
                        <td>${new Date(file.created_at).toLocaleDateString('it-IT')}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm copy-media-url-btn" data-url="${file.filepath}">Copia URL</button>
                            <button class="btn btn-danger btn-sm delete-media-btn" data-id="${file.id}">Elimina</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    // Event listener CSP-safe
    container.querySelectorAll('.copy-media-url-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            copyMediaUrl(this.dataset.url);
        });
    });
    container.querySelectorAll('.delete-media-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteMedia(this.dataset.id);
        });
    });
}

// Carica categorie
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3001/api/categories');
        if (response.ok) {
            categories = await response.json();
        }
    } catch (error) {
        console.error('Errore caricamento categorie:', error);
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function copyMediaUrl(url) {
    navigator.clipboard.writeText(`${window.location.origin}${url}`).then(() => {
        showAlert('URL copiato negli appunti!', 'success');
    }).catch(() => {
        showAlert('Errore nella copia dell\'URL', 'error');
    });
}

// Mostra alert
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fade-in`;
    alert.textContent = message;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Funzioni modali (da implementare)
function showCreateArticleModal() {
    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Nuovo Articolo</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="articleForm">
                        <div class="form-group">
                            <label for="articleTitle">Titolo *</label>
                            <input type="text" id="articleTitle" maxlength="60" required>
                            <small class="char-counter">0/60 caratteri</small>
                        </div>
                        <div class="form-group">
                            <label for="articleContent">Contenuto *</label>
                            <textarea id="articleContent" rows="10" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="articleCategory">Categoria</label>
                            <select id="articleCategory">
                                <option value="">Seleziona categoria</option>
                                ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="articleImage">Immagine di copertina</label>
                            <input type="file" id="articleImage" accept="image/*">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="articlePublished"> Pubblica immediatamente
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annulla</button>
                            <button type="submit" class="btn btn-primary">Salva Articolo</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
    
    // Event listeners
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Contatore caratteri titolo
    const titleInput = document.getElementById('articleTitle');
    const charCounter = document.querySelector('.char-counter');
    titleInput.addEventListener('input', function() {
        charCounter.textContent = `${this.value.length}/60 caratteri`;
        if (this.value.length > 55) {
            charCounter.style.color = '#e74c3c';
        } else {
            charCounter.style.color = '#666';
        }
    });
    
    // Submit form
    document.getElementById('articleForm').addEventListener('submit', createArticle);
}

async function createArticle(event) {
    event.preventDefault();
    
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    const categoryId = document.getElementById('articleCategory').value;
    const published = document.getElementById('articlePublished').checked;
    const imageFile = document.getElementById('articleImage').files[0];
    
    if (!title || !content) {
        showAlert('Titolo e contenuto sono obbligatori', 'error');
        return;
    }
    
    if (title.length > 60) {
        showAlert('Il titolo non può superare i 60 caratteri', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', categoryId);
    formData.append('published', published);
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/articles', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Articolo creato con successo!', 'success');
            closeModal();
            loadArticles();
        } else {
            showAlert(data.error || 'Errore nella creazione dell\'articolo', 'error');
        }
    } catch (error) {
        console.error('Errore creazione articolo:', error);
        showAlert('Errore di connessione', 'error');
    }
}

function editArticle(id) {
    const article = articles.find(a => a.id == id);
    if (!article) {
        showAlert('Articolo non trovato', 'error');
        return;
    }
    
    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Modifica Articolo</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editArticleForm">
                        <input type="hidden" id="editArticleId" value="${article.id}">
                        <div class="form-group">
                            <label for="editArticleTitle">Titolo *</label>
                            <input type="text" id="editArticleTitle" maxlength="60" value="${article.title}" required>
                            <small class="char-counter">${article.title.length}/60 caratteri</small>
                        </div>
                        <div class="form-group">
                            <label for="editArticleContent">Contenuto *</label>
                            <textarea id="editArticleContent" rows="10" required>${article.content}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="editArticleCategory">Categoria</label>
                            <select id="editArticleCategory">
                                <option value="">Seleziona categoria</option>
                                ${categories.map(cat => `<option value="${cat.id}" ${cat.id == article.category_id ? 'selected' : ''}>${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editArticleImage">Nuova immagine di copertina</label>
                            <input type="file" id="editArticleImage" accept="image/*">
                            ${article.featured_image ? `<p class="current-image">Immagine attuale: <img src="${article.featured_image}" style="max-width: 100px; height: auto;"></p>` : ''}
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="editArticlePublished" ${article.published ? 'checked' : ''}> Pubblicato
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annulla</button>
                            <button type="submit" class="btn btn-primary">Salva Modifiche</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
    
    // Event listeners
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Contatore caratteri titolo
    const titleInput = document.getElementById('editArticleTitle');
    const charCounter = document.querySelector('.char-counter');
    titleInput.addEventListener('input', function() {
        charCounter.textContent = `${this.value.length}/60 caratteri`;
        if (this.value.length > 55) {
            charCounter.style.color = '#e74c3c';
        } else {
            charCounter.style.color = '#666';
        }
    });
    
    // Submit form
    document.getElementById('editArticleForm').addEventListener('submit', updateArticle);
}

async function updateArticle(event) {
    event.preventDefault();
    
    const id = document.getElementById('editArticleId').value;
    const title = document.getElementById('editArticleTitle').value.trim();
    const content = document.getElementById('editArticleContent').value.trim();
    const categoryId = document.getElementById('editArticleCategory').value;
    const published = document.getElementById('editArticlePublished').checked;
    const imageFile = document.getElementById('editArticleImage').files[0];
    
    if (!title || !content) {
        showAlert('Titolo e contenuto sono obbligatori', 'error');
        return;
    }
    
    if (title.length > 60) {
        showAlert('Il titolo non può superare i 60 caratteri', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', categoryId);
    formData.append('published', published);
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const response = await fetch(`http://localhost:3001/api/articles/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Articolo aggiornato con successo!', 'success');
            closeModal();
            loadArticles();
        } else {
            showAlert(data.error || 'Errore nell\'aggiornamento dell\'articolo', 'error');
        }
    } catch (error) {
        console.error('Errore aggiornamento articolo:', error);
        showAlert('Errore di connessione', 'error');
    }
}

function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

function showCreateUserModal() {
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Nuovo Utente</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createUserForm">
                        <div class="form-group">
                            <label for="newUsername">Username *</label>
                            <input type="text" id="newUsername" required maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="newEmail">Email *</label>
                            <input type="email" id="newEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="newPassword">Password *</label>
                            <input type="password" id="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="newFullName">Nome Completo</label>
                            <input type="text" id="newFullName" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="newRole">Ruolo *</label>
                            <select id="newRole" required>
                                <option value="author">Autore</option>
                                <option value="editor">Editore</option>
                                <option value="admin">Amministratore</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annulla</button>
                            <button type="submit" class="btn btn-primary">Crea Utente</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Submit form
    document.getElementById('createUserForm').addEventListener('submit', createUser);
}

function showUploadMediaModal() {
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Carica Media</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="uploadMediaForm">
                        <div class="form-group">
                            <label for="mediaFile">Seleziona File *</label>
                            <input type="file" id="mediaFile" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" required>
                            <small>Formati supportati: immagini, video, audio, PDF, documenti</small>
                        </div>
                        <div class="form-group">
                            <label for="mediaDescription">Descrizione</label>
                            <textarea id="mediaDescription" rows="3" maxlength="200"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annulla</button>
                            <button type="submit" class="btn btn-primary">Carica File</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Submit form
    document.getElementById('uploadMediaForm').addEventListener('submit', uploadMedia);
}

// Funzioni per gestione utenti
async function createUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
    const fullName = document.getElementById('newFullName').value.trim();
    const role = document.getElementById('newRole').value;
    
    if (!username || !email || !password) {
        showAlert('Username, email e password sono obbligatori', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('La password deve essere di almeno 6 caratteri', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                username,
                email,
                password,
                full_name: fullName,
                role
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Utente creato con successo!', 'success');
            closeModal();
            loadUsers();
        } else {
            showAlert(data.error || 'Errore nella creazione dell\'utente', 'error');
        }
    } catch (error) {
        console.error('Errore creazione utente:', error);
        showAlert('Errore di connessione', 'error');
    }
}

function editUser(id) {
    const user = users.find(u => u.id == id);
    if (!user) {
        showAlert('Utente non trovato', 'error');
        return;
    }
    
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>Modifica Utente</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <input type="hidden" id="editUserId" value="${user.id}">
                        <div class="form-group">
                            <label for="editUsername">Username *</label>
                            <input type="text" id="editUsername" value="${user.username}" required maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="editEmail">Email *</label>
                            <input type="email" id="editEmail" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="editFullName">Nome Completo</label>
                            <input type="text" id="editFullName" value="${user.full_name || ''}" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="editRole">Ruolo *</label>
                            <select id="editRole" required>
                                <option value="author" ${user.role === 'author' ? 'selected' : ''}>Autore</option>
                                <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editore</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Amministratore</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editStatus">Stato</label>
                            <select id="editStatus">
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Attivo</option>
                                <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inattivo</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Annulla</button>
                            <button type="submit" class="btn btn-primary">Salva Modifiche</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Submit form
    document.getElementById('editUserForm').addEventListener('submit', updateUser);
}

async function updateUser(event) {
    event.preventDefault();
    
    const id = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const fullName = document.getElementById('editFullName').value.trim();
    const role = document.getElementById('editRole').value;
    const status = document.getElementById('editStatus').value;
    
    if (!username || !email) {
        showAlert('Username ed email sono obbligatori', 'error');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3001/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                username,
                email,
                full_name: fullName,
                role,
                status
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Utente aggiornato con successo!', 'success');
            closeModal();
            loadUsers();
        } else {
            showAlert(data.error || 'Errore nell\'aggiornamento dell\'utente', 'error');
        }
    } catch (error) {
        console.error('Errore aggiornamento utente:', error);
        showAlert('Errore di connessione', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.')) return;
    
    try {
        const response = await fetch(`http://localhost:3001/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            showAlert('Utente eliminato con successo!', 'success');
            loadUsers();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('Errore eliminazione utente:', error);
        showAlert('Errore di connessione', 'error');
    }
}

// Funzioni per gestione media
async function uploadMedia(event) {
    event.preventDefault();
    
    const file = document.getElementById('mediaFile').files[0];
    const description = document.getElementById('mediaDescription').value.trim();
    
    if (!file) {
        showAlert('Seleziona un file da caricare', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
        formData.append('description', description);
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/media', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('File caricato con successo!', 'success');
            closeModal();
            loadMedia();
        } else {
            showAlert(data.error || 'Errore nel caricamento del file', 'error');
        }
    } catch (error) {
        console.error('Errore caricamento media:', error);
        showAlert('Errore di connessione', 'error');
    }
}

async function deleteMedia(id) {
    if (!confirm('Sei sicuro di voler eliminare questo file? Questa azione non può essere annullata.')) return;
    
    try {
        const response = await fetch(`http://localhost:3001/api/media/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            showAlert('File eliminato con successo!', 'success');
            loadMedia();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Errore durante l\'eliminazione', 'error');
        }
    } catch (error) {
        console.error('Errore eliminazione media:', error);
        showAlert('Errore di connessione', 'error');
    }
} 