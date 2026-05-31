/**
 * AGORÀ — main.js v5.1
 * Controller UI per la pagina di accesso (index.html).
 * Fix: inizializzaNationalityPicker chiamata esplicitamente qui.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── FIX NATIONALITY PICKER ────────────────
  // nations.js espone la funzione ma non la chiama autonomamente.
  // Va chiamata qui, quando il DOM è sicuramente pronto.
  if (typeof inizializzaNationalityPicker === 'function') {
    inizializzaNationalityPicker();
  }

  // Redirect se già loggato
  const utenteEsistente = getUtenteSessione();
  if (utenteEsistente) {
    reindirizzaPerRuolo(utenteEsistente.ruolo);
    return;
  }

  // ── TAB ──────────────────────────────────
  const tabBtns     = document.querySelectorAll('.tab-btn');
  const pannelliTab = document.querySelectorAll('.pannello-tab');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b)     => b.classList.remove('attivo'));
      pannelliTab.forEach((p) => p.classList.remove('attivo'));
      btn.classList.add('attivo');
      document.getElementById(`tab-${target}`).classList.add('attivo');
      nascondiMessaggio(feedbackLogin);
      nascondiMessaggio(feedbackRegistra);
    });
  });

  // ── RIFERIMENTI DOM ───────────────────────
  const formLogin       = document.getElementById('form-login');
  const inputLoginUser  = document.getElementById('login-username');
  const inputLoginPass  = document.getElementById('login-password');
  const btnLogin        = document.getElementById('btn-login');
  const feedbackLogin   = document.getElementById('feedback-login');

  const formRegistra     = document.getElementById('form-registra');
  const inputRegUser     = document.getElementById('reg-username');
  const inputRegPass     = document.getElementById('reg-password');
  const inputRegNome     = document.getElementById('reg-nome');
  const inputRegCognome  = document.getElementById('reg-cognome');
  const inputRegEmail    = document.getElementById('reg-email');
  const inputNationality = document.getElementById('reg-nationality');
  const btnRegistra      = document.getElementById('btn-registra');
  const feedbackRegistra = document.getElementById('feedback-registra');

  // ── UTILITY FEEDBACK ─────────────────────
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

  function setCaricamento(btn, attivo, testoOrig) {
    btn.classList.toggle('caricamento', attivo);
    btn.disabled = attivo;
    btn.querySelector('span').textContent = attivo ? 'Caricamento…' : testoOrig;
  }

  [inputLoginUser, inputLoginPass, inputRegUser, inputRegPass].forEach((el) => {
    if (el) el.addEventListener('input', () => el.classList.remove('errore'));
  });

  // ── FORM LOGIN ────────────────────────────
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiMessaggio(feedbackLogin);

    const username = inputLoginUser.value.trim();
    const password = inputLoginPass.value;

    if (username.length < 3) {
      inputLoginUser.classList.add('errore');
      mostraMessaggio(feedbackLogin, 'Username non valido.', 'errore', '⚠');
      return;
    }
    if (!password) {
      inputLoginPass.classList.add('errore');
      mostraMessaggio(feedbackLogin, 'Inserisci la password.', 'errore', '⚠');
      return;
    }

    setCaricamento(btnLogin, true, 'Entra');
    const risultato = await login(username, password);
    setCaricamento(btnLogin, false, 'Entra');

    if (!risultato.successo) {
      mostraMessaggio(feedbackLogin, risultato.messaggio, 'errore',
        risultato.bannato ? '🚫' : '✕');
      if (risultato.bannato) {
        inputLoginUser.classList.add('errore');
        inputLoginPass.classList.add('errore');
      } else {
        inputLoginPass.value = '';
        inputLoginPass.classList.add('errore');
      }
    }
  });

  // ── FORM REGISTRAZIONE ───────────────────
  formRegistra.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiMessaggio(feedbackRegistra);

    const username    = inputRegUser.value.trim();
    const password    = inputRegPass.value;
    const nome        = inputRegNome     ? inputRegNome.value.trim()    : '';
    const cognome     = inputRegCognome  ? inputRegCognome.value.trim() : '';
    const email       = inputRegEmail    ? inputRegEmail.value.trim()   : '';
    const nationality = inputNationality ? inputNationality.value       : '';

    if (username.length < 3) {
      inputRegUser.classList.add('errore');
      mostraMessaggio(feedbackRegistra, 'Username: minimo 3 caratteri.', 'errore', '⚠');
      return;
    }
    if (password.length < 6) {
      inputRegPass.classList.add('errore');
      mostraMessaggio(feedbackRegistra, 'Password: minimo 6 caratteri.', 'errore', '⚠');
      return;
    }

    setCaricamento(btnRegistra, true, 'Registrati');
    const risultato = await registra(username, password, nome, cognome, email, nationality);
    setCaricamento(btnRegistra, false, 'Registrati');

    if (risultato.successo) {
      mostraMessaggio(feedbackRegistra,
        `${risultato.messaggio} Reindirizzamento in corso…`, 'successo', '✓');
    } else {
      mostraMessaggio(feedbackRegistra, risultato.messaggio, 'errore', '✕');
      if (risultato.messaggio.toLowerCase().includes('username'))
        inputRegUser.classList.add('errore');
    }
  });

});