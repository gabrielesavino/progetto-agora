/**
 * AGORÀ — api.js
 * Livello di comunicazione con il server.
 * Gestisce tutte le chiamate fetch verso il backend Express,
 * la persistenza della sessione nel localStorage e i redirect.
 */

// ─────────────────────────────────────────────
//  CONFIGURAZIONE BASE
// ─────────────────────────────────────────────

/** URL base delle API. Vuota = stesso dominio/porta del frontend. */
const API_BASE = '';

/** Chiavi usate nel localStorage per la sessione utente. */
const SESSION_KEYS = {
  utente:   'agora_utente',
  username: 'agora_username',
  ruolo:    'agora_ruolo',
  id:       'agora_id',
};

// ─────────────────────────────────────────────
//  UTILITY: Sessione locale
// ─────────────────────────────────────────────

/**
 * Salva i dati dell'utente nel localStorage dopo un login/registrazione.
 * @param {Object} utente - Oggetto utente restituito dal server.
 */
function salvaSessione(utente) {
  localStorage.setItem(SESSION_KEYS.utente,   JSON.stringify(utente));
  localStorage.setItem(SESSION_KEYS.username, utente.username);
  localStorage.setItem(SESSION_KEYS.ruolo,    utente.ruolo);
  localStorage.setItem(SESSION_KEYS.id,       utente.id);
}

/**
 * Elimina tutti i dati di sessione dal localStorage.
 * Da chiamare al logout.
 */
function cancellaSessione() {
  Object.values(SESSION_KEYS).forEach((k) => localStorage.removeItem(k));
}

/**
 * Recupera l'utente corrente dalla sessione, se presente.
 * @returns {Object|null} Oggetto utente o null se non autenticato.
 */
function getUtenteSessione() {
  try {
    const raw = localStorage.getItem(SESSION_KEYS.utente);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Reindirizza l'utente alla pagina corretta in base al suo ruolo.
 * @param {string} ruolo - 'Admin' o 'Student'
 */
function reindirizzaPerRuolo(ruolo) {
  if (ruolo === 'Admin') {
    window.location.href = '/admin.html';
  } else {
    window.location.href = '/dashboard.html';
  }
}

// ─────────────────────────────────────────────
//  UTILITY: Helper fetch
// ─────────────────────────────────────────────

/**
 * Wrapper generico attorno a fetch().
 * Gestisce la serializzazione JSON e gli errori di rete.
 *
 * @param {string} endpoint   - Percorso API (es. '/api/login')
 * @param {string} metodo     - Metodo HTTP ('GET', 'POST', ...)
 * @param {Object} [corpo]    - Corpo della richiesta (opzionale)
 * @returns {Promise<Object>} - Risposta JSON del server
 */
async function chiamataAPI(endpoint, metodo = 'GET', corpo = null) {
  const opzioni = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
  };

  if (corpo) {
    opzioni.body = JSON.stringify(corpo);
  }

  const risposta = await fetch(`${API_BASE}${endpoint}`, opzioni);
  const dati = await risposta.json();

  // Aggiunge il codice HTTP alla risposta per facilitare la gestione degli errori
  dati._statusCode = risposta.status;
  return dati;
}

// ─────────────────────────────────────────────
//  API: LOGIN
// ─────────────────────────────────────────────

/**
 * Autentica un utente esistente.
 * In caso di successo, salva la sessione e reindirizza.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{successo: boolean, messaggio: string}>}
 */
async function login(username, password) {
  try {
    const risposta = await chiamataAPI('/api/login', 'POST', { username, password });

    if (risposta.successo) {
      salvaSessione(risposta.utente);
      reindirizzaPerRuolo(risposta.utente.ruolo);
      return { successo: true, messaggio: risposta.messaggio };
    }

    // Gestione caso account bannato con messaggio specifico
    if (risposta.codice === 'ACCOUNT_BANNED') {
      return {
        successo: false,
        messaggio: risposta.messaggio,
        bannato: true,
      };
    }

    return { successo: false, messaggio: risposta.messaggio };

  } catch (errore) {
    console.error('[API] Errore di rete durante il login:', errore);
    return {
      successo: false,
      messaggio: 'Impossibile contattare il server. Verifica la connessione.',
    };
  }
}

// ─────────────────────────────────────────────
//  API: REGISTRAZIONE
// ─────────────────────────────────────────────

/**
 * Registra un nuovo utente.
 * In caso di successo, salva la sessione e reindirizza.
 *
 * @param {string} username
 * @param {string} password
 * @param {string} [nome]
 * @param {string} [cognome]
 * @param {string} [email]
 * @returns {Promise<{successo: boolean, messaggio: string}>}
 */
async function registra(username, password, nome = '', cognome = '', email = '') {
  try {
    const risposta = await chiamataAPI('/api/register', 'POST', {
      username,
      password,
      nome,
      cognome,
      email,
    });

    if (risposta.successo) {
      salvaSessione(risposta.utente);
      // Breve pausa per mostrare il messaggio di successo prima del redirect
      await new Promise((r) => setTimeout(r, 1200));
      reindirizzaPerRuolo(risposta.utente.ruolo);
      return { successo: true, messaggio: risposta.messaggio };
    }

    return { successo: false, messaggio: risposta.messaggio };

  } catch (errore) {
    console.error('[API] Errore di rete durante la registrazione:', errore);
    return {
      successo: false,
      messaggio: 'Impossibile contattare il server. Verifica la connessione.',
    };
  }
}

// ─────────────────────────────────────────────
//  API: STATUS SERVER
// ─────────────────────────────────────────────

/**
 * Controlla lo stato del server.
 * @returns {Promise<Object>}
 */
async function controllaStatus() {
  try {
    return await chiamataAPI('/api/status', 'GET');
  } catch {
    return { successo: false, messaggio: 'Server non raggiungibile.' };
  }
}

// ─────────────────────────────────────────────
//  EXPORT (per compatibilità futura con moduli ES)
// ─────────────────────────────────────────────

// Le funzioni sono disponibili globalmente per le pagine HTML.
// In una versione futura, si potranno esportare come moduli ES6.