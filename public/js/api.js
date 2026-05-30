/**
 * AGORÀ — api.js v4
 * Layer di comunicazione con il backend.
 * Gestisce: autenticazione, upload, materiali, admin IAM.
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
  } catch { return null; }
}

function reindirizzaPerRuolo(ruolo) {
  window.location.href = ruolo === 'Admin' ? '/admin.html' : '/dashboard.html';
}

// ─────────────────────────────────────────────
//  HELPER FETCH — JSON
// ─────────────────────────────────────────────
async function chiamataAPI(endpoint, metodo = 'GET', corpo = null, headersExtra = {}) {
  const opzioni = {
    method:  metodo,
    headers: { 'Content-Type': 'application/json', ...headersExtra },
  };
  if (corpo) opzioni.body = JSON.stringify(corpo);
  const risposta = await fetch(`${API_BASE}${endpoint}`, opzioni);
  const dati = await risposta.json();
  dati._statusCode = risposta.status;
  return dati;
}

/**
 * Aggiunge automaticamente l'header X-Username per le rotte admin.
 * Il server verifica il ruolo nel DB a ogni richiesta.
 */
function headersAdmin() {
  const username = localStorage.getItem(SESSION_KEYS.username);
  return username ? { 'X-Username': username } : {};
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
async function caricaMateriale(file, titolo, materia, username) {
  try {
    const formData = new FormData();
    formData.append('file',     file);
    formData.append('titolo',   titolo);
    formData.append('materia',  materia);
    formData.append('username', username);
    const risposta = await fetch('/api/materials/upload', { method: 'POST', body: formData });
    const dati = await risposta.json();
    dati._statusCode = risposta.status;
    return dati;
  } catch {
    return { successo: false, messaggio: 'Errore di rete durante il caricamento.' };
  }
}

async function getMateriali() {
  try { return await chiamataAPI('/api/materials', 'GET'); }
  catch { return { successo: false, dati: [] }; }
}

// ─────────────────────────────────────────────
//  ADMIN — IAM
// ─────────────────────────────────────────────

/**
 * Recupera tutti gli utenti (senza password). Solo Admin.
 */
async function adminGetUtenti() {
  try { return await chiamataAPI('/api/admin/users', 'GET', null, headersAdmin()); }
  catch { return { successo: false, dati: [] }; }
}

/**
 * Recupera il log di sistema completo. Solo Admin.
 */
async function adminGetLogs() {
  try { return await chiamataAPI('/api/admin/logs', 'GET', null, headersAdmin()); }
  catch { return { successo: false, dati: [] }; }
}

/**
 * Aggiorna ruolo e/o stato di un utente. Solo Admin.
 * @param {string} targetUsername  - Username dell'utente da modificare
 * @param {string} nuovoRuolo      - 'Student' | 'Admin'
 * @param {string} nuovoStato      - 'Active' | 'Banned'
 */
async function adminAggiornaUtente(targetUsername, nuovoRuolo, nuovoStato) {
  try {
    return await chiamataAPI(
      '/api/admin/update-user',
      'POST',
      { targetUsername, nuovoRuolo, nuovoStato },
      headersAdmin()
    );
  } catch {
    return { successo: false, messaggio: 'Errore di rete.' };
  }
}