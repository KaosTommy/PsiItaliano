const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testSystem() {
    console.log('🔴 Test del Sistema PSI CMS\n');
    
    try {
        // Test 1: Verifica server attivo
        console.log('1. Test connessione server...');
        const healthResponse = await fetch(`${BASE_URL}/`);
        if (healthResponse.ok) {
            console.log('✅ Server attivo e funzionante');
        } else {
            console.log('❌ Server non risponde correttamente');
            return;
        }
        
        // Test 2: Login con credenziali di default
        console.log('\n2. Test login...');
        const loginResponse = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login effettuato con successo');
            console.log(`   Utente: ${loginData.user.username} (${loginData.user.role})`);
            
            const token = loginData.token;
            
            // Test 3: Verifica token
            console.log('\n3. Test verifica token...');
            const verifyResponse = await fetch(`${BASE_URL}/api/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (verifyResponse.ok) {
                console.log('✅ Token valido');
            } else {
                console.log('❌ Token non valido');
                return;
            }
            
            // Test 4: Caricamento articoli
            console.log('\n4. Test caricamento articoli...');
            const articlesResponse = await fetch(`${BASE_URL}/api/articles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (articlesResponse.ok) {
                const articles = await articlesResponse.json();
                console.log(`✅ Articoli caricati: ${articles.length} trovati`);
            } else {
                console.log('❌ Errore nel caricamento articoli');
            }
            
            // Test 5: Caricamento utenti
            console.log('\n5. Test caricamento utenti...');
            const usersResponse = await fetch(`${BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                console.log(`✅ Utenti caricati: ${users.length} trovati`);
            } else {
                console.log('❌ Errore nel caricamento utenti');
            }
            
            // Test 6: Statistiche dashboard
            console.log('\n6. Test statistiche dashboard...');
            const statsResponse = await fetch(`${BASE_URL}/api/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                console.log('✅ Statistiche caricate:');
                console.log(`   - Utenti: ${stats.users}`);
                console.log(`   - Articoli: ${stats.articles}`);
                console.log(`   - Pubblicati: ${stats.published}`);
                console.log(`   - Media: ${stats.media}`);
            } else {
                console.log('❌ Errore nel caricamento statistiche');
            }
            
            // Test 7: Creazione articolo di test
            console.log('\n7. Test creazione articolo...');
            const newArticleResponse = await fetch(`${BASE_URL}/api/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Articolo di Test',
                    content: 'Questo è un articolo di test per verificare il funzionamento del sistema.',
                    category: 'test',
                    status: 'draft'
                })
            });
            
            if (newArticleResponse.ok) {
                const newArticle = await newArticleResponse.json();
                console.log('✅ Articolo di test creato con successo');
                console.log(`   ID: ${newArticle.id}`);
                
                // Test 8: Pubblicazione articolo
                console.log('\n8. Test pubblicazione articolo...');
                const publishResponse = await fetch(`${BASE_URL}/api/articles/${newArticle.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: 'Articolo di Test',
                        content: 'Questo è un articolo di test per verificare il funzionamento del sistema.',
                        category: 'test',
                        status: 'published'
                    })
                });
                
                if (publishResponse.ok) {
                    console.log('✅ Articolo pubblicato con successo');
                } else {
                    console.log('❌ Errore nella pubblicazione');
                }
                
                // Test 9: Eliminazione articolo di test
                console.log('\n9. Test eliminazione articolo...');
                const deleteResponse = await fetch(`${BASE_URL}/api/articles/${newArticle.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (deleteResponse.ok) {
                    console.log('✅ Articolo di test eliminato con successo');
                } else {
                    console.log('❌ Errore nell\'eliminazione');
                }
            } else {
                console.log('❌ Errore nella creazione articolo');
            }
            
        } else {
            console.log('❌ Login fallito');
            const errorData = await loginResponse.json();
            console.log(`   Errore: ${errorData.error}`);
        }
        
    } catch (error) {
        console.error('❌ Errore durante il test:', error.message);
    }
    
    console.log('\n🎉 Test completati!');
    console.log('\nPer accedere al pannello admin:');
    console.log(`   URL: ${BASE_URL}/admin`);
    console.log('   Username: admin');
    console.log('   Password: admin123');
}

// Esegui il test se il file viene chiamato direttamente
if (require.main === module) {
    testSystem();
}

module.exports = { testSystem }; 