/**
 * AGORÀ — api.js v3
 * Layer di comunicazione con il backend.
 * Gestisce: fetch JSON, upload FormData, sessione localStorage, redirect.
 */

const API_BASE = '';

const SESSION_KEYS = {
  utente:   'agora_utente',
  username: 'agora_username',
  ruolo:    'agora_ruolo',
  id:       'agora_id',
};

// ─────────────────────────────────────────────
//  SESSIONE
// ─────────────────────────────────────────────
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
  } catch {
    return null;
  }
}

function reindirizzaPerRuolo(ruolo) {
  window.location.href = ruolo === 'Admin' ? '/admin.html' : '/dashboard.html';
}

// ─────────────────────────────────────────────
//  HELPER FETCH (JSON)
// ─────────────────────────────────────────────
async function chiamataAPI(endpoint, metodo = 'GET', corpo = null) {
  const opzioni = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
  };
  if (corpo) opzioni.body = JSON.stringify(corpo);

  const risposta = await fetch(`${API_BASE}${endpoint}`, opzioni);
  const dati = await risposta.json();
  dati._statusCode = risposta.status;
  return dati;
}

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────
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

async function registra(username, password, nome = '', cognome = '', email = '') {
  try {
    const r = await chiamataAPI('/api/register', 'POST', { username, password, nome, cognome, email });
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

// ─────────────────────────────────────────────
//  MATERIALI
// ─────────────────────────────────────────────

/**
 * Carica un file sul server usando FormData.
 * Necessario perché i file binari non possono essere inviati come JSON.
 *
 * @param {File}   file     - Oggetto File dall'input HTML
 * @param {string} titolo   - Titolo testuale del materiale
 * @param {string} materia  - Materia scolastica
 * @param {string} username - Username dell'autore
 */
async function caricaMateriale(file, titolo, materia, username) {
  try {
    const formData = new FormData();
    formData.append('file',     file);
    formData.append('titolo',   titolo);
    formData.append('materia',  materia);
    formData.append('username', username);

    // NON impostare Content-Type manualmente con FormData:
    // il browser lo imposta automaticamente con il boundary corretto.
    const risposta = await fetch('/api/materials/upload', {
      method: 'POST',
      body: formData,
    });

    const dati = await risposta.json();
    dati._statusCode = risposta.status;
    return dati;

  } catch (err) {
    console.error('[API] Errore upload:', err);
    return { successo: false, messaggio: 'Errore di rete durante il caricamento.' };
  }
}

/**
 * Recupera la lista completa dei materiali dal server.
 * @returns {Promise<{successo: boolean, dati: Array}>}
 */
async function getMateriali() {
  try {
    return await chiamataAPI('/api/materials', 'GET');
  } catch {
    return { successo: false, dati: [], messaggio: 'Impossibile caricare i materiali.' };
  }
}

async function controllaStatus() {
  try {
    return await chiamataAPI('/api/status', 'GET');
  } catch {
    return { successo: false, messaggio: 'Server non raggiungibile.' };
  }
}