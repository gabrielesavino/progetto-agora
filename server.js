const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const multer  = require('multer');

const app  = express();
const PORT = 3000;

// ─────────────────────────────────────────────
//  PERCORSI DATABASE
// ─────────────────────────────────────────────
const DB = {
  users:     path.join(__dirname, 'data', 'users.json'),
  materials: path.join(__dirname, 'data', 'materials.json'),
  logs:      path.join(__dirname, 'data', 'logs.json'),
};

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Garantisce che la cartella uploads esista all'avvio
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─────────────────────────────────────────────
//  UTILITY: I/O JSON
// ─────────────────────────────────────────────
function readDB(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`[DB ERROR] Lettura fallita: ${filePath}`, err.message);
    return [];
  }
}

function writeDB(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`[DB ERROR] Scrittura fallita: ${filePath}`, err.message);
    return false;
  }
}

function generaId(prefisso = 'id') {
  return `${prefisso}_${crypto.randomBytes(6).toString('hex')}`;
}

// ─────────────────────────────────────────────
//  SISTEMA DI AUDITING (IAM LOG)
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
//  CONFIGURAZIONE MULTER — SICUREZZA FILE UPLOAD
// ─────────────────────────────────────────────

/**
 * WHITELIST estensioni sicure per ambiente scolastico.
 * Blocca tassativamente eseguibili, script e formati pericolosi.
 */
const ESTENSIONI_CONSENTITE = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.mp3',
]);

/**
 * WHITELIST MIME types corrispondenti.
 * Doppio controllo: estensione + MIME type dichiarato dal browser.
 */
const MIME_CONSENTITI = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'audio/mpeg',
  'audio/mp3',
]);

/**
 * Storage: salva i file in public/uploads/
 * con prefisso timestamp per evitare sovrascritture.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanifica il nome originale: rimuove caratteri speciali
    const nomeOriginale = file.originalname
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .toLowerCase();
    const nomeFinale = `${Date.now()}_${nomeOriginale}`;
    cb(null, nomeFinale);
  },
});

/**
 * fileFilter: valida estensione E mime type.
 * Rifiuta il file se uno dei due controlli fallisce.
 * Questo previene attacchi di tipo "double extension" (es. malware.pdf.exe)
 * e file con MIME type falsificato.
 */
const fileFilter = (req, file, cb) => {
  const estensione = path.extname(file.originalname).toLowerCase();
  const mimeType   = file.mimetype.toLowerCase();

  const estOk  = ESTENSIONI_CONSENTITE.has(estensione);
  const mimeOk = MIME_CONSENTITI.has(mimeType);

  if (estOk && mimeOk) {
    cb(null, true); // accetta
  } else {
    // Crea un errore tipizzato per identificarlo nel gestore errori
    const err = new Error(
      `Tipo di file non consentito. Estensione: '${estensione}', MIME: '${mimeType}'. ` +
      `Formati accettati: PDF, PNG, JPG, MP3.`
    );
    err.code = 'FILE_TYPE_REJECTED';
    cb(err, false); // rifiuta
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB massimo
    files: 1,                    // un file per richiesta
  },
});

// ─────────────────────────────────────────────
//  MIDDLEWARE GLOBALI
// ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
//  GET /api/status
// ─────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const users     = readDB(DB.users);
  const materials = readDB(DB.materials);
  const logs      = readDB(DB.logs);

  res.status(200).json({
    successo: true,
    messaggio: 'Il server Agorà è online e operativo.',
    applicazione: {
      nome:      'Agorà',
      versione:  '3.0.0',
      ambiente:  process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
    database: {
      utenti_registrati:  users.length,
      materiali_caricati: materials.length,
      eventi_nel_log:     logs.length,
    },
  });
});

// ─────────────────────────────────────────────
//  POST /api/register
// ─────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { username, password, nome, cognome, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ successo: false, messaggio: 'Username e password sono obbligatori.' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ successo: false, messaggio: 'Lo username deve contenere almeno 3 caratteri.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ successo: false, messaggio: 'La password deve contenere almeno 6 caratteri.' });
  }

  const users = readDB(DB.users);
  const esistente = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  if (esistente) {
    scriviLog('REGISTER_FAILED', username, 'Username già registrato');
    return res.status(409).json({ successo: false, messaggio: 'Questo username è già in uso. Scegline un altro.' });
  }

  const nuovoUtente = {
    id:                generaId('usr'),
    username:          username.trim(),
    password,
    ruolo:             'Student',
    stato:             'Active',
    nome:              nome    || '',
    cognome:           cognome || '',
    email:             email   || '',
    dataRegistrazione: new Date().toISOString(),
  };

  users.push(nuovoUtente);
  if (!writeDB(DB.users, users)) {
    return res.status(500).json({ successo: false, messaggio: 'Errore interno: impossibile salvare l\'utente.' });
  }

  scriviLog('REGISTER_SUCCESS', nuovoUtente.username, `Nuovo Student (ID: ${nuovoUtente.id})`);
  const { password: _, ...utenteSicuro } = nuovoUtente;
  res.status(201).json({ successo: true, messaggio: `Registrazione completata. Benvenuto, ${nuovoUtente.username}!`, utente: utenteSicuro });
});

