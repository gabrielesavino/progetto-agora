/**
 * AGORÀ — dashboard.js (Fase 6)
 * Controller Dashboard Studente.
 * Gestisce: Menu Profilo, Caricamento e Ricerca Live Materiali,
 * Navigazione a Tab e intero sistema Forum (Thread + Commenti).
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ── PROTEZIONE ROTTA CLIENT-SIDE ──────────────────────
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

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#account-menu')) chiudiDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudiDropdown();
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    cancellaSessione();
    window.location.href = '/index.html';
  });

  // ── RIFERIMENTI DOM (MATERIALI & UPLOAD) ───────────────────
  const zonaUpload           = document.getElementById('zona-upload');
  const inputFile            = document.getElementById('input-file');
  const btnSfoglia           = document.getElementById('btn-sfoglia');
  const zonaContenuto        = document.getElementById('zona-upload-contenuto');
  const zonaFileSelezionato  = document.getElementById('zona-file-selezionato');
  const fileNomeDisplay      = document.getElementById('file-nome-display');
  const fileDimDisplay       = document.getElementById('file-dimensione-display');
  const fileIconaTipo        = document.getElementById('file-icona-tipo');
  const btnRimuovi           = document.getElementById('btn-rimuovi-file');
  const formUpload           = document.getElementById('form-upload');
  const inputTitolo          = document.getElementById('upload-titolo');
  const selectMateria        = document.getElementById('upload-materia');
  const campoCatCustom       = document.getElementById('campo-categoria-custom');
  const inputCatCustom       = document.getElementById('upload-categoria-custom');
  const btnUpload            = document.getElementById('btn-upload');
  const feedbackUpload       = document.getElementById('feedback-upload');
  const grigliaMateriali     = document.getElementById('griglia-materiali');
  const statoMateriali       = document.getElementById('stato-materiali');
  const statoVuoto           = document.getElementById('stato-vuoto');
  const inputRicerca         = document.getElementById('input-ricerca');
  const btnCancellaRicerca   = document.getElementById('btn-cancella-ricerca');
  const risultatiCount       = document.getElementById('risultati-count');
  const statTotale           = document.getElementById('stat-totale');

  // ── RIFERIMENTI DOM (FORUM - FASE 6) ──────────────────────
  const btnMostraCreaPost    = document.getElementById('btn-mostra-crea-post');
  const formNuovoPost        = document.getElementById('form-nuovo-post');
  const feedbackForum        = document.getElementById('feedback-forum');
  const inputForumTitolo     = document.getElementById('forum-titolo');
  const selectForumCategoria = document.getElementById('forum-categoria');
  const textareaForumMessaggio = document.getElementById('forum-messaggio');
  const btnAnnullaPost       = document.getElementById('btn-annulla-post');
  const contenitorePostForum = document.getElementById('contenitore-post-forum');
  const statoForumLista      = document.getElementById('stato-forum-lista');
  const statoVuotoForum      = document.getElementById('stato-vuoto-forum');
  const statPostTotali       = document.getElementById('stat-post-totali');

  // ── STATO LOCALE ──────────────────────────
  let fileScelto        = null;
  let tuttiIMateriali   = [];
  let filtroCategoria   = 'tutti';
  let testoRicerca      = '';
  
  let tuttiIPost        = [];
  let filtroForumTag    = 'tutti';

  // ── NAVIGAZIONE SIDEBAR (CAMBIO TAB/SEZIONE) ──────────────────
  const linksSidebar = document.querySelectorAll('.sidebar-nav .sidebar-link');
  const sezioni = {
    '#sezione-upload': document.getElementById('sezione-upload'),
    '#sezione-materiali': document.getElementById('sezione-materiali'),
    '#sezione-forum': document.getElementById('sezione-forum')
  };

  linksSidebar.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      linksSidebar.forEach((l) => l.classList.remove('attivo'));
      link.classList.add('attivo');

      const target = link.getAttribute('href');
      Object.keys(sezioni).forEach((key) => {
        if (sezioni[key]) {
          sezioni[key].style.display = (key === target) ? 'block' : 'none';
        }
      });

      // Ricarica dati aggiornati all'ingresso del tab
      if (target === '#sezione-materiali') caricaESintetizzaMateriali();
      if (target === '#sezione-forum') caricaDiscussioniForum();
    });
  });

  // ── GESTIONE INTERFACCIA APERTURA NUOVO POST FORUM ────────────
  if (btnMostraCreaPost && formNuovoPost && btnAnnullaPost) {
    btnMostraCreaPost.addEventListener('click', () => {
      formNuovoPost.style.display = 'block';
      btnMostraCreaPost.style.display = 'none';
      nascondiFeedback(feedbackForum);
    });

    btnAnnullaPost.addEventListener('click', () => {
      formNuovoPost.style.display = 'none';
      btnMostraCreaPost.style.display = 'block';
      formNuovoPost.reset();
      nascondiFeedback(feedbackForum);
    });
  }

  // ── UTILITY CONDIVISE ──────────────────────────────
  function mostraFeedback(el, testo, tipo, icona = '') {
    if (!el) return;
    el.className = `messaggio-feedback ${tipo} visibile`;
    el.innerHTML = icona
      ? `<span class="icona">${icona}</span><span>${testo}</span>`
      : `<span>${testo}</span>`;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nascondiFeedback(el) {
    if (!el) return;
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

  function classeCategoria(cat) {
    if (!cat) return 'cat-altro';
    const c = cat.toLowerCase();
    if (c.includes('informatica') || c.includes('cloud')) return 'cat-informatica';
    if (c.includes('lingue') || c.includes('culture'))    return 'cat-lingue';
    if (c.includes('expat') || c.includes('integrazione'))return 'cat-expat';
    return 'cat-altro';
  }

  // ── SEZIONE UPLOAD MATERIALI ────────────────────────
  selectMateria.addEventListener('change', () => {
    const mostra = selectMateria.value === 'altro';
    campoCatCustom.style.display = mostra ? 'block' : 'none';
    if (!mostra) inputCatCustom.value = '';
    selectMateria.classList.remove('errore');
  });

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
    } else {
      mostraFeedback(feedbackUpload, risultato.messaggio, 'errore', '✕');
    }
  });

  inputTitolo.addEventListener('input',    () => inputTitolo.classList.remove('errore'));
  selectMateria.addEventListener('change', () => selectMateria.classList.remove('errore'));
  inputCatCustom.addEventListener('input', () => inputCatCustom.classList.remove('errore'));


  // ── SEZIONE VISUALIZZAZIONE & FILTRO MATERIALI ──────────────────
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

  document.querySelectorAll('#filtri-categoria .filtro-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filtri-categoria .filtro-cat-btn').forEach((b) => b.classList.remove('attivo'));
      btn.classList.add('attivo');
      filtroCategoria = btn.dataset.categoria;
      renderizzaMateriali(tuttiIMateriali);
    });
  });

  function applicaFiltriMateriali(materiali) {
    return materiali.filter((m) => {
      const passaCategoria = filtroCategoria === 'tutti' ||
        m.materia === filtroCategoria ||
        m.materia?.toLowerCase().includes(filtroCategoria.toLowerCase());

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
    card.className = 'card-materiale';

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
    const filtrati = applicaFiltriMateriali(materiali);
    grigliaMateriali.innerHTML = '';

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
    statTotale.textContent  = tuttiIMateriali.length;

    renderizzaMateriali(tuttiIMateriali);
  }


  // ── SEZIONE FORUM: INVIO THREAD E COMPORTAMENTO (FASE 6) ───────────
  formNuovoPost.addEventListener('submit', async (e) => {
    e.preventDefault();
    nascondiFeedback(feedbackForum);

    const titolo = inputForumTitolo.value.trim();
    const categoria = selectForumCategoria.value;
    const messaggio = textareaForumMessaggio.value.trim();

    if (!titolo) { inputForumTitolo.classList.add('errore'); mostraFeedback(feedbackForum, 'Inserisci l\'oggetto.', 'errore', '⚠'); return; }
    if (!categoria) { selectForumCategoria.classList.add('errore'); mostraFeedback(feedbackForum, 'Scegli la tematica.', 'errore', '⚠'); return; }
    if (!messaggio) { textareaForumMessaggio.classList.add('errore'); mostraFeedback(feedbackForum, 'Scrivi un messaggio corpo.', 'errore', '⚠'); return; }

    const btnInviaPost = formNuovoPost.querySelector('button[type="submit"]');
    btnInviaPost.disabled = true;
    btnInviaPost.textContent = 'Pubblicazione in corso…';

    const risposta = await creaPost(titolo, categoria, messaggio, utente.username);

    btnInviaPost.disabled = false;
    btnInviaPost.textContent = 'Pubblica post';

    if (risposta.successo) {
      mostraFeedback(feedbackForum, 'Discussione avviata con successo!', 'successo', '✓');
      formNuovoPost.reset();
      
      setTimeout(() => {
        formNuovoPost.style.display = 'none';
        btnMostraCreaPost.style.display = 'block';
        nascondiFeedback(feedbackForum);
      }, 1500);

      await caricaDiscussioniForum();
    } else {
      mostraFeedback(feedbackForum, risposta.messaggio || 'Errore di rete.', 'errore', '✕');
    }
  });

  inputForumTitolo.addEventListener('input', () => inputForumTitolo.classList.remove('errore'));
  selectForumCategoria.addEventListener('change', () => selectForumCategoria.classList.remove('errore'));
  textareaForumMessaggio.addEventListener('input', () => textareaForumMessaggio.classList.remove('errore'));

  // Filtri tematici del forum
  document.querySelectorAll('#filtri-forum-tag .filtro-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filtri-forum-tag .filtro-cat-btn').forEach((b) => b.classList.remove('attivo'));
      btn.classList.add('attivo');
      filtroForumTag = btn.dataset.tag;
      renderizzaPosts(tuttiIPost);
    });
  });

  // Caricamento discussioni
  async function caricaDiscussioniForum() {
    if (!statoForumLista || !contenitorePostForum) return;

    statoForumLista.style.display = 'flex';
    contenitorePostForum.style.display = 'none';
    statoVuotoForum.style.display = 'none';

    const risposta = await getPosts();
    statoForumLista.style.display = 'none';

    if (!risposta.successo) {
      statoVuotoForum.style.display = 'block';
      return;
    }

    tuttiIPost = risposta.dati || [];
    if (statPostTotali) statPostTotali.textContent = tuttiIPost.length;

    renderizzaPosts(tuttiIPost);
  }

  // Renderizzazione schede thread + commenti interattivi inline
  function renderizzaPosts(posts) {
    contenitorePostForum.innerHTML = '';

    const filtrati = posts.filter(p => filtroForumTag === 'tutti' || p.categoria === filtroForumTag);

    if (filtrati.length === 0) {
      contenitorePostForum.style.display = 'none';
      statoVuotoForum.style.display = 'block';
      return;
    }

    statoVuotoForum.style.display = 'none';
    contenitorePostForum.style.display = 'flex';

    filtrati.forEach((post, i) => {
      const cardPost = document.createElement('div');
      cardPost.className = 'forum-post-card';
      cardPost.style.animationDelay = `${i * 30}ms`;

      const dataThread = formattaData(post.timestamp || post.dataCreazione);
      const listaCommenti = post.commenti || [];

      let clsTag = 'cat-altro';
      if (post.categoria === 'Alloggi') clsTag = 'cat-informatica';
      if (post.categoria === 'Burocrazia') clsTag = 'cat-expat';
      if (post.categoria === 'Lavoro') clsTag = 'cat-lingue';

      cardPost.innerHTML = `
        <div class="forum-post-header">
          <div class="forum-post-main-info">
            <span class="card-materia-tag ${clsTag}">${escapeHtml(post.categoria)}</span>
            <h3 class="forum-post-titolo">${escapeHtml(post.titolo)}</h3>
          </div>
          <div class="forum-post-meta">
            <span>👤 ${escapeHtml(post.autore)}</span>
            <span>📅 ${dataThread}</span>
          </div>
        </div>
        <div class="forum-post-corpo">
          <p>${escapeHtml(post.messaggio || post.corpo)}</p>
        </div>
        
        <div class="forum-commenti-sezione">
          <button class="btn-toggle-commenti" data-id="${post.id}">
            💬 Risposte (${listaCommenti.length})
          </button>
          
          <div class="forum-commenti-box" id="box-commenti-${post.id}" style="display:none;">
            <div class="forum-lista-commenti">
              ${renderizzaCommentiHtml(listaCommenti)}
            </div>
            
            <form class="form-nuovo-commento" data-id="${post.id}">
              <input type="text" placeholder="Scrivi una risposta pubblica..." maxlength="1000" required />
              <button type="submit" class="btn-scarica" style="padding: 0.4rem 1.2rem; font-size:0.8rem;">Rispondi</button>
            </form>
          </div>
        </div>
      `;

      // Evento Toggle visualizzazione risposte
      const btnToggle = cardPost.querySelector('.btn-toggle-commenti');
      const boxCommenti = cardPost.querySelector(`#box-commenti-${post.id}`);
      btnToggle.addEventListener('click', () => {
        const nascondi = boxCommenti.style.display === 'block';
        boxCommenti.style.display = nascondi ? 'none' : 'block';
      });

      // Invio commenti sotto un thread specifico
      const formCommento = cardPost.querySelector('.form-nuovo-commento');
      formCommento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputField = formCommento.querySelector('input');
        const testoRisposta = inputField.value.trim();
        if (!testoRisposta) return;

        const btnRispondi = formCommento.querySelector('button');
        btnRispondi.disabled = true;

        const esito = await creaCommento(post.id, testoRisposta, utente.username);
        btnRispondi.disabled = false;

        if (esito.successo) {
          inputField.value = '';
          await caricaDiscussioniForum();
          // Mantiene aperto il box dopo il re-render
          const boxEspanso = document.getElementById(`box-commenti-${post.id}`);
          if (boxEspanso) boxEspanso.style.display = 'block';
        } else {
          alert(esito.messaggio || 'Impossibile inviare il commento.');
        }
      });

      contenitorePostForum.appendChild(cardPost);
    });
  }

  function renderizzaCommentiHtml(commenti) {
    if (!commenti || commenti.length === 0) {
      return `<div class="commento-vuoto">Nessuna risposta presente. Avvia il dialogo!</div>`;
    }
    return commenti.map(c => `
      <div class="forum-commento-singolo">
        <div class="commento-meta">
          <span class="commento-autore">👤 ${escapeHtml(c.autore)}</span>
          <span class="commento-data">${formattaData(c.timestamp || c.data)}</span>
        </div>
        <p class="commento-testo">${escapeHtml(c.messaggio || c.testo || c.corpo)}</p>
      </div>
    `).join('');
  }

  // ── AVVIO IN PARALLELO DELLE RISORSE ───────────────────────
  await Promise.all([
    caricaESintetizzaMateriali(),
    caricaDiscussioniForum()
  ]);

});