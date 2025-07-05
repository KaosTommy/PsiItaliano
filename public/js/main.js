// Funzioni per la gestione degli articoli
async function loadArticles() {
    const container = document.getElementById('articlesList');
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Caricamento articoli...</p>
        </div>
    `;
    
    try {
        const res = await fetch('/api/articles?status=published');
        if (!res.ok) throw new Error('Errore caricamento');
        const articles = await res.json();
        
        if (!Array.isArray(articles) || articles.length === 0) {
            container.innerHTML = `
                <div class="no-articles">
                    <i class="fas fa-newspaper" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Nessun articolo pubblicato al momento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = articles.map((a, index) => {
            const contentPreview = a.content.length > 300 ? 
                a.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 300) + '...' : 
                a.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            return `
                <div class="article-card" style="animation-delay: ${index * 0.1}s;">
                    <div class="article-category">${a.category || 'Generale'}</div>
                    <h2>${a.title}</h2>
                    <div class="article-meta">
                        ${a.author_name ? `<span><i class="fas fa-user"></i> ${a.author_name}</span> • ` : ''}
                        <span><i class="fas fa-calendar"></i> ${new Date(a.published_at || a.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div class="article-content">${contentPreview}</div>
                    <div style="margin-top: 1rem;">
                        <a href="/article/${a.id}" class="link-highlight" onclick="readMore(event, '${a.id}')">
                            <i class="fas fa-arrow-right"></i> Leggi tutto
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        
        // Aggiungi animazione fadeInUp agli articoli
        const cards = container.querySelectorAll('.article-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
    } catch (e) {
        console.error('Errore caricamento articoli:', e);
        container.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--psi-red);"></i>
                <p>Errore nel caricamento degli articoli.</p>
            </div>
        `;
    }
}

// Funzione per scroll smooth alle sezioni
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Funzione per leggere tutto l'articolo
function readMore(event, articleId) {
    event.preventDefault();
    
    // Mostra un overlay di caricamento
    const overlay = document.createElement('div');
    overlay.className = 'article-overlay';
    overlay.innerHTML = `
        <div class="article-modal">
            <div class="article-modal-header">
                <h2>Caricamento articolo...</h2>
                <button class="article-modal-close">&times;</button>
            </div>
            <div class="article-modal-body">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Caricamento in corso...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Carica l'articolo completo
    fetch(`/api/articles/${articleId}`)
        .then(res => res.json())
        .then(article => {
            overlay.innerHTML = `
                <div class="article-modal">
                    <div class="article-modal-header">
                        <h2>${article.title}</h2>
                        <button class="article-modal-close">&times;</button>
                    </div>
                    <div class="article-modal-body">
                        <div class="article-full-content">
                            <div class="article-meta">
                                ${article.author_name ? `<span><i class="fas fa-user"></i> ${article.author_name}</span> • ` : ''}
                                <span><i class="fas fa-calendar"></i> ${new Date(article.published_at || article.created_at).toLocaleDateString('it-IT')}</span>
                                ${article.category ? ` • <span><i class="fas fa-tag"></i> ${article.category}</span>` : ''}
                            </div>
                            ${article.featured_image ? `<img src="${article.featured_image}" alt="${article.title}" class="article-image">` : ''}
                            <div class="article-text">${article.content.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Event listener per chiudere
            overlay.querySelector('.article-modal-close').addEventListener('click', () => {
                document.body.removeChild(overlay);
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });
        })
        .catch(error => {
            console.error('Errore caricamento articolo:', error);
            overlay.innerHTML = `
                <div class="article-modal">
                    <div class="article-modal-header">
                        <h2>Errore</h2>
                        <button class="article-modal-close">&times;</button>
                    </div>
                    <div class="article-modal-body">
                        <p>Errore nel caricamento dell'articolo. Riprova più tardi.</p>
                    </div>
                </div>
            `;
            
            overlay.querySelector('.article-modal-close').addEventListener('click', () => {
                document.body.removeChild(overlay);
            });
        });
}

// Animazioni al scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Osserva tutti gli elementi con animazione
    const animatedElements = document.querySelectorAll('.content-card, .section-title, .card-icon');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Hamburger menu mobile
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    function closeMenu() {
        navMenu.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        mobileOverlay.classList.remove('show');
        document.body.classList.remove('no-scroll');
    }

    function openMenu() {
        navMenu.classList.add('open');
        hamburgerBtn.classList.add('open');
        mobileOverlay.classList.add('show');
        document.body.classList.add('no-scroll');
    }

    if (hamburgerBtn && navMenu && mobileOverlay) {
        // Apri menu
        hamburgerBtn.addEventListener('click', openMenu);

        // Chiudi con overlay
        mobileOverlay.addEventListener('click', closeMenu);

        // Chiudi con pulsante X
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMenu);
        }

        // Chiudi con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                closeMenu();
            }
        });

        // Chiudi cliccando ovunque fuori dal menu
        document.addEventListener('click', function(e) {
            if (navMenu.classList.contains('open') && 
                !navMenu.contains(e.target) && 
                !hamburgerBtn.contains(e.target)) {
                closeMenu();
            }
        });

        // Chiudi con click sui link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
}

