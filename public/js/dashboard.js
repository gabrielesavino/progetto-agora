/**
 * AGORÀ — dashboard.js
 * Controller UI completo per la Dashboard Studente.
 * Gestisce: autenticazione, upload con drag & drop,
 * rendering materiali con filtri dinamici per materia.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ─────────────────────────────────────────
  //  PROTEZIONE ROTTA
  //  Se non autenticato → login
  //  Se Admin → redirect al pannello Admin
  // ─────────────────────────────────────────
  const utente = getUtenteSessione();
  if (!utente) {
    window.location.href = '/index.html';
    return;
  }
  if (utente.ruolo === 'Admin') {
    window.location.href = '/admin.html';
    return;
  }

  // ─────────────────────────────────────────
  //  INIZIALIZZAZIONE TOPBAR
  // ─────────────────────────────────────────
  const nomeVisualizzato = utente.nome
    ? `${utente.nome}${utente.cognome ? ' ' + utente.cognome : ''}`
    : utente.username;

  document.getElementById('saluto-utente').textContent = `Benvenuto, ${nomeVisualizzato}`;
  document.getElementById('badge-ruolo').textContent = utente.ruolo;

  document.getElementById('btn-logout').addEventListener('click', () => {
    cancellaSessione();
    window.location.href = '/index.html';
  });

  // ─────────────────────────────────────────
  //  RIFERIMENTI DOM
  // ─────────────────────────────────────────
  const zonaUpload           = document.getElementById('zona-upload');
  const inputFile            = document.getElementById('input-file');
  const btnSfoglia           = document.getElementById('btn-sfoglia');
  const zonaContenuto        = document.getElementById('zona-upload-contenuto');
  const zonaFileSelezionato  = document.getElementById('zona-file-selezionato');
  const fileNomeDisplay      = document.getElementById('file-nome-display');
  const fileDimensioneDisplay= document.getElementById('file-dimensione-display');
  const fileIconaTipo        = document.getElementById('file-icona-tipo');
  const btnRimuoviFile       = document.getElementById('btn-rimuovi-file');
  const formUpload           = document.getElementById('form-upload');
  const inputTitolo          = document.getElementById('upload-titolo');
  const selectMateria        = document.getElementById('upload-materia');
  const btnUpload            = document.getElementById('btn-upload');
  const feedbackUpload       = document.getElementById('feedback-upload');
  const grigliaMateriali     = document.getElementById('griglia-materiali');
  const statoMateriali       = document.getElementById('stato-materiali');
  const statoVuoto           = document.getElementById('stato-vuoto');
  const filtriMateria        = document.getElementById('filtri-materia');
  const statTotale           = document.getElementById('stat-totale');
  const statMaterie          = document.getElementById('stat-materie');

  // ─────────────────────────────────────────
  //  STATO LOCALE
  // ─────────────────────────────────────────
  let fileScelto       = null;   // File correntemente selezionato
  let tuttiIMateriali  = [];     // Cache di tutti i materiali
  let filtroAttivo     = 'tutti';// Filtro materia attivo

  // ─────────────────────────────────────────
  //  UTILITY UI
  // ─────────────────────────────────────────
  function mostraFeedback(el, testo, tipo, icona = '') {
    el.className = `messaggio-feedback ${tipo} visibile`;
    el.innerHTML = icona
      ? `<span class="icona">${icona}</span><span>${testo}</span>`
      : `<span>${testo}</span>`;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nascondiFeedback(el) {
    el.classList.remove('visibile', 'successo', 'errore');
    el.innerHTML = '';
  }

  function formattaDimensione(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formattaData(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function iconaPerTipo(tipoFile) {
    const mappa = {
      pdf:      '📄',
      immagine: '🖼',
      audio:    '🎵',
      altro:    '📁',
    };
    return mappa[tipoFile] || '📁';
  }

  // ─────────────────────────────────────────
  //  GESTIONE SELEZIONE FILE
  // ─────────────────────────────────────────
  function mostraFileSelezionato(file) {
    fileScelto = file;

    // Determina icona in base all'estensione
    const ext = file.name.split('.').pop().toLowerCase();
    const iconeEst = { pdf: '📄', png: '🖼', jpg: '🖼', jpeg: '🖼', mp3: '🎵' };
    fileIconaTipo.textContent = iconeEst[ext] || '📁';

    fileNomeDisplay.textContent       = file.name;
    fileDimensioneDisplay.textContent = formattaDimensione(file.size);

    zonaContenuto.style.display       = 'none';
    zonaFileSelezionato.style.display = 'flex';
  }

  function resetFile() {
    fileScelto = null;
    inputFile.value = '';
    zonaContenuto.style.display       = 'block';
    zonaFileSelezionato.style.display = 'none';
  }

  // Click sul pulsante "Sfoglia"
  btnSfoglia.addEventListener('click', (e) => {
    e.stopPropagation();
    inputFile.click();
  });

  // Rimozione file selezionato
  btnRimuoviFile.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFile();
    nascondiFeedback(feedbackUpload);
  });

  // Selezione tramite input nativo
  inputFile.addEventListener('change', () => {
    if (inputFile.files.length > 0) {
      mostraFileSelezionato(inputFile.files[0]);
    }
  });

  // ─────────────────────────────────────────
  //  DRAG & DROP
  // ─────────────────────────────────────────
  zonaUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    zonaUpload.classList.add('drag-over');
  });

  zonaUpload.addEventListener('dragleave', () => {
    zonaUpload.classList.remove('drag-over');
  });

  zonaUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    zonaUpload.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Validazione lato client del tipo (controllo preliminare, il server fa quello definitivo)
      const estOk = /\.(pdf|png|jpg|jpeg|mp3)$/i.test(file.name);
      if (!estOk) {
        mostraFeedback(feedbackUpload,
          'Formato non consentito. Usa PDF, PNG, JPG o MP3.', 'errore', '✕');
        return;
      }

      mostraFileSelezionato(file);
      nascondiFeedback(feedbackUpload);
    }
  });

  // ─────────────────────────────────────────
  //  SUBMIT FORM UPLOAD
  // ─────────────────────────────────────────
  formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiFeedback(feedbackUpload);

    // Validazione locale
    if (!fileScelto) {
      mostraFeedback(feedbackUpload, 'Seleziona un file da caricare.', 'errore', '⚠');
      return;
    }

    const titolo  = inputTitolo.value.trim();
    const materia = selectMateria.value;

    if (!titolo) {
      inputTitolo.classList.add('errore');
      mostraFeedback(feedbackUpload, 'Inserisci un titolo per il materiale.', 'errore', '⚠');
      return;
    }

    if (!materia) {
      selectMateria.classList.add('errore');
      mostraFeedback(feedbackUpload, 'Seleziona una materia.', 'errore', '⚠');
      return;
    }

    // Stato caricamento
    btnUpload.classList.add('caricamento');
    btnUpload.querySelector('span').textContent = 'Caricamento…';
    btnUpload.disabled = true;

    const risultato = await caricaMateriale(fileScelto, titolo, materia, utente.username);

    btnUpload.classList.remove('caricamento');
    btnUpload.querySelector('span').textContent = 'Carica materiale';
    btnUpload.disabled = false;

    if (risultato.successo) {
      mostraFeedback(feedbackUpload,
        `"${titolo}" caricato con successo nella sezione ${materia}.`,
        'successo', '✓');

      // Reset del form
      resetFile();
      inputTitolo.value  = '';
      selectMateria.value = '';

      // Aggiorna la lista materiali
      await caricaESintetizzaMateriali();

      // Scrolla alla sezione materiali
      setTimeout(() => {
        document.getElementById('sezione-materiali')
          .scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);

    } else {
      mostraFeedback(feedbackUpload, risultato.messaggio, 'errore', '✕');
    }
  });

  // Rimuove classe errore ai campi quando l'utente interagisce
  inputTitolo.addEventListener('input',   () => inputTitolo.classList.remove('errore'));
  selectMateria.addEventListener('change',() => selectMateria.classList.remove('errore'));

  // ─────────────────────────────────────────
  //  RENDERING MATERIALI
  // ─────────────────────────────────────────

  /**
   * Genera la card HTML per un singolo materiale.
   * @param {Object} m - Oggetto materiale da materials.json
   */
  function creaCardMateriale(m) {
    const icona = iconaPerTipo(m.tipoFile);
    const data  = formattaData(m.dataCaricamento);

    const card = document.createElement('div');
    card.className    = 'card-materiale';
    card.dataset.materia = m.materia;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-tipo-icona">${icona}</span>
        <div class="card-titolo-wrap">
          <p class="card-titolo">${escapeHtml(m.titolo)}</p>
          <span class="card-materia-tag">${escapeHtml(m.materia)}</span>
        </div>
      </div>
      <div class="card-meta">
        <span class="card-autore">
          <span>👤</span>
          <span>${escapeHtml(m.autore)}</span>
        </span>
        <span class="card-data">${data}</span>
      </div>
      <div class="card-azioni">
        <a
          href="${m.percorso}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-apri"
        >
          ↗ Apri
        </a>
        <a
          href="${m.percorso}"
          download="${escapeHtml(m.nomeOriginale)}"
          class="btn-scarica"
        >
          ↓ Scarica
        </a>
      </div>
    `;

    return card;
  }

  /**
   * Sanifica una stringa per prevenire XSS nell'innerHTML.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  /**
   * Filtra e mostra i materiali in base al filtro attivo.
   */
  function renderizzaMateriali(materiali) {
    const filtrati = filtroAttivo === 'tutti'
      ? materiali
      : materiali.filter((m) => m.materia === filtroAttivo);

    grigliaMateriali.innerHTML = '';

    if (filtrati.length === 0) {
      grigliaMateriali.style.display = 'none';
      statoVuoto.style.display       = 'block';
      return;
    }

    statoVuoto.style.display       = 'none';
    grigliaMateriali.style.display = 'grid';

    filtrati.forEach((m, i) => {
      const card = creaCardMateriale(m);
      card.style.animationDelay = `${i * 40}ms`;
      grigliaMateriali.appendChild(card);
    });
  }

  /**
   * Costruisce i pulsanti filtro dinamici dalle materie presenti.
   */
  function costruisciFiltri(materiali) {
    const materie = [...new Set(materiali.map((m) => m.materia))].sort();

    filtriMateria.innerHTML = '';

    if (materie.length <= 1) return; // Con 0 o 1 materia i filtri non servono

    // Bottone "Tutti"
    const btnTutti = document.createElement('button');
    btnTutti.className = `filtro-btn ${filtroAttivo === 'tutti' ? 'attivo' : ''}`;
    btnTutti.textContent = 'Tutti';
    btnTutti.addEventListener('click', () => {
      filtroAttivo = 'tutti';
      aggiornaBtnFiltri();
      renderizzaMateriali(tuttiIMateriali);
    });
    filtriMateria.appendChild(btnTutti);

    materie.forEach((materia) => {
      const btn = document.createElement('button');
      btn.className   = `filtro-btn ${filtroAttivo === materia ? 'attivo' : ''}`;
      btn.textContent = materia;
      btn.addEventListener('click', () => {
        filtroAttivo = materia;
        aggiornaBtnFiltri();
        renderizzaMateriali(tuttiIMateriali);
      });
      filtriMateria.appendChild(btn);
    });
  }

  function aggiornaBtnFiltri() {
    filtriMateria.querySelectorAll('.filtro-btn').forEach((btn) => {
      const isAttivo = btn.textContent === 'Tutti'
        ? filtroAttivo === 'tutti'
        : btn.textContent === filtroAttivo;
      btn.classList.toggle('attivo', isAttivo);
    });
  }

  /**
   * Carica i materiali dal server, aggiorna le statistiche
   * della sidebar e renderizza le card.
   */
  async function caricaESintetizzaMateriali() {
    statoMateriali.style.display   = 'flex';
    grigliaMateriali.style.display = 'none';
    statoVuoto.style.display       = 'none';

    const risposta = await getMateriali();

    statoMateriali.style.display = 'none';

    if (!risposta.successo) {
      statoVuoto.style.display = 'block';
      return;
    }

    tuttiIMateriali = risposta.dati || [];

    // Aggiorna statistiche sidebar
    const materieUniche = new Set(tuttiIMateriali.map((m) => m.materia));
    statTotale.textContent  = tuttiIMateriali.length;
    statMaterie.textContent = materieUniche.size;

    // Ricostruisce i filtri e renderizza
    costruisciFiltri(tuttiIMateriali);
    renderizzaMateriali(tuttiIMateriali);
  }

  // ─────────────────────────────────────────
  //  AVVIO: carica i materiali al caricamento pagina
  // ─────────────────────────────────────────
  await caricaESintetizzaMateriali();

});