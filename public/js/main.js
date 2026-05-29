/**
 * AGORÀ — main.js
 * Controllore dell'interfaccia utente per la pagina di accesso (index.html).
 * Gestisce: cambio tab, submit dei form, feedback visivo, validazione.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─────────────────────────────────────────
  //  CONTROLLO SESSIONE ATTIVA
  //  Se l'utente è già loggato, redirect diretto.
  // ─────────────────────────────────────────
  const utenteEsistente = getUtenteSessione();
  if (utenteEsistente) {
    reindirizzaPerRuolo(utenteEsistente.ruolo);
    return;
  }

  // ─────────────────────────────────────────
  //  RIFERIMENTI DOM
  // ─────────────────────────────────────────
  const tabBtns     = document.querySelectorAll('.tab-btn');
  const pannelliTab = document.querySelectorAll('.pannello-tab');

  // Form Login
  const formLogin       = document.getElementById('form-login');
  const inputLoginUser  = document.getElementById('login-username');
  const inputLoginPass  = document.getElementById('login-password');
  const btnLogin        = document.getElementById('btn-login');
  const feedbackLogin   = document.getElementById('feedback-login');

  // Form Registrazione
  const formRegistra      = document.getElementById('form-registra');
  const inputRegUser      = document.getElementById('reg-username');
  const inputRegPass      = document.getElementById('reg-password');
  const inputRegNome      = document.getElementById('reg-nome');
  const inputRegCognome   = document.getElementById('reg-cognome');
  const inputRegEmail     = document.getElementById('reg-email');
  const btnRegistra       = document.getElementById('btn-registra');
  const feedbackRegistra  = document.getElementById('feedback-registra');

  // ─────────────────────────────────────────
  //  SISTEMA A TAB
  // ─────────────────────────────────────────
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove('attivo'));
      pannelliTab.forEach((p) => p.classList.remove('attivo'));

      btn.classList.add('attivo');
      document.getElementById(`tab-${target}`).classList.add('attivo');

      // Pulisce i messaggi di feedback al cambio tab
      nascondiMessaggio(feedbackLogin);
      nascondiMessaggio(feedbackRegistra);
    });
  });

  // ─────────────────────────────────────────
  //  UTILITY UI: Messaggi di feedback
  // ─────────────────────────────────────────

  /**
   * Mostra un messaggio di feedback nel contenitore indicato.
   * @param {HTMLElement} el       - Elemento contenitore del feedback
   * @param {string}      testo    - Testo da mostrare
   * @param {'successo'|'errore'} tipo
   * @param {string}      icona    - Emoji o simbolo
   */
  function mostraMessaggio(el, testo, tipo, icona = '') {
    el.className = `messaggio-feedback ${tipo} visibile`;
    el.innerHTML = icona
      ? `<span class="icona">${icona}</span><span>${testo}</span>`
      : `<span>${testo}</span>`;
  }

  function nascondiMessaggio(el) {
    el.classList.remove('visibile', 'successo', 'errore');
    el.innerHTML = '';
  }

  /**
   * Imposta lo stato di caricamento su un bottone.
   * @param {HTMLButtonElement} btn
   * @param {boolean}           attivo
   * @param {string}            testoOriginale
   */
  function setCaricamento(btn, attivo, testoOriginale) {
    if (attivo) {
      btn.classList.add('caricamento');
      btn.querySelector('span').textContent = 'Accesso in corso';
    } else {
      btn.classList.remove('caricamento');
      btn.querySelector('span').textContent = testoOriginale;
    }
  }

  // ─────────────────────────────────────────
  //  VALIDAZIONE LOCALE
  // ─────────────────────────────────────────

  function validaCampo(input, condizione, messaggioErrore) {
    if (!condizione) {
      input.classList.add('errore');
      return messaggioErrore;
    }
    input.classList.remove('errore');
    return null;
  }

  // Rimuovi il bordo errore non appena l'utente inizia a digitare
  [inputLoginUser, inputLoginPass, inputRegUser, inputRegPass,
   inputRegNome, inputRegCognome, inputRegEmail].forEach((input) => {
    if (input) {
      input.addEventListener('input', () => input.classList.remove('errore'));
    }
  });

  // ─────────────────────────────────────────
  //  FORM: LOGIN
  // ─────────────────────────────────────────
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiMessaggio(feedbackLogin);

    const username = inputLoginUser.value.trim();
    const password = inputLoginPass.value;

    // Validazione locale
    const erroreUser = validaCampo(inputLoginUser, username.length >= 3,
      'Username non valido.');
    const errorePass = validaCampo(inputLoginPass, password.length >= 1,
      'Inserisci la password.');

    const primoErrore = erroreUser || errorePass;
    if (primoErrore) {
      mostraMessaggio(feedbackLogin, primoErrore, 'errore', '⚠');
      return;
    }

    // Invio al server
    setCaricamento(btnLogin, true, 'Entra');

    const risultato = await login(username, password);

    setCaricamento(btnLogin, false, 'Entra');

    if (!risultato.successo) {
      const icona = risultato.bannato ? '🚫' : '✕';
      mostraMessaggio(feedbackLogin, risultato.messaggio, 'errore', icona);

      if (risultato.bannato) {
        // Sottolinea visivamente entrambi i campi per l'account bannato
        inputLoginUser.classList.add('errore');
        inputLoginPass.classList.add('errore');
      } else {
        inputLoginPass.value = '';
        inputLoginPass.classList.add('errore');
      }
    }
    // Se il login è riuscito, api.js gestisce il redirect — nessuna azione necessaria qui
  });

  // ─────────────────────────────────────────
  //  FORM: REGISTRAZIONE
  // ─────────────────────────────────────────
  formRegistra.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiMessaggio(feedbackRegistra);

    const username = inputRegUser.value.trim();
    const password = inputRegPass.value;
    const nome     = inputRegNome    ? inputRegNome.value.trim()    : '';
    const cognome  = inputRegCognome ? inputRegCognome.value.trim() : '';
    const email    = inputRegEmail   ? inputRegEmail.value.trim()   : '';

    // Validazione locale
    const erroriCampi = [
      validaCampo(inputRegUser, username.length >= 3,
        'Lo username deve contenere almeno 3 caratteri.'),
      validaCampo(inputRegPass, password.length >= 6,
        'La password deve contenere almeno 6 caratteri.'),
    ].filter(Boolean);

    if (erroriCampi.length > 0) {
      mostraMessaggio(feedbackRegistra, erroriCampi[0], 'errore', '⚠');
      return;
    }

    // Invio al server
    setCaricamento(btnRegistra, true, 'Registrati');

    const risultato = await registra(username, password, nome, cognome, email);

    setCaricamento(btnRegistra, false, 'Registrati');

    if (risultato.successo) {
      mostraMessaggio(
        feedbackRegistra,
        `${risultato.messaggio} Reindirizzamento in corso…`,
        'successo',
        '✓'
      );
      // Il redirect viene gestito da api.js dopo 1,2s
    } else {
      mostraMessaggio(feedbackRegistra, risultato.messaggio, 'errore', '✕');

      if (risultato.messaggio.toLowerCase().includes('username')) {
        inputRegUser.classList.add('errore');
      }
    }
  });

});