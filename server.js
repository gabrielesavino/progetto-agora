const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const multer  = require('multer');

const app  = express();
const PORT = 3000;

// ─────────────────────────────────────────────
//  DATABASE PATHS
// ─────────────────────────────────────────────
const DB = {
  users:     path.join(__dirname, 'data', 'users.json'),
  materials: path.join(__dirname, 'data', 'materials.json'),
  logs:      path.join(__dirname, 'data', 'logs.json'),
};

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─────────────────────────────────────────────
//  CATEGORIE GLOBALI (Fase 5)
//  Sostituiscono le vecchie materie scolastiche.
//  "altro" consente di aggiungere categorie nuove
//  senza modificare il server.
// ─────────────────────────────────────────────
const CATEGORIE_VALIDE = new Set([
  'Informatica & Cloud',
  'Lingue & Culture',
  'Guida Expat & Integrazione',
  'altro',
]);

// ─────────────────────────────────────────────
//  UTILITY: I/O JSON
// ─────────────────────────────────────────────
function readDB(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch (err) { console.error(`[DB ERROR] ${filePath}`, err.message); return []; }
}

function writeDB(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); return true; }
  catch (err) { console.error(`[DB ERROR] ${filePath}`, err.message); return false; }
}

function generaId(prefisso = 'id') {
  return `${prefisso}_${crypto.randomBytes(6).toString('hex')}`;
}

// ─────────────────────────────────────────────
//  AUDITING
// ─────────────────────────────────────────────
function scriviLog(evento, username, dettagli = '') {
  const logs = readDB(DB.logs);
  const entry = {
    id:        generaId('log'),
    timestamp: new Date().toISOString(),
    evento,
    username,
    dettagli,
  };
  logs.push(entry);
  writeDB(DB.logs, logs);
  console.log(`[LOG] ${entry.timestamp} | ${evento} | ${username} | ${dettagli}`);
}

// ─────────────────────────────────────────────
//  MIDDLEWARE ADMIN
// ─────────────────────────────────────────────
function verificaAdmin(req, res, next) {
  const username = req.headers['x-username'];
  if (!username) {
    return res.status(403).json({ successo: false, messaggio: 'Autenticazione richiesta.', codice: 'NO_AUTH' });
  }
  const users  = readDB(DB.users);
  const utente = users.find((u) => u.username === username);
  if (!utente || utente.ruolo !== 'Admin') {
    scriviLog('UNAUTHORIZED_ACCESS', username || 'sconosciuto', `Tentativo su: ${req.path}`);
    return res.status(403).json({ successo: false, messaggio: 'Privilegi amministrativi richiesti.', codice: 'FORBIDDEN' });
  }
  req.adminUser = utente;
  next();
}

