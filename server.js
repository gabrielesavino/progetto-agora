const express = require('express');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

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

// ─────────────────────────────────────────────
//  UTILITY: I/O sui file JSON
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

// ─────────────────────────────────────────────
//  UTILITY: Generazione ID univoco
// ─────────────────────────────────────────────
function generaId(prefisso = 'id') {
  return `${prefisso}_${crypto.randomBytes(6).toString('hex')}`;
}

// ─────────────────────────────────────────────
//  SISTEMA DI AUDITING (IAM LOG)
//  Tipi di evento supportati:
//    LOGIN_SUCCESS  - Login avvenuto con successo
//    LOGIN_FAILED   - Credenziali errate
//    LOGIN_BANNED   - Accesso bloccato (utente bannato)
//    REGISTER_SUCCESS - Registrazione completata
//    REGISTER_FAILED  - Registrazione fallita (utente già esistente)
//    SERVER_START   - Avvio del server
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
//  MIDDLEWARE
// ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────
//  GET /api/status
//  Verifica che il server sia online.
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
      versione:  '2.0.0',
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
//  Registra un nuovo utente con ruolo "Student"
//  e stato "Active" di default.
//  Corpo atteso: { username, password }
// ─────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { username, password, nome, cognome, email } = req.body;

  // Validazione input
  if (!username || !password) {
    return res.status(400).json({
      successo: false,
      messaggio: 'Username e password sono obbligatori.',
    });
  }

  if (username.trim().length < 3) {
    return res.status(400).json({
      successo: false,
      messaggio: 'Lo username deve contenere almeno 3 caratteri.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      successo: false,
      messaggio: 'La password deve contenere almeno 6 caratteri.',
    });
  }

  const users = readDB(DB.users);

  // Controllo duplicati (case-insensitive)
  const esistente = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (esistente) {
    scriviLog(
      'REGISTER_FAILED',
      username,
      'Username già registrato nel sistema'
    );
    return res.status(409).json({
      successo: false,
      messaggio: 'Questo username è già in uso. Scegline un altro.',
    });
  }

  // Creazione nuovo utente
  const nuovoUtente = {
    id:                generaId('usr'),
    username:          username.trim(),
    password,                           // NOTA: hash in Fase 3 con bcrypt
    ruolo:             'Student',
    stato:             'Active',
    nome:              nome    || '',
    cognome:           cognome || '',
    email:             email   || '',
    dataRegistrazione: new Date().toISOString(),
  };

  users.push(nuovoUtente);
  const salvato = writeDB(DB.users, users);

  if (!salvato) {
    return res.status(500).json({
      successo: false,
      messaggio: 'Errore interno: impossibile salvare l\'utente.',
    });
  }

  scriviLog(
    'REGISTER_SUCCESS',
    nuovoUtente.username,
    `Nuovo Student registrato con ID: ${nuovoUtente.id}`
  );

  const { password: _, ...utenteSicuro } = nuovoUtente;

  res.status(201).json({
    successo: true,
    messaggio: `Registrazione completata. Benvenuto, ${nuovoUtente.username}!`,
    utente: utenteSicuro,
  });
});

// ─────────────────────────────────────────────
//  POST /api/login
//  Autentica un utente esistente.
//  Gestisce tre scenari con log di audit:
//    1. LOGIN_SUCCESS  - Credenziali corrette
//    2. LOGIN_FAILED   - Username o password errati
//    3. LOGIN_BANNED   - Account con stato "Banned"
//  Corpo atteso: { username, password }
// ─────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      successo: false,
      messaggio: 'Username e password sono obbligatori.',
    });
  }

  const users  = readDB(DB.users);
  const utente = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  // Caso 1: Utente non trovato o password errata
  if (!utente || utente.password !== password) {
    scriviLog(
      'LOGIN_FAILED',
      username,
      'Username non trovato o password errata'
    );
    return res.status(401).json({
      successo: false,
      messaggio: 'Credenziali non valide. Controlla username e password.',
    });
  }

  // Caso 2: Account bannato
  if (utente.stato === 'Banned') {
    scriviLog(
      'LOGIN_BANNED',
      utente.username,
      `Tentativo di accesso da account bannato (ID: ${utente.id})`
    );
    return res.status(403).json({
      successo: false,
      messaggio: 'Il tuo account è stato sospeso. Contatta un amministratore.',
      codice: 'ACCOUNT_BANNED',
    });
  }

  // Caso 3: Account non attivo per altri motivi (es. "Pending")
  if (utente.stato !== 'Active') {
    scriviLog(
      'LOGIN_FAILED',
      utente.username,
      `Account in stato non valido: ${utente.stato}`
    );
    return res.status(403).json({
      successo: false,
      messaggio: `Account non attivo (stato: ${utente.stato}). Contatta un amministratore.`,
    });
  }

  // Caso 4: Login riuscito
  scriviLog(
    'LOGIN_SUCCESS',
    utente.username,
    `Accesso autorizzato. Ruolo: ${utente.ruolo}`
  );

  const { password: _, ...utenteSicuro } = utente;

  res.status(200).json({
    successo: true,
    messaggio: `Bentornato, ${utente.nome || utente.username}!`,
    utente: utenteSicuro,
  });
});

// ─────────────────────────────────────────────
//  GET /api/users
//  Lista di tutti gli utenti (password escluse).
//  Sarà protetta da middleware di autenticazione in Fase 3.
// ─────────────────────────────────────────────
app.get('/api/users', (req, res) => {
  const users = readDB(DB.users);
  const sicuri = users.map(({ password, ...resto }) => resto);

  res.status(200).json({
    successo: true,
    totale: sicuri.length,
    dati: sicuri,
  });
});

// ─────────────────────────────────────────────
//  GET /api/logs
//  Restituisce tutti gli eventi del log di sistema.
//  Ordinati dal più recente al più vecchio.
// ─────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  const logs = readDB(DB.logs);
  const ordinati = [...logs].reverse();

  res.status(200).json({
    successo: true,
    totale: ordinati.length,
    dati: ordinati,
  });
});

// ─────────────────────────────────────────────
//  GESTIONE 404
// ─────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      successo: false,
      messaggio: `Rotta API '${req.path}' non trovata.`,
    });
  }
  res.status(404).sendFile(
    path.join(__dirname, 'public', 'index.html'),
    (err) => {
      if (err) res.status(404).send('Pagina non trovata.');
    }
  );
});

// ─────────────────────────────────────────────
//  AVVIO SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║                                      ║');
  console.log('  ║   🏛️  AGORÀ v2.0 — Server Avviato    ║');
  console.log('  ║                                      ║');
  console.log(`  ║   ➜  http://localhost:${PORT}            ║`);
  console.log('  ║   ➜  IAM + Auditing attivi           ║');
  console.log('  ║                                      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  scriviLog('SERVER_START', 'sistema', `Agorà v2.0 avviato sulla porta ${PORT}`);
});