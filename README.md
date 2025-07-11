# 🔴 PSI CMS - Sistema di Gestione Contenuti

Sistema di gestione contenuti moderno e sicuro per il Partito Socialista Italiano, con pannello di amministrazione completo e homepage dinamica.

## ✨ Caratteristiche Principali

### 🎨 Frontend
- **Homepage moderna** con design PSI ufficiale
- **Animazioni fluide** e responsive design
- **Sezioni dinamiche**: Notizie, Documenti, Video
- **Sfondo animato** con particelle interattive
- **Sezione donazioni** 2×1000 integrata

### 🔐 Backend Sicuro
- **Autenticazione JWT** con token sicuri
- **Password criptate** con bcrypt
- **Validazione input** completa
- **Rate limiting** per prevenire attacchi
- **CORS configurato** per sicurezza
- **Helmet** per headers di sicurezza
- **Sanitizzazione** dei dati in input

### 👥 Sistema Multiutente
- **Ruoli gerarchici**: Admin, Editor, Autore
- **Permessi granulari** per ogni operazione
- **Gestione utenti** completa
- **Profilo utente** personalizzato

### 📝 Gestione Contenuti
- **Articoli** con stati (bozza/pubblicato)
- **Categorie** personalizzabili
- **Media manager** integrato
- **Editor WYSIWYG** (in sviluppo)
- **SEO friendly** URLs

## 🚀 Installazione

### Prerequisiti
- Node.js 16+ 
- npm o yarn

### Setup Rapido

1. **Clona il repository**
```bash
git clone <repository-url>
cd GelaoTommasoPSI
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Inizializza il database**
```bash
npm run init-db
```

4. **Avvia il server**
```bash
npm start
```

5. **Accedi al sistema**
- **Homepage**: http://localhost:3000
- **Pannello Admin**: http://localhost:3000/admin
- **Credenziali default**: 
  - Username: `admin`
  - Password: `admin123`

## 🧪 Test del Sistema

Esegui i test automatici per verificare il funzionamento:

```bash
node test-system.js
```

## 📁 Struttura del Progetto

```
GelaoTommasoPSI/
├── home.html              # Homepage principale
├── server.js              # Server Express principale
├── package.json           # Dipendenze e script
├── psi_cms.db            # Database SQLite
├── admin/                 # Pannello amministrazione
│   ├── index.html        # Pagina admin
│   ├── styles.css        # Stili admin
│   └── script.js         # JavaScript admin
├── scripts/
│   └── init-database.js  # Script inizializzazione DB
├── uploads/              # File caricati
└── test-system.js        # Script di test
```

## 🔧 Configurazione

### Variabili d'Ambiente
Crea un file `.env` per personalizzare:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### Database
Il sistema utilizza SQLite per semplicità. Per produzione, considera:
- PostgreSQL
- MySQL
- MongoDB

## 👤 Ruoli e Permessi

### 🔴 Admin
- Gestione completa utenti
- Pubblicazione/eliminazione articoli
- Gestione media
- Configurazione sistema

### 📝 Editor
- Creazione/modifica articoli
- Pubblicazione articoli propri e altrui
- Upload media
- Gestione categorie

### ✍️ Autore
- Creazione articoli propri
- Modifica articoli propri
- Upload media personali

## 🔒 Sicurezza

### Implementata
- ✅ Autenticazione JWT
- ✅ Password criptate (bcrypt)
- ✅ Validazione input
- ✅ Rate limiting
- ✅ CORS configurato
- ✅ Headers di sicurezza (Helmet)
- ✅ Sanitizzazione dati
- ✅ Controllo accessi per ruolo

### Raccomandazioni per Produzione
- 🔐 Usa HTTPS
- 🔑 Cambia JWT_SECRET
- 🗄️ Usa database enterprise
- 📊 Implementa logging
- 🔍 Aggiungi monitoraggio
- 🛡️ Configura firewall

## 📱 Responsive Design

Il sistema è completamente responsive:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large (1440px+)

## 🎨 Personalizzazione

### Colori PSI
```css
--psi-red: #d32f2f
--psi-red-dark: #c41e3a
--psi-white: #ffffff
--psi-black: #000000
```

### Modifica Stili
- `home.html` - Homepage
- `admin/styles.css` - Pannello admin
- `admin/script.js` - Funzionalità admin

## 🚀 Deployment

### Vercel (Raccomandato)
```bash
npm install -g vercel
vercel
```

### Heroku
```bash
heroku create psi-cms
git push heroku main
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔄 Aggiornamenti

### Backup Database
```bash
cp psi_cms.db backup_$(date +%Y%m%d).db
```

### Aggiornamento Sistema
```bash
git pull origin main
npm install
npm run init-db
```

## 🐛 Troubleshooting

### Problemi Comuni

**Server non si avvia**
```bash
# Verifica porta
lsof -i :3000
# Cambia porta in .env
PORT=3001
```

**Errore database**
```bash
# Ricrea database
rm psi_cms.db
npm run init-db
```

**Problemi login**
```bash
# Reset password admin
npm run reset-admin
```

## 📞 Supporto

Per supporto tecnico:
- 📧 Email: support@psi-cms.it
- 💬 Discord: PSI CMS Community
- 📖 Wiki: docs.psi-cms.it

## 📄 Licenza

MIT License - Vedi file `LICENSE` per dettagli.

## 🤝 Contributi

Benvenuti i contributi! Per contribuire:

1. Fork il progetto
2. Crea branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 🎯 Roadmap

### Prossime Funzionalità
- [ ] Editor WYSIWYG avanzato
- [ ] Sistema di commenti
- [ ] Newsletter integrata
- [ ] Analytics dashboard
- [ ] API pubblica
- [ ] Multi-lingua
- [ ] Backup automatico
- [ ] Notifiche push

