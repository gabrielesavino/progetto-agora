/**
 * AGORÀ — api.js v6
 * Layer fetch: auth, materiali, admin IAM, forum community.
 */

const API_BASE = '';

const SESSION_KEYS = {
  utente:   'agora_utente',
  username: 'agora_username',
  ruolo:    'agora_ruolo',
  id:       'agora_id',
};

// ── SESSIONE ─────────────────────────────────
function salvaSessione(utente) {
  localStorage.setItem(SESSION_KEYS.utente,   JSON.stringify(utente));
  localStorage.setItem(SESSION_KEYS.username, utente.username);
  localStorage.setItem(SESSION_KEYS.ruolo,    utente.ruolo);
  localStorage.setItem(SESSION_KEYS.id,       utente.id);
}

function cancellaSessione() {
  Object.values(SESSION_KEYS).forEach((k) => localStorage.removeItem(k));
}

function getUtenteSessione() {
  try {
    const raw = localStorage.getItem(SESSION_KEYS.utente);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function reindirizzaPerRuolo(ruolo) {
  window.location.href = ruolo === 'Admin' ? '/admin.html' : '/dashboard.html';
}

// ── HELPER FETCH JSON ────────────────────────
async function chiamataAPI(endpoint, metodo = 'GET', corpo = null, headersExtra = {}) {
  const opzioni = {
    method:  metodo,
    headers: { 'Content-Type': 'application/json', ...headersExtra },
  };
  if (corpo) opzioni.body = JSON.stringify(corpo);
  const r = await fetch(`${API_BASE}${endpoint}`, opzioni);
  const d = await r.json();
  d._statusCode = r.status;
  return d;
}

function headersAdmin() {
  const u = localStorage.getItem(SESSION_KEYS.username);
  return u ? { 'X-Username': u } : {};
}

// ── AUTH ─────────────────────────────────────
async function login(username, password) {
  try {
    const r = await chiamataAPI('/api/login', 'POST', { username, password });
    if (r.successo) {
      salvaSessione(r.utente);
      reindirizzaPerRuolo(r.utente.ruolo);
      return { successo: true, messaggio: r.messaggio };
    }
    return { successo: false, messaggio: r.messaggio, bannato: r.codice === 'ACCOUNT_BANNED' };
  } catch {
    return { successo: false, messaggio: 'Impossibile contattare il server.' };
  }
}

/**
 * Registrazione — accetta anche nationality.
 */
async function registra(username, password, nome = '', cognome = '', email = '', nationality = '') {
  try {
    const r = await chiamataAPI('/api/register', 'POST',
      { username, password, nome, cognome, email, nationality });
    if (r.successo) {
      salvaSessione(r.utente);
      await new Promise((res) => setTimeout(res, 1200));
      reindirizzaPerRuolo(r.utente.ruolo);
      return { successo: true, messaggio: r.messaggio };
    }
    return { successo: false, messaggio: r.messaggio };
  } catch {
    return { successo: false, messaggio: 'Impossibile contattare il server.' };
  }
}

// ── MATERIALI ────────────────────────────────
async function caricaMateriale(file, titolo, materia, username, categoriaCustom = '') {
  try {
    const fd = new FormData();
    fd.append('file',            file);
    fd.append('titolo',          titolo);
    fd.append('materia',         materia);
    fd.append('username',        username);
    fd.append('categoriaCustom', categoriaCustom);
    const r = await fetch('/api/materials/upload', { method: 'POST', body: fd });
    const d = await r.json();
    d._statusCode = r.status;
    return d;
  } catch {
    return { successo: false, messaggio: 'Errore di rete durante il caricamento.' };
  }
}

async function getMateriali() {
  try { return await chiamataAPI('/api/materials', 'GET'); }
  catch { return { successo: false, dati: [] }; }
}

// ── FORUM (FASE 6) ────────────────────────────

/**
 * Recupera tutti i thread del forum.
 * Usata da dashboard.js → caricaDiscussioniForum()
 */
async function getPosts() {
  try { return await chiamataAPI('/api/forum', 'GET'); }
  catch { return { successo: false, dati: [] }; }
}

/**
 * Crea un nuovo thread nel forum.
 * Firma: (titolo, categoria, messaggio, autore)
 * Usata da dashboard.js → formNuovoPost submit handler
 */
async function creaPost(titolo, categoria, messaggio, autore) {
  try {
    return await chiamataAPI('/api/forum', 'POST', { titolo, categoria, messaggio, autore });
  } catch {
    return { successo: false, messaggio: 'Errore di rete durante la creazione del post.' };
  }
}

/**
 * Aggiunge un commento a un thread esistente.
 * Firma: (postId, messaggio, autore)
 * Usata da dashboard.js → form-nuovo-commento submit handler
 */
async function creaCommento(postId, messaggio, autore) {
  try {
    return await chiamataAPI(`/api/forum/${postId}/commenti`, 'POST', { messaggio, autore });
  } catch {
    return { successo: false, messaggio: "Errore di rete durante l'invio del commento." };
  }
}

// ── ADMIN ────────────────────────────────────
async function adminGetUtenti() {
  try { return await chiamataAPI('/api/admin/users', 'GET', null, headersAdmin()); }
  catch { return { successo: false, dati: [] }; }
}

async function adminGetLogs() {
  try { return await chiamataAPI('/api/admin/logs', 'GET', null, headersAdmin()); }
  catch { return { successo: false, dati: [] }; }
}

async function adminAggiornaUtente(targetUsername, nuovoRuolo, nuovoStato) {
  try {
    return await chiamataAPI('/api/admin/update-user', 'POST',
      { targetUsername, nuovoRuolo, nuovoStato }, headersAdmin());
  } catch {
    return { successo: false, messaggio: 'Errore di rete.' };
  }
}

async function adminGetStats() {
  try { return await chiamataAPI('/api/admin/stats', 'GET', null, headersAdmin()); }
  catch { return { totalUsers: 0, totalMaterials: 0, totalPosts: 0, criticalAlerts: 0 }; }
}