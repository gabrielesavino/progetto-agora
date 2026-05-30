/**
 * AGORÀ — admin.js
 * Controller del Pannello Amministrativo.
 * Gestisce: autenticazione admin, tabella IAM, registro audit.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ─────────────────────────────────────────
  //  PROTEZIONE ROTTA CLIENT-SIDE
  //  Primo livello di difesa: controlla il localStorage.
  //  Il secondo livello è il middleware verificaAdmin sul server.
  // ─────────────────────────────────────────
  const utente = getUtenteSessione();

  if (!utente) {
    window.location.href = '/index.html';
    return;
  }

  if (utente.ruolo !== 'Admin') {
    // Violazione di accesso: l'utente non è Admin
    alert('⛔ Accesso negato.\n\nQuest\'area è riservata agli amministratori.\nVerrai reindirizzato alla dashboard studente.');
    window.location.href = '/dashboard.html';
    return;
  }

  // ─────────────────────────────────────────
  //  INIZIALIZZAZIONE TOPBAR
  // ─────────────────────────────────────────
  const nomeAdmin = utente.nome
    ? `${utente.nome}${utente.cognome ? ' ' + utente.cognome : ''}`
    : utente.username;

  document.getElementById('saluto-admin').textContent = `${nomeAdmin}`;

  document.getElementById('btn-logout').addEventListener('click', () => {
    cancellaSessione();
    window.location.href = '/index.html';
  });

  // ─────────────────────────────────────────
  //  RIFERIMENTI DOM
  // ─────────────────────────────────────────
  const feedbackAdmin       = document.getElementById('feedback-admin');
  const statUtenti          = document.getElementById('stat-utenti');
  const statEventi          = document.getElementById('stat-eventi');
  const statBanned          = document.getElementById('stat-banned');
  const statoUtenti         = document.getElementById('stato-utenti');
  const tabellaWrapper      = document.getElementById('tabella-utenti-wrapper');
  const tbodyUtenti         = document.getElementById('tbody-utenti');
  const btnAggiornaUtenti   = document.getElementById('btn-aggiorna-utenti');
  const statoLogs           = document.getElementById('stato-logs');
  const logLista            = document.getElementById('log-lista');

  // ─────────────────────────────────────────
  //  NAVIGAZIONE SIDEBAR
  // ─────────────────────────────────────────
  document.querySelectorAll('.sidebar-link[data-sezione]').forEach((link) => {
    link.addEventListener('click', (e) => {
      document.querySelectorAll('.sidebar-link').forEach((l) => l.classList.remove('attivo'));
      link.classList.add('attivo');
    });
  });

  // ─────────────────────────────────────────
  //  UTILITY UI
  // ─────────────────────────────────────────
  function mostraFeedback(testo, tipo, icona = '') {
    feedbackAdmin.className = `messaggio-feedback admin-feedback ${tipo} visibile`;
    feedbackAdmin.innerHTML = icona
      ? `<span class="icona">${icona}</span><span>${testo}</span>`
      : `<span>${testo}</span>`;

    // Auto-nasconde dopo 5 secondi
    clearTimeout(mostraFeedback._timer);
    mostraFeedback._timer = setTimeout(() => {
      feedbackAdmin.classList.remove('visibile', 'successo', 'errore');
    }, 5000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str || '')));
    return div.innerHTML;
  }

  function formattaDataOra(isoString) {
    const d = new Date(isoString);
    return {
      data: d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      ora:  d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  }

  // ─────────────────────────────────────────
  //  SEZIONE 1: GESTIONE UTENTI (IAM)
  // ─────────────────────────────────────────

  /**
   * Determina la classe CSS e la label del badge stato.
   */
  function badgeStato(stato) {
    const mappa = {
      'Active': { cls: 'active', label: '● Active' },
      'Banned': { cls: 'banned', label: '◌ Banned' },
    };
    return mappa[stato] || { cls: '', label: stato };
  }

  /**
   * Crea una riga <tr> per un utente nella tabella IAM.
   */
  function creaRigaUtente(u) {
    const tr = document.createElement('tr');
    tr.dataset.username = u.username;

    const iniziale    = (u.nome || u.username).charAt(0).toUpperCase();
    const nomeCompleto = [u.nome, u.cognome].filter(Boolean).join(' ') || '—';
    const { data: dataReg } = formattaDataOra(u.dataRegistrazione);
    const statoInfo   = badgeStato(u.stato);

    // Impedisce all'admin di modificare se stesso (safety UI)
    const isSelf = u.username === utente.username;

    tr.innerHTML = `
      <td>
        <div class="cella-utente">
          <div class="avatar-testo">${escapeHtml(iniziale)}</div>
          <div>
            <div class="cella-username">${escapeHtml(u.username)}</div>
            <div class="cella-nome-completo">${escapeHtml(nomeCompleto)}</div>
          </div>
        </div>
      </td>
      <td style="font-size:0.8rem; color:var(--admin-testo-dim);">
        ${escapeHtml(u.email || '—')}
      </td>
      <td style="font-size:0.78rem; color:var(--admin-testo-dim);">
        ${dataReg}
      </td>
      <td>
        <select
          class="select-admin select-ruolo"
          data-campo="ruolo"
          data-originale="${escapeHtml(u.ruolo)}"
          ${isSelf ? 'disabled title="Non puoi modificare il tuo stesso ruolo"' : ''}
        >
          <option value="Student" ${u.ruolo === 'Student' ? 'selected' : ''}>Student</option>
          <option value="Admin"   ${u.ruolo === 'Admin'   ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        <select
          class="select-admin select-stato"
          data-campo="stato"
          data-originale="${escapeHtml(u.stato)}"
          ${isSelf ? 'disabled title="Non puoi bannare il tuo stesso account"' : ''}
        >
          <option value="Active" ${u.stato === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Banned" ${u.stato === 'Banned' ? 'selected' : ''}>Banned</option>
        </select>
      </td>
      <td>
        <button
          class="btn-salva-riga"
          data-username="${escapeHtml(u.username)}"
          ${isSelf ? 'disabled title="Non puoi modificare il tuo stesso account"' : ''}
        >
          Salva
        </button>
      </td>
    `;

    // Evidenzia select se il valore cambia
    tr.querySelectorAll('.select-admin').forEach((sel) => {
      sel.addEventListener('change', () => {
        const modificato = sel.value !== sel.dataset.originale;
        sel.classList.toggle('modificato', modificato);
      });
    });

    // Handler pulsante Salva
    const btnSalva = tr.querySelector('.btn-salva-riga');
    if (btnSalva && !isSelf) {
      btnSalva.addEventListener('click', () => salvaModificheUtente(tr, u.username));
    }

    return tr;
  }

  /**
   * Invia le modifiche di ruolo/stato al server per un utente specifico.
   */
  async function salvaModificheUtente(tr, targetUsername) {
    const btnSalva    = tr.querySelector('.btn-salva-riga');
    const selectRuolo = tr.querySelector('.select-ruolo');
    const selectStato = tr.querySelector('.select-stato');

    const nuovoRuolo = selectRuolo.value;
    const nuovoStato = selectStato.value;

    // Stato di caricamento
    btnSalva.classList.add('salvando');
    btnSalva.textContent = '…';

    const risultato = await adminAggiornaUtente(targetUsername, nuovoRuolo, nuovoStato);

    btnSalva.classList.remove('salvando');

    if (risultato.successo) {
      btnSalva.textContent = '✓ Salvato';
      btnSalva.classList.add('salvato');

      // Aggiorna i valori "originali" nei data attribute
      selectRuolo.dataset.originale = nuovoRuolo;
      selectStato.dataset.originale = nuovoStato;
      selectRuolo.classList.remove('modificato');
      selectStato.classList.remove('modificato');

      mostraFeedback(risultato.messaggio, 'successo', '✓');

      // Dopo 2s torna al testo normale
      setTimeout(() => {
        btnSalva.textContent = 'Salva';
        btnSalva.classList.remove('salvato');
      }, 2500);

      // Aggiorna il log per mostrare la nuova voce
      await caricaLogs();
      aggiornaStatistiche();

    } else {
      btnSalva.textContent = 'Salva';
      mostraFeedback(risultato.messaggio, 'errore', '✕');
    }
  }

  /**
   * Carica e renderizza la tabella utenti.
   */
  async function caricaUtenti() {
    statoUtenti.style.display   = 'flex';
    tabellaWrapper.style.display = 'none';

    const risposta = await adminGetUtenti();

    statoUtenti.style.display = 'none';

    if (!risposta.successo) {
      mostraFeedback('Impossibile caricare gli utenti.', 'errore', '✕');
      return;
    }

    const utenti = risposta.dati || [];
    tbodyUtenti.innerHTML = '';

    // Ordina: prima gli altri, poi se stesso in fondo
    const ordinati = [
      ...utenti.filter((u) => u.username !== utente.username),
      ...utenti.filter((u) => u.username === utente.username),
    ];

    ordinati.forEach((u) => {
      tbodyUtenti.appendChild(creaRigaUtente(u));
    });

    tabellaWrapper.style.display = 'block';

    // Aggiorna stat banned
    const bannedCount = utenti.filter((u) => u.stato === 'Banned').length;
    statUtenti.textContent = utenti.length;
    statBanned.textContent = bannedCount;
  }

  // Pulsante "Aggiorna"
  btnAggiornaUtenti.addEventListener('click', async () => {
    btnAggiornaUtenti.classList.add('girando');
    await caricaUtenti();
    btnAggiornaUtenti.classList.remove('girando');
  });

  // ─────────────────────────────────────────
  //  SEZIONE 2: REGISTRO DI AUDIT
  // ─────────────────────────────────────────

  let tuttiILogs   = [];
  let filtroLogAttivo = 'tutti';

  /**
   * Mappa ogni tipo di evento a: classe CSS, classe badge, icona.
   */
  function classificaEvento(evento) {
    const mappa = {
      'LOGIN_SUCCESS':          { rigaCls: 'successo-log', badgeCls: 'ev-login-ok',   icona: '✓', label: 'Login OK' },
      'LOGIN_FAILED':           { rigaCls: 'critico',      badgeCls: 'ev-login-fail', icona: '✕', label: 'Login Fallito' },
      'LOGIN_BANNED':           { rigaCls: 'critico',      badgeCls: 'ev-banned',     icona: '🚫', label: 'Login Bloccato' },
      'REGISTER_SUCCESS':       { rigaCls: '',             badgeCls: 'ev-register',   icona: '✦', label: 'Registrazione' },
      'REGISTER_FAILED':        { rigaCls: 'warning',      badgeCls: 'ev-login-fail', icona: '⚠', label: 'Reg. Fallita' },
      'UPLOAD_SUCCESS':         { rigaCls: '',             badgeCls: 'ev-upload',     icona: '↑', label: 'Upload OK' },
      'UPLOAD_REJECTED':        { rigaCls: 'critico',      badgeCls: 'ev-login-fail', icona: '✕', label: 'Upload Rifiutato' },
      'USER_MANAGEMENT_ACTION': { rigaCls: 'iam-action',   badgeCls: 'ev-iam',        icona: '◈', label: 'Azione IAM' },
      'UNAUTHORIZED_ACCESS':    { rigaCls: 'critico',      badgeCls: 'ev-unauth',     icona: '⛔', label: 'Accesso Non Autorizzato' },
      'SERVER_START':           { rigaCls: '',             badgeCls: 'ev-server',     icona: '▶', label: 'Server Avviato' },
    };
    return mappa[evento] || { rigaCls: '', badgeCls: 'ev-altro', icona: '·', label: evento };
  }

  /**
   * Determina se un log corrisponde al filtro attivo.
   */
  function filtraLog(log) {
    if (filtroLogAttivo === 'tutti') return true;

    const evento = log.evento;
    if (filtroLogAttivo === 'critico') {
      return ['LOGIN_FAILED', 'LOGIN_BANNED', 'UPLOAD_REJECTED', 'UNAUTHORIZED_ACCESS'].includes(evento);
    }
    if (filtroLogAttivo === 'login') {
      return ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BANNED'].includes(evento);
    }
    if (filtroLogAttivo === 'upload') {
      return ['UPLOAD_SUCCESS', 'UPLOAD_REJECTED'].includes(evento);
    }
    if (filtroLogAttivo === 'iam') {
      return ['USER_MANAGEMENT_ACTION', 'UNAUTHORIZED_ACCESS', 'REGISTER_SUCCESS', 'REGISTER_FAILED'].includes(evento);
    }
    return true;
  }

  /**
   * Renderizza le righe del log nella lista.
   */
  function renderizzaLogs(logs) {
    const filtrati = logs.filter(filtraLog);

    logLista.innerHTML = '';

    if (filtrati.length === 0) {
      logLista.innerHTML = `<div class="log-vuoto">Nessun evento per questo filtro.</div>`;
      return;
    }

    filtrati.forEach((log, i) => {
      const info          = classificaEvento(log.evento);
      const { data, ora } = formattaDataOra(log.timestamp);

      const riga = document.createElement('div');
      riga.className = `log-riga ${info.rigaCls}`;
      riga.style.animationDelay = `${Math.min(i * 20, 400)}ms`;

      riga.innerHTML = `
        <div class="log-timestamp">
          <span class="log-data">${data}</span>
          <span class="log-ora">${ora}</span>
        </div>
        <div>
          <span class="log-evento-badge ${info.badgeCls}">
            ${info.icona} ${escapeHtml(info.label)}
          </span>
        </div>
        <div class="log-dettagli">
          <span class="log-username">${escapeHtml(log.username)}</span>
          <span class="log-testo-dettagli">${escapeHtml(log.dettagli || '—')}</span>
        </div>
      `;

      logLista.appendChild(riga);
    });
  }

  /**
   * Carica i log dal server e li renderizza.
   */
  async function caricaLogs() {
    statoLogs.style.display = 'flex';
    logLista.style.display  = 'none';

    const risposta = await adminGetLogs();

    statoLogs.style.display = 'none';
    logLista.style.display  = 'block';

    if (!risposta.successo) {
      logLista.innerHTML = `<div class="log-vuoto">Impossibile caricare il registro.</div>`;
      return;
    }

    tuttiILogs = risposta.dati || [];
    statEventi.textContent = tuttiILogs.length;
    renderizzaLogs(tuttiILogs);
  }

  // Filtri log
  document.querySelectorAll('.filtro-log-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-log-btn').forEach((b) => b.classList.remove('attivo'));
      btn.classList.add('attivo');
      filtroLogAttivo = btn.dataset.filtro;
      renderizzaLogs(tuttiILogs);
    });
  });

  // ─────────────────────────────────────────
  //  STATISTICHE SIDEBAR
  // ─────────────────────────────────────────
  async function aggiornaStatistiche() {
    const [rispostaUtenti, rispostaLogs] = await Promise.all([
      adminGetUtenti(),
      adminGetLogs(),
    ]);

    if (rispostaUtenti.successo) {
      const utenti = rispostaUtenti.dati || [];
      statUtenti.textContent = utenti.length;
      statBanned.textContent = utenti.filter((u) => u.stato === 'Banned').length;
    }

    if (rispostaLogs.successo) {
      statEventi.textContent = (rispostaLogs.dati || []).length;
    }
  }

  // ─────────────────────────────────────────
  //  AVVIO: carica tutto in parallelo
  // ─────────────────────────────────────────
  await Promise.all([
    caricaUtenti(),
    caricaLogs(),
  ]);

});