// ─────────────────────────────────────────────
//  POST /api/login
// ─────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ successo: false, messaggio: 'Username e password sono obbligatori.' });
  }

  const users  = readDB(DB.users);
  const utente = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  if (!utente || utente.password !== password) {
    scriviLog('LOGIN_FAILED', username, 'Credenziali non valide');
    return res.status(401).json({ successo: false, messaggio: 'Credenziali non valide. Controlla username e password.' });
  }

  if (utente.stato === 'Banned') {
    scriviLog('LOGIN_BANNED', utente.username, `Accesso bloccato (ID: ${utente.id})`);
    return res.status(403).json({ successo: false, messaggio: 'Il tuo account è stato sospeso. Contatta un amministratore.', codice: 'ACCOUNT_BANNED' });
  }

  if (utente.stato !== 'Active') {
    scriviLog('LOGIN_FAILED', utente.username, `Stato non valido: ${utente.stato}`);
    return res.status(403).json({ successo: false, messaggio: `Account non attivo (stato: ${utente.stato}).` });
  }

  scriviLog('LOGIN_SUCCESS', utente.username, `Ruolo: ${utente.ruolo}`);
  const { password: _, ...utenteSicuro } = utente;
  res.status(200).json({ successo: true, messaggio: `Bentornato, ${utente.nome || utente.username}!`, utente: utenteSicuro });
});

// ─────────────────────────────────────────────
//  POST /api/materials/upload
//  Carica un file e salva i metadati in materials.json
// ─────────────────────────────────────────────
app.post('/api/materials/upload', (req, res) => {

  // Gestione dell'upload con Multer — intercettiamo gli errori inline
  upload.single('file')(req, res, (err) => {

    // Errore di tipo file rifiutato dal fileFilter
    if (err && err.code === 'FILE_TYPE_REJECTED') {
      scriviLog('UPLOAD_REJECTED', req.body.username || 'sconosciuto', err.message);
      return res.status(415).json({
        successo: false,
        messaggio: 'Formato file non consentito. Usa PDF, PNG, JPG o MP3.',
      });
    }

    // Errore dimensione file superata
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        successo: false,
        messaggio: 'File troppo grande. Dimensione massima consentita: 20 MB.',
      });
    }

    // Altri errori Multer o di sistema
    if (err) {
      console.error('[UPLOAD ERROR]', err);
      return res.status(500).json({
        successo: false,
        messaggio: 'Errore durante il caricamento del file.',
      });
    }

    // Nessun file ricevuto
    if (!req.file) {
      return res.status(400).json({
        successo: false,
        messaggio: 'Nessun file ricevuto. Seleziona un file da caricare.',
      });
    }

    // Validazione campi testuali
    const { titolo, materia, username } = req.body;

    if (!titolo || !titolo.trim()) {
      // Rimuove il file già salvato se la validazione fallisce
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        successo: false,
        messaggio: 'Il titolo del materiale è obbligatorio.',
      });
    }

    if (!materia || !materia.trim()) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        successo: false,
        messaggio: 'La materia è obbligatoria.',
      });
    }

    // Determina il tipo di file per l'icona nel frontend
    const estensione = path.extname(req.file.originalname).toLowerCase();
    const tipoFile = {
      '.pdf':  'pdf',
      '.png':  'immagine',
      '.jpg':  'immagine',
      '.jpeg': 'immagine',
      '.mp3':  'audio',
    }[estensione] || 'altro';

    // Costruisce il record da salvare in materials.json
    const nuovoMateriale = {
      id:           generaId('mat'),
      titolo:       titolo.trim(),
      materia:      materia.trim(),
      nomeFile:     req.file.filename,
      nomeOriginale: req.file.originalname,
      percorso:     `/uploads/${req.file.filename}`,
      dimensione:   req.file.size,
      tipoFile,
      autore:       username || 'anonimo',
      dataCaricamento: new Date().toISOString(),
    };

    const materials = readDB(DB.materials);
    materials.push(nuovoMateriale);

    if (!writeDB(DB.materials, materials)) {
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({
        successo: false,
        messaggio: 'Errore interno: impossibile salvare i metadati.',
      });
    }

    scriviLog(
      'UPLOAD_SUCCESS',
      username || 'anonimo',
      `File: ${req.file.filename} | Materia: ${materia} | Dimensione: ${(req.file.size / 1024).toFixed(1)} KB`
    );

    res.status(201).json({
      successo: true,
      messaggio: 'Materiale caricato con successo.',
      materiale: nuovoMateriale,
    });
  });
});

// ─────────────────────────────────────────────
//  GET /api/materials
//  Restituisce tutti i materiali, dal più recente
// ─────────────────────────────────────────────
app.get('/api/materials', (req, res) => {
  const materials = readDB(DB.materials);
  const ordinati  = [...materials].reverse();

  res.status(200).json({
    successo: true,
    totale: ordinati.length,
    dati: ordinati,
  });
});

// ─────────────────────────────────────────────
//  GET /api/users
// ─────────────────────────────────────────────
app.get('/api/users', (req, res) => {
  const users  = readDB(DB.users);
  const sicuri = users.map(({ password, ...r }) => r);
  res.status(200).json({ successo: true, totale: sicuri.length, dati: sicuri });
});

// ─────────────────────────────────────────────
//  GET /api/logs
// ─────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  const logs = readDB(DB.logs);
  res.status(200).json({ successo: true, totale: logs.length, dati: [...logs].reverse() });
});

// ─────────────────────────────────────────────
//  404 HANDLER
// ─────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ successo: false, messaggio: `Rotta API '${req.path}' non trovata.` });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) res.status(404).send('Pagina non trovata.');
  });
});

// ─────────────────────────────────────────────
//  AVVIO SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║                                      ║');
  console.log('  ║   🏛️  AGORÀ v3.0 — Server Avviato    ║');
  console.log('  ║                                      ║');
  console.log(`  ║   ➜  http://localhost:${PORT}            ║`);
  console.log('  ║   ➜  Multer v2 + File Security ON    ║');
  console.log('  ║                                      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  scriviLog('SERVER_START', 'sistema', `Agorà v3.0 avviato sulla porta ${PORT}`);
});