// ─────────────────────────────────────────────
//  MULTER — SICUREZZA FILE UPLOAD
// ─────────────────────────────────────────────
const ESTENSIONI_OK = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.mp3']);
const MIME_OK       = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'audio/mpeg', 'audio/mp3',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const pulito = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_').toLowerCase();
    cb(null, `${Date.now()}_${pulito}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();
  if (ESTENSIONI_OK.has(ext) && MIME_OK.has(mime)) {
    cb(null, true);
  } else {
    const err = new Error(`Tipo non consentito: ${ext}`);
    err.code = 'FILE_TYPE_REJECTED';
    cb(err, false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024, files: 1 } });

// ─────────────────────────────────────────────
//  MIDDLEWARE GLOBALI
// ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ═════════════════════════════════════════════
//  ROTTE PUBBLICHE
// ═════════════════════════════════════════════

// GET /api/status
app.get('/api/status', (req, res) => {
  const users     = readDB(DB.users);
  const materials = readDB(DB.materials);
  const logs      = readDB(DB.logs);
  res.status(200).json({
    successo: true,
    messaggio: 'Agorà v5.0 online.',
    applicazione: { nome: 'Agorà', versione: '5.0.0', timestamp: new Date().toISOString() },
    database: {
      utenti_registrati:  users.length,
      materiali_caricati: materials.length,
      eventi_nel_log:     logs.length,
    },
    categorie: [...CATEGORIE_VALIDE],
  });
});

// POST /api/register
// Accetta ora anche il campo 'nationality'
app.post('/api/register', (req, res) => {
  const { username, password, nome, cognome, email, nationality } = req.body;

  if (!username || !password)
    return res.status(400).json({ successo: false, messaggio: 'Username e password obbligatori.' });
  if (username.trim().length < 3)
    return res.status(400).json({ successo: false, messaggio: 'Username: minimo 3 caratteri.' });
  if (password.length < 6)
    return res.status(400).json({ successo: false, messaggio: 'Password: minimo 6 caratteri.' });

  const users = readDB(DB.users);
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    scriviLog('REGISTER_FAILED', username, 'Username già esistente');
    return res.status(409).json({ successo: false, messaggio: 'Username già in uso.' });
  }

  const nuovoUtente = {
    id:                generaId('usr'),
    username:          username.trim(),
    password,
    ruolo:             'Student',
    stato:             'Active',
    nome:              nome        || '',
    cognome:           cognome     || '',
    email:             email       || '',
    nationality:       nationality || '',   // ← Fase 5: nazionalità/community
    dataRegistrazione: new Date().toISOString(),
  };

  users.push(nuovoUtente);
  if (!writeDB(DB.users, users))
    return res.status(500).json({ successo: false, messaggio: 'Errore interno.' });

  scriviLog('REGISTER_SUCCESS', nuovoUtente.username,
    `ID: ${nuovoUtente.id} | Nazionalità: ${nuovoUtente.nationality || 'non specificata'}`);

  const { password: _, ...safe } = nuovoUtente;
  res.status(201).json({ successo: true, messaggio: `Benvenuto, ${nuovoUtente.username}!`, utente: safe });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ successo: false, messaggio: 'Credenziali obbligatorie.' });

  const users  = readDB(DB.users);
  const utente = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  if (!utente || utente.password !== password) {
    scriviLog('LOGIN_FAILED', username, 'Credenziali non valide');
    return res.status(401).json({ successo: false, messaggio: 'Credenziali non valide.' });
  }
  if (utente.stato === 'Banned') {
    scriviLog('LOGIN_BANNED', utente.username, `ID: ${utente.id}`);
    return res.status(403).json({
      successo: false,
      messaggio: 'Account sospeso. Contatta un amministratore.',
      codice: 'ACCOUNT_BANNED',
    });
  }
  if (utente.stato !== 'Active') {
    scriviLog('LOGIN_FAILED', utente.username, `Stato: ${utente.stato}`);
    return res.status(403).json({ successo: false, messaggio: `Account non attivo (${utente.stato}).` });
  }

  scriviLog('LOGIN_SUCCESS', utente.username, `Ruolo: ${utente.ruolo}`);
  const { password: _, ...safe } = utente;
  res.status(200).json({
    successo: true,
    messaggio: `Bentornato, ${utente.nome || utente.username}!`,
    utente: safe,
  });
});

// POST /api/materials/upload
// Il campo 'materia' ora accetta le 3 categorie globali (+ 'altro')
app.post('/api/materials/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err && err.code === 'FILE_TYPE_REJECTED') {
      scriviLog('UPLOAD_REJECTED', req.body.username || '?', err.message);
      return res.status(415).json({ successo: false, messaggio: 'Formato non consentito. Usa PDF, PNG, JPG o MP3.' });
    }
    if (err && err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({ successo: false, messaggio: 'File troppo grande. Max 20 MB.' });
    if (err)
      return res.status(500).json({ successo: false, messaggio: 'Errore durante il caricamento.' });
    if (!req.file)
      return res.status(400).json({ successo: false, messaggio: 'Nessun file ricevuto.' });

    const { titolo, materia, categoriaCustom, username } = req.body;

    if (!titolo || !titolo.trim()) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ successo: false, messaggio: 'Titolo obbligatorio.' });
    }

    // Gestione categoria: accetta le 3 standard + qualsiasi stringa se "altro"
    let categoriaFinale = materia ? materia.trim() : '';
    if (materia === 'altro' && categoriaCustom && categoriaCustom.trim()) {
      categoriaFinale = categoriaCustom.trim();
    }
    if (!categoriaFinale) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ successo: false, messaggio: 'Categoria obbligatoria.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const tipoFile = { '.pdf': 'pdf', '.png': 'immagine', '.jpg': 'immagine', '.jpeg': 'immagine', '.mp3': 'audio' }[ext] || 'altro';

    const nuovoMateriale = {
      id:              generaId('mat'),
      titolo:          titolo.trim(),
      materia:         categoriaFinale,
      nomeFile:        req.file.filename,
      nomeOriginale:   req.file.originalname,
      percorso:        `/uploads/${req.file.filename}`,
      dimensione:      req.file.size,
      tipoFile,
      autore:          username || 'anonimo',
      dataCaricamento: new Date().toISOString(),
    };

    const materials = readDB(DB.materials);
    materials.push(nuovoMateriale);
    if (!writeDB(DB.materials, materials)) {
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ successo: false, messaggio: 'Errore salvataggio metadati.' });
    }

    scriviLog('UPLOAD_SUCCESS', username || 'anonimo',
      `${req.file.filename} | ${categoriaFinale} | ${(req.file.size / 1024).toFixed(1)} KB`);
    res.status(201).json({ successo: true, messaggio: 'Materiale caricato con successo.', materiale: nuovoMateriale });
  });
});

// GET /api/materials
app.get('/api/materials', (req, res) => {
  const materials = readDB(DB.materials);
  res.status(200).json({ successo: true, totale: materials.length, dati: [...materials].reverse() });
});

// GET /api/users
app.get('/api/users', (req, res) => {
  const users = readDB(DB.users);
  res.status(200).json({ successo: true, totale: users.length, dati: users.map(({ password, ...r }) => r) });
});

// GET /api/logs
app.get('/api/logs', (req, res) => {
  const logs = readDB(DB.logs);
  res.status(200).json({ successo: true, totale: logs.length, dati: [...logs].reverse() });
});

// ═════════════════════════════════════════════
//  ROTTE ADMIN PROTETTE
// ═════════════════════════════════════════════

app.get('/api/admin/logs', verificaAdmin, (req, res) => {
  const logs = readDB(DB.logs);
  res.status(200).json({ successo: true, totale: logs.length, dati: [...logs].reverse() });
});

app.get('/api/admin/users', verificaAdmin, (req, res) => {
  const users = readDB(DB.users);
  res.status(200).json({ successo: true, totale: users.length, dati: users.map(({ password, ...r }) => r) });
});

app.post('/api/admin/update-user', verificaAdmin, (req, res) => {
  const { targetUsername, nuovoRuolo, nuovoStato } = req.body;
  if (!targetUsername)
    return res.status(400).json({ successo: false, messaggio: 'targetUsername obbligatorio.' });

  const ruoliValidi = ['Student', 'Admin'];
  const statiValidi = ['Active', 'Banned'];
  if (nuovoRuolo && !ruoliValidi.includes(nuovoRuolo))
    return res.status(400).json({ successo: false, messaggio: `Ruolo non valido: ${nuovoRuolo}` });
  if (nuovoStato && !statiValidi.includes(nuovoStato))
    return res.status(400).json({ successo: false, messaggio: `Stato non valido: ${nuovoStato}` });

  const users = readDB(DB.users);
  const idx   = users.findIndex((u) => u.username === targetUsername);
  if (idx === -1)
    return res.status(404).json({ successo: false, messaggio: `Utente '${targetUsername}' non trovato.` });
  if (targetUsername === req.adminUser.username && nuovoStato === 'Banned')
    return res.status(400).json({ successo: false, messaggio: 'Non puoi bannare il tuo stesso account.' });

  const modifiche = [];
  if (nuovoRuolo && nuovoRuolo !== users[idx].ruolo) {
    modifiche.push(`Ruolo: ${users[idx].ruolo} → ${nuovoRuolo}`);
    users[idx].ruolo = nuovoRuolo;
  }
  if (nuovoStato && nuovoStato !== users[idx].stato) {
    modifiche.push(`Stato: ${users[idx].stato} → ${nuovoStato}`);
    users[idx].stato = nuovoStato;
  }

  if (modifiche.length === 0)
    return res.status(200).json({ successo: true, messaggio: 'Nessuna modifica applicata.', utente: users[idx] });

  if (!writeDB(DB.users, users))
    return res.status(500).json({ successo: false, messaggio: 'Errore interno.' });

  scriviLog('USER_MANAGEMENT_ACTION', req.adminUser.username,
    `Target: ${targetUsername} | ${modifiche.join(' | ')}`);

  const { password: _, ...safe } = users[idx];
  res.status(200).json({
    successo: true,
    messaggio: `Utente '${targetUsername}' aggiornato: ${modifiche.join(', ')}.`,
    utente: safe,
  });
});

// ─────────────────────────────────────────────
//  404
// ─────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/'))
    return res.status(404).json({ successo: false, messaggio: `Rotta '${req.path}' non trovata.` });
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) res.status(404).send('Pagina non trovata.');
  });
});

// ─────────────────────────────────────────────
//  AVVIO
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║                                      ║');
  console.log('  ║   🌍  AGORÀ v5.0 — Server Avviato    ║');
  console.log('  ║                                      ║');
  console.log(`  ║   ➜  http://localhost:${PORT}            ║`);
  console.log('  ║   ➜  Internazionale + 3 Categorie   ║');
  console.log('  ║                                      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  scriviLog('SERVER_START', 'sistema', `Agorà v5.0 avviato sulla porta ${PORT}`);
});