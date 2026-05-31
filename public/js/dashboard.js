/**
 * AGORÀ — dashboard.js v5.1
 * Controller Dashboard Studente.
 * Account menu dropdown, 3 categorie globali,
 * ricerca testuale live + filtri categoria client-side.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ── PROTEZIONE ROTTA ──────────────────────
  const utente = getUtenteSessione();
  if (!utente) { window.location.href = '/index.html'; return; }
  if (utente.ruolo === 'Admin') { window.location.href = '/admin.html'; return; }

  // ── ACCOUNT MENU DROPDOWN ────────────────
  const nomeVis = utente.nome
    ? `${utente.nome}${utente.cognome ? ' ' + utente.cognome : ''}`
    : utente.username;
  const iniziale  = (utente.nome || utente.username).charAt(0).toUpperCase();
  const nazDisplay = utente.nationality || 'Comunità internazionale';

  // Popola trigger
  document.getElementById('account-avatar').textContent = iniziale;
  document.getElementById('account-nome').textContent   = nomeVis;

  // Popola dropdown
  document.getElementById('dd-avatar').textContent    = iniziale;
  document.getElementById('dd-username').textContent  = nomeVis;
  document.getElementById('dd-email').textContent     = utente.email || '';
  document.getElementById('dd-ruolo').textContent     = utente.ruolo;
  document.getElementById('dd-nazionalita').textContent = `🌍 ${nazDisplay}`;

  const dataReg = utente.dataRegistrazione
    ? new Date(utente.dataRegistrazione).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
    : '—';
  document.getElementById('dd-data').textContent = dataReg;

  // Toggle apertura/chiusura
  const accountTrigger  = document.getElementById('account-trigger');
  const accountDropdown = document.getElementById('account-dropdown');

  function apriDropdown() {
    accountDropdown.classList.add('aperto');
    accountTrigger.setAttribute('aria-expanded', 'true');
    accountDropdown.setAttribute('aria-hidden', 'false');
  }

  function chiudiDropdown() {
    accountDropdown.classList.remove('aperto');
    accountTrigger.setAttribute('aria-expanded', 'false');
    accountDropdown.setAttribute('aria-hidden', 'true');
  }

  accountTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    accountDropdown.classList.contains('aperto') ? chiudiDropdown() : apriDropdown();
  });

  // Chiudi cliccando fuori
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#account-menu')) chiudiDropdown();
  });

  // Chiudi con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudiDropdown();
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    cancellaSessione();
    window.location.href = '/index.html';
  });

  // ── DOM REFS ──────────────────────────────
  const zonaUpload          = document.getElementById('zona-upload');
  const inputFile           = document.getElementById('input-file');
  const btnSfoglia          = document.getElementById('btn-sfoglia');
  const zonaContenuto       = document.getElementById('zona-upload-contenuto');
  const zonaFileSelezionato = document.getElementById('zona-file-selezionato');
  const fileNomeDisplay     = document.getElementById('file-nome-display');
  const fileDimDisplay      = document.getElementById('file-dimensione-display');
  const fileIconaTipo       = document.getElementById('file-icona-tipo');
  const btnRimuovi          = document.getElementById('btn-rimuovi-file');
  const formUpload          = document.getElementById('form-upload');
  const inputTitolo         = document.getElementById('upload-titolo');
  const selectMateria       = document.getElementById('upload-materia');
  const campoCatCustom      = document.getElementById('campo-categoria-custom');
  const inputCatCustom      = document.getElementById('upload-categoria-custom');
  const btnUpload           = document.getElementById('btn-upload');
  const feedbackUpload      = document.getElementById('feedback-upload');
  const grigliaMateriali    = document.getElementById('griglia-materiali');
  const statoMateriali      = document.getElementById('stato-materiali');
  const statoVuoto          = document.getElementById('stato-vuoto');
  const inputRicerca        = document.getElementById('input-ricerca');
  const btnCancellaRicerca  = document.getElementById('btn-cancella-ricerca');
  const risultatiCount      = document.getElementById('risultati-count');
  const statTotale          = document.getElementById('stat-totale');
  const statMaterie         = document.getElementById('stat-materie');

  // ── STATO LOCALE ──────────────────────────
  let fileScelto        = null;
  let tuttiIMateriali   = [];
  let filtroCategoria   = 'tutti';
  let testoRicerca      = '';

  // ── MOSTRA/NASCONDI CAMPO CUSTOM ─────────
  selectMateria.addEventListener('change', () => {
    const mostra = selectMateria.value === 'altro';
    campoCatCustom.style.display = mostra ? 'block' : 'none';
    if (!mostra) inputCatCustom.value = '';
    selectMateria.classList.remove('errore');
  });

  // ── UTILITY ──────────────────────────────
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

  function formattaDim(bytes) {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formattaData(iso) {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  function iconaPerTipo(tipo) {
    return { pdf: '📄', immagine: '🖼', audio: '🎵', altro: '📁' }[tipo] || '📁';
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str || '')));
    return d.innerHTML;
  }

  /**
   * Restituisce la classe CSS del tag categoria in base alla categoria.
   */
  function classeCategoria(cat) {
    if (!cat) return 'cat-altro';
    const c = cat.toLowerCase();
    if (c.includes('informatica') || c.includes('cloud')) return 'cat-informatica';
    if (c.includes('lingue') || c.includes('culture'))    return 'cat-lingue';
    if (c.includes('expat') || c.includes('integrazione'))return 'cat-expat';
    return 'cat-altro';
  }

  // ── SELEZIONE FILE ────────────────────────
  function mostraFileSelezionato(file) {
    fileScelto = file;
    const ext = file.name.split('.').pop().toLowerCase();
    fileIconaTipo.textContent     = { pdf:'📄', png:'🖼', jpg:'🖼', jpeg:'🖼', mp3:'🎵' }[ext] || '📁';
    fileNomeDisplay.textContent   = file.name;
    fileDimDisplay.textContent    = formattaDim(file.size);
    zonaContenuto.style.display       = 'none';
    zonaFileSelezionato.style.display = 'flex';
  }

  function resetFile() {
    fileScelto = null;
    inputFile.value = '';
    zonaContenuto.style.display       = 'block';
    zonaFileSelezionato.style.display = 'none';
  }

  btnSfoglia.addEventListener('click', (e) => { e.stopPropagation(); inputFile.click(); });
  btnRimuovi.addEventListener('click', (e) => { e.stopPropagation(); resetFile(); nascondiFeedback(feedbackUpload); });
  inputFile.addEventListener('change', () => { if (inputFile.files.length > 0) mostraFileSelezionato(inputFile.files[0]); });

  // Drag & drop
  zonaUpload.addEventListener('dragover',  (e) => { e.preventDefault(); zonaUpload.classList.add('drag-over'); });
  zonaUpload.addEventListener('dragleave', ()  => zonaUpload.classList.remove('drag-over'));
  zonaUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    zonaUpload.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (!/\.(pdf|png|jpg|jpeg|mp3)$/i.test(f.name)) {
        mostraFeedback(feedbackUpload, 'Formato non consentito. Usa PDF, PNG, JPG o MP3.', 'errore', '✕');
        return;
      }
      mostraFileSelezionato(f);
      nascondiFeedback(feedbackUpload);
    }
  });

  // ── SUBMIT UPLOAD ─────────────────────────
  formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiFeedback(feedbackUpload);

    if (!fileScelto) { mostraFeedback(feedbackUpload, 'Seleziona un file.', 'errore', '⚠'); return; }

    const titolo         = inputTitolo.value.trim();
    const materia        = selectMateria.value;
    const categoriaCustom = inputCatCustom.value.trim();

    if (!titolo) { inputTitolo.classList.add('errore'); mostraFeedback(feedbackUpload, 'Inserisci un titolo.', 'errore', '⚠'); return; }
    if (!materia) { selectMateria.classList.add('errore'); mostraFeedback(feedbackUpload, 'Seleziona una categoria.', 'errore', '⚠'); return; }
    if (materia === 'altro' && !categoriaCustom) {
      inputCatCustom.classList.add('errore');
      mostraFeedback(feedbackUpload, 'Specifica il nome della categoria personalizzata.', 'errore', '⚠');
      return;
    }

    btnUpload.classList.add('caricamento');
    btnUpload.querySelector('span').textContent = 'Caricamento…';
    btnUpload.disabled = true;

    const risultato = await caricaMateriale(fileScelto, titolo, materia, utente.username, categoriaCustom);

    btnUpload.classList.remove('caricamento');
    btnUpload.querySelector('span').textContent = 'Carica materiale';
    btnUpload.disabled = false;

    if (risultato.successo) {
      const catNome = materia === 'altro' ? categoriaCustom : materia;
      mostraFeedback(feedbackUpload, `"${titolo}" caricato in "${catNome}".`, 'successo', '✓');
      resetFile();
      inputTitolo.value  = '';
      selectMateria.value = '';
      campoCatCustom.style.display = 'none';
      inputCatCustom.value = '';
      await caricaESintetizzaMateriali();
      setTimeout(() => document.getElementById('sezione-materiali').scrollIntoView({ behavior: 'smooth' }), 600);
    } else {
      mostraFeedback(feedbackUpload, risultato.messaggio, 'errore', '✕');
    }
  });

  inputTitolo.addEventListener('input',    () => inputTitolo.classList.remove('errore'));
  selectMateria.addEventListener('change', () => selectMateria.classList.remove('errore'));
  inputCatCustom.addEventListener('input', () => inputCatCustom.classList.remove('errore'));

  // ── RICERCA LIVE ──────────────────────────
  inputRicerca.addEventListener('input', () => {
    testoRicerca = inputRicerca.value.trim().toLowerCase();
    btnCancellaRicerca.style.display = testoRicerca ? 'block' : 'none';
    renderizzaMateriali(tuttiIMateriali);
  });

  btnCancellaRicerca.addEventListener('click', () => {
    inputRicerca.value = '';
    testoRicerca = '';
    btnCancellaRicerca.style.display = 'none';
    renderizzaMateriali(tuttiIMateriali);
    inputRicerca.focus();
  });

  // ── FILTRI CATEGORIA ──────────────────────
  document.querySelectorAll('.filtro-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-cat-btn').forEach((b) => b.classList.remove('attivo'));
      btn.classList.add('attivo');
      filtroCategoria = btn.dataset.categoria;
      renderizzaMateriali(tuttiIMateriali);
    });
  });

  // ── RENDERING MATERIALI ───────────────────

  /**
   * Filtra i materiali combinando filtro categoria e testo ricerca.
   */
  function applicaFiltri(materiali) {
    return materiali.filter((m) => {
      // Filtro categoria
      const passaCategoria = filtroCategoria === 'tutti' ||
        m.materia === filtroCategoria ||
        m.materia?.toLowerCase().includes(filtroCategoria.toLowerCase());

      // Filtro testo (titolo, materia, autore)
      const passaRicerca = !testoRicerca ||
        m.titolo?.toLowerCase().includes(testoRicerca) ||
        m.materia?.toLowerCase().includes(testoRicerca) ||
        m.autore?.toLowerCase().includes(testoRicerca);

      return passaCategoria && passaRicerca;
    });
  }

  function creaCardMateriale(m) {
    const icona    = iconaPerTipo(m.tipoFile);
    const data     = formattaData(m.dataCaricamento);
    const clsCat   = classeCategoria(m.materia);

    const card = document.createElement('div');
    card.className       = 'card-materiale';
    card.dataset.materia = m.materia;
    card.dataset.titolo  = (m.titolo || '').toLowerCase();
    card.dataset.autore  = (m.autore || '').toLowerCase();

    card.innerHTML = `
      <div class="card-header">
        <span class="card-tipo-icona">${icona}</span>
        <div class="card-titolo-wrap">
          <p class="card-titolo">${escapeHtml(m.titolo)}</p>
          <span class="card-materia-tag ${clsCat}">${escapeHtml(m.materia)}</span>
        </div>
      </div>
      <div class="card-meta">
        <span class="card-autore"><span>👤</span><span>${escapeHtml(m.autore)}</span></span>
        <span class="card-data">${data}</span>
      </div>
      <div class="card-azioni">
        <a href="${m.percorso}" target="_blank" rel="noopener noreferrer" class="btn-apri">↗ Apri</a>
        <a href="${m.percorso}" download="${escapeHtml(m.nomeOriginale)}" class="btn-scarica">↓ Scarica</a>
      </div>
    `;
    return card;
  }

  function renderizzaMateriali(materiali) {
    const filtrati = applicaFiltri(materiali);

    grigliaMateriali.innerHTML = '';

    // Aggiorna contatore
    if (testoRicerca || filtroCategoria !== 'tutti') {
      risultatiCount.style.display = 'block';
      risultatiCount.innerHTML =
        `<strong>${filtrati.length}</strong> risultat${filtrati.length === 1 ? 'o' : 'i'} trovati` +
        (filtroCategoria !== 'tutti' ? ` in <strong>${filtroCategoria}</strong>` : '') +
        (testoRicerca ? ` per "<strong>${escapeHtml(testoRicerca)}</strong>"` : '');
    } else {
      risultatiCount.style.display = 'none';
    }

    if (filtrati.length === 0) {
      grigliaMateriali.style.display = 'none';
      statoVuoto.style.display       = 'block';
      return;
    }

    statoVuoto.style.display       = 'none';
    grigliaMateriali.style.display = 'grid';

    filtrati.forEach((m, i) => {
      const card = creaCardMateriale(m);
      card.style.animationDelay = `${i * 35}ms`;
      grigliaMateriali.appendChild(card);
    });
  }

  async function caricaESintetizzaMateriali() {
    statoMateriali.style.display   = 'flex';
    grigliaMateriali.style.display = 'none';
    statoVuoto.style.display       = 'none';

    const risposta = await getMateriali();
    statoMateriali.style.display = 'none';

    if (!risposta.successo) { statoVuoto.style.display = 'block'; return; }

    tuttiIMateriali = risposta.dati || [];

    // Aggiorna stats sidebar
    const categorieUniche = new Set(tuttiIMateriali.map((m) => m.materia));
    statTotale.textContent  = tuttiIMateriali.length;
    statMaterie.textContent = categorieUniche.size;

    renderizzaMateriali(tuttiIMateriali);
  }

  // ── AVVIO ─────────────────────────────────
  await caricaESintetizzaMateriali();

});