// Gestisci URL degli articoli
function handleArticleURL() {
    const path = window.location.pathname;
    const articleMatch = path.match(/^\/article\/(\d+)$/);
    
    if (articleMatch) {
        const articleId = articleMatch[1];
        console.log('Caricamento articolo da URL:', articleId);
        
        // Mostra overlay di caricamento
        const overlay = document.createElement('div');
        overlay.className = 'article-overlay';
        overlay.innerHTML = `
            <div class="article-modal">
                <div class="article-modal-header">
                    <h2>Caricamento articolo...</h2>
                    <button class="article-modal-close">&times;</button>
                </div>
                <div class="article-modal-body">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Caricamento in corso...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Carica l'articolo
        fetch(`/api/articles/${articleId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Articolo non trovato');
                }
                return res.json();
            })
            .then(article => {
                overlay.innerHTML = `
                    <div class="article-modal">
                        <div class="article-modal-header">
                            <h2>${article.title}</h2>
                            <button class="article-modal-close">&times;</button>
                        </div>
                        <div class="article-modal-body">
                            <div class="article-full-content">
                                <div class="article-meta">
                                    ${article.author_name ? `<span><i class="fas fa-user"></i> ${article.author_name}</span> • ` : ''}
                                    <span><i class="fas fa-calendar"></i> ${new Date(article.published_at || article.created_at).toLocaleDateString('it-IT')}</span>
                                    ${article.category ? ` • <span><i class="fas fa-tag"></i> ${article.category}</span>` : ''}
                                </div>
                                ${article.featured_image ? `<img src="${article.featured_image}" alt="${article.title}" class="article-image">` : ''}
                                <div class="article-text">${article.content.replace(/\n/g, '<br>')}</div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Event listener per chiudere
                overlay.querySelector('.article-modal-close').addEventListener('click', () => {
                    document.body.removeChild(overlay);
                    // Torna alla homepage
                    window.history.pushState({}, '', '/');
                });
                
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                        // Torna alla homepage
                        window.history.pushState({}, '', '/');
                    }
                });
            })
            .catch(error => {
                console.error('Errore caricamento articolo:', error);
                overlay.innerHTML = `
                    <div class="article-modal">
                        <div class="article-modal-header">
                            <h2>Articolo non trovato</h2>
                            <button class="article-modal-close">&times;</button>
                        </div>
                        <div class="article-modal-body">
                            <p>L'articolo richiesto non esiste o non è più disponibile.</p>
                            <button class="btn btn-primary" onclick="window.location.href='/'">Torna alla Homepage</button>
                        </div>
                    </div>
                `;
                
                overlay.querySelector('.article-modal-close').addEventListener('click', () => {
                    document.body.removeChild(overlay);
                    window.location.href = '/';
                });
            });
    }
}

// Effetto parallax per il hero
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        const heroParticles = document.querySelector('.hero-particles');
        
        if (heroSection && heroParticles) {
            const rate = scrolled * -0.5;
            heroParticles.style.transform = `translateY(${rate}px)`;
        }
    });
}

// Scroll sempre in cima alla pagina al caricamento
function scrollToTop() {
    // Forza lo scroll in cima immediatamente
    window.scrollTo(0, 0);
    
    // Riprova dopo un breve delay per sicurezza
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 100);
    
    // Riprova ancora dopo che tutto è caricato
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 500);
}

// Inizializzazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
    // Scroll in cima alla pagina
    scrollToTop();
    
    // Inizializza menu hamburger
    initHamburgerMenu();
    
    // Gestisci URL degli articoli
    handleArticleURL();
    
    // Carica articoli
    loadArticles();
    
    // Carica media
    loadMedia();
    
    // Inizializza animazioni
    initScrollAnimations();
    initParallax();
    
    // Smooth scroll per i link di navigazione
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
    
    // Effetto hover per i pulsanti
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Animazione del logo
    const logoCircle = document.querySelector('.logo-circle');
    if (logoCircle) {
        logoCircle.addEventListener('click', function() {
            this.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                this.style.animation = 'pulse 2s infinite';
            }, 500);
        });
    }
});

// Funzioni per la gestione dei media
async function loadMedia() {
    const container = document.getElementById('mediaList');
    if (!container) return; // Se non esiste la sezione media, esci
    
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Caricamento media...</p>
        </div>
    `;
    
    try {
        const res = await fetch('http://localhost:3001/api/media');
        if (!res.ok) throw new Error('Errore caricamento');
        const media = await res.json();
        
        if (!Array.isArray(media) || media.length === 0) {
            container.innerHTML = `
                <div class="no-articles">
                    <i class="fas fa-file" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Nessun media disponibile al momento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = media.map((item, index) => {
            const isImage = item.mime_type && item.mime_type.startsWith('image/');
            
            if (!isImage) return ''; // Mostra solo immagini
            
            const photoDate = item.photo_date ? new Date(item.photo_date).toLocaleDateString('it-IT') : 'Data non specificata';
            const title = item.title || item.original_name;
            const description = item.description || '';
            
            return `
                <div class="photo-card" style="animation-delay: ${index * 0.1}s;">
                    <div class="photo-image">
                        <img src="${item.url}" alt="${title}" loading="lazy">
                    </div>
                    <div class="photo-info">
                        <h3 class="photo-title">${title}</h3>
                        ${description ? `<p class="photo-description">${description}</p>` : ''}
                        <div class="photo-meta">
                            <span><i class="fas fa-calendar"></i> ${photoDate}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Aggiungi animazione fadeInUp alle foto
        const cards = container.querySelectorAll('.photo-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
    } catch (e) {
        console.error('Errore caricamento media:', e);
        container.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--psi-red);"></i>
                <p>Errore nel caricamento dei media.</p>
            </div>
        `;
    }
}

// Funzione per formattare la dimensione dei file
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Funzione per copiare l'URL del media
function copyMediaUrl(url) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => {
        // Mostra un feedback visivo
        const button = event.target.closest('.media-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiato!';
        button.style.background = '#28a745';
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Errore copia:', err);
        alert('Errore nella copia del link');
    });
}