### Miglioramenti Sicurezza
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit log completo
- [ ] Backup crittografato
- [ ] WAF (Web Application Firewall)

---

**🔴 PSI CMS** - Potenza al Popolo, Tecnologia al Servizio della Democrazia

## 🛠️ Tecnologie

- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (better-sqlite3)
- **Autenticazione**: JWT, bcryptjs
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Upload**: Multer
- **Sicurezza**: Helmet, CORS, Rate Limiting

## 📦 Installazione Locale

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd GelaoTommasoPSI
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Inizializza il database**
   ```bash
   npm run init-db
   ```

4. **Avvia il server**
   ```bash
   npm start
   ```

5. **Accedi all'applicazione**
   - Frontend: http://localhost:3001
   - Admin Panel: http://localhost:3001/admin
   - Credenziali admin: admin@partitosocialista.it / admin123

## 🌐 Deploy su Railway

### Prerequisiti
- Account Railway (https://railway.app)
- Repository Git configurato

### Passi per il Deploy

1. **Prepara il repository**
   ```bash
   git add .
   git commit -m "Preparazione deploy Railway"
   git push origin main
   ```

2. **Deploy su Railway**
   - Vai su https://railway.app
   - Clicca "New Project"
   - Seleziona "Deploy from GitHub repo"
   - Seleziona il tuo repository
   - Railway rileverà automaticamente che è un progetto Node.js

3. **Configurazione automatica**
   - Railway userà il file `railway.json` per la configurazione
   - Il database SQLite verrà creato automaticamente
   - L'admin verrà creato con le credenziali di default

4. **Variabili d'ambiente (opzionali)**
   - `PORT`: Porta del server (Railway lo imposta automaticamente)
   - `JWT_SECRET`: Chiave segreta per JWT (usa una chiave sicura in produzione)

5. **Accesso all'applicazione**
   - Railway fornirà un URL pubblico
   - Admin Panel: `https://tuo-app.railway.app/admin`
   - Credenziali: admin@partitosocialista.it / admin123

## 🔧 Script Disponibili

- `npm start` - Avvia il server di produzione
- `npm run dev` - Avvia il server in modalità sviluppo con nodemon
- `npm run init-db` - Inizializza il database e crea l'admin
- `npm run build` - Script di build per Railway

## 📁 Struttura del Progetto

```
GelaoTommasoPSI/
├── admin/                 # Admin panel
├── database/             # File database e configurazione
├── public/               # Frontend pubblico
├── routes/               # Route API (non utilizzate, integrate in server.js)
├── scripts/              # Script di utilità
├── uploads/              # File caricati
├── server.js             # Server principale
├── package.json          # Dipendenze e script
└── railway.json          # Configurazione Railway
```

## 🔐 Sicurezza

- **Helmet.js** per headers di sicurezza
- **CORS** configurato per origini specifiche
- **Rate Limiting** per prevenire abusi
- **Validazione input** su tutte le API
- **JWT** per autenticazione sicura
- **bcrypt** per hash delle password

## 🎨 UI/UX

- **Design Responsive** per tutti i dispositivi
- **Menu Hamburger** per mobile
- **Animazioni CSS** moderne
- **Scrollbar personalizzata**
- **Icone e colori PSI**

## 📊 Funzionalità Admin

- **Dashboard** con statistiche
- **Gestione Utenti** (CRUD completo)
- **Gestione Articoli** con editor WYSIWYG
- **Gestione Media** con upload file
- **Sistema di Ruoli** e permessi
- **Categorie** personalizzabili

## 🔄 API Endpoints

### Autenticazione
- `POST /api/login` - Login utente
- `GET /api/verify` - Verifica token

### Utenti
- `GET /api/users` - Lista utenti
- `POST /api/users` - Crea utente
- `PUT /api/users/:id` - Aggiorna utente
- `DELETE /api/users/:id` - Elimina utente

### Articoli
- `GET /api/articles` - Lista articoli
- `GET /api/articles/:id` - Dettaglio articolo
- `POST /api/articles` - Crea articolo
- `PUT /api/articles/:id` - Aggiorna articolo
- `DELETE /api/articles/:id` - Elimina articolo

### Media
- `GET /api/media` - Lista media
- `POST /api/media` - Upload file
- `PUT /api/media/:id` - Aggiorna media
- `DELETE /api/media/:id` - Elimina media

### Categorie
- `GET /api/categories` - Lista categorie

### Dashboard
- `GET /api/dashboard/stats` - Statistiche

## 🐛 Risoluzione Problemi

### Problemi Comuni

1. **Errore "Database locked"**
   - Riavvia il server
   - Verifica che non ci siano altre istanze in esecuzione

2. **Errore "Port already in use"**
   - Cambia la porta nel file `server.js`
   - Usa `process.env.PORT` per Railway

3. **Problemi di upload file**
   - Verifica che la cartella `uploads/` esista
   - Controlla i permessi della cartella

4. **Errore "Invalid ELF header" su Railway**
   - Risolto usando `better-sqlite3` invece di `sqlite3`
   - Il progetto è ora ottimizzato per Railway

### Log e Debug

- I log del server sono visibili nella console
- Railway mostra i log nel dashboard
- Usa `console.log()` per debug

## 📝 Licenza

MIT License - Vedi file LICENSE per dettagli.

## 🤝 Contributi

1. Fork il progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📞 Supporto

Per supporto o domande:
- Email: admin@partitosocialista.it
- Issues: GitHub Issues

---

**PSI CMS** - Sistema di Gestione Contenuti per il Partito Socialista Italiano