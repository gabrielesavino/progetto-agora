/**
 * AGORÀ — nations.js
 * Lista delle 100 nazionalità/community più internazionali
 * con flag emoji, ordinamento e supporto per aggiunta custom.
 */

const NAZIONI = [
  { codice: 'IT', nome: 'Italia',              bandiera: '🇮🇹' },
  { codice: 'US', nome: 'Stati Uniti',         bandiera: '🇺🇸' },
  { codice: 'GB', nome: 'Regno Unito',         bandiera: '🇬🇧' },
  { codice: 'DE', nome: 'Germania',            bandiera: '🇩🇪' },
  { codice: 'FR', nome: 'Francia',             bandiera: '🇫🇷' },
  { codice: 'ES', nome: 'Spagna',              bandiera: '🇪🇸' },
  { codice: 'NL', nome: 'Paesi Bassi',         bandiera: '🇳🇱' },
  { codice: 'PT', nome: 'Portogallo',          bandiera: '🇵🇹' },
  { codice: 'BE', nome: 'Belgio',              bandiera: '🇧🇪' },
  { codice: 'CH', nome: 'Svizzera',            bandiera: '🇨🇭' },
  { codice: 'AT', nome: 'Austria',             bandiera: '🇦🇹' },
  { codice: 'SE', nome: 'Svezia',              bandiera: '🇸🇪' },
  { codice: 'NO', nome: 'Norvegia',            bandiera: '🇳🇴' },
  { codice: 'DK', nome: 'Danimarca',           bandiera: '🇩🇰' },
  { codice: 'FI', nome: 'Finlandia',           bandiera: '🇫🇮' },
  { codice: 'PL', nome: 'Polonia',             bandiera: '🇵🇱' },
  { codice: 'CZ', nome: 'Repubblica Ceca',     bandiera: '🇨🇿' },
  { codice: 'SK', nome: 'Slovacchia',          bandiera: '🇸🇰' },
  { codice: 'HU', nome: 'Ungheria',            bandiera: '🇭🇺' },
  { codice: 'RO', nome: 'Romania',             bandiera: '🇷🇴' },
  { codice: 'BG', nome: 'Bulgaria',            bandiera: '🇧🇬' },
  { codice: 'HR', nome: 'Croazia',             bandiera: '🇭🇷' },
  { codice: 'RS', nome: 'Serbia',              bandiera: '🇷🇸' },
  { codice: 'GR', nome: 'Grecia',              bandiera: '🇬🇷' },
  { codice: 'TR', nome: 'Turchia',             bandiera: '🇹🇷' },
  { codice: 'UA', nome: 'Ucraina',             bandiera: '🇺🇦' },
  { codice: 'RU', nome: 'Russia',              bandiera: '🇷🇺' },
  { codice: 'CN', nome: 'Cina',               bandiera: '🇨🇳' },
  { codice: 'JP', nome: 'Giappone',            bandiera: '🇯🇵' },
  { codice: 'KR', nome: 'Corea del Sud',       bandiera: '🇰🇷' },
  { codice: 'IN', nome: 'India',               bandiera: '🇮🇳' },
  { codice: 'PK', nome: 'Pakistan',            bandiera: '🇵🇰' },
  { codice: 'BD', nome: 'Bangladesh',          bandiera: '🇧🇩' },
  { codice: 'LK', nome: 'Sri Lanka',           bandiera: '🇱🇰' },
  { codice: 'NP', nome: 'Nepal',               bandiera: '🇳🇵' },
  { codice: 'VN', nome: 'Vietnam',             bandiera: '🇻🇳' },
  { codice: 'TH', nome: 'Tailandia',           bandiera: '🇹🇭' },
  { codice: 'ID', nome: 'Indonesia',           bandiera: '🇮🇩' },
  { codice: 'MY', nome: 'Malaysia',            bandiera: '🇲🇾' },
  { codice: 'SG', nome: 'Singapore',           bandiera: '🇸🇬' },
  { codice: 'PH', nome: 'Filippine',           bandiera: '🇵🇭' },
  { codice: 'TW', nome: 'Taiwan',              bandiera: '🇹🇼' },
  { codice: 'HK', nome: 'Hong Kong',           bandiera: '🇭🇰' },
  { codice: 'MN', nome: 'Mongolia',            bandiera: '🇲🇳' },
  { codice: 'KZ', nome: 'Kazakistan',          bandiera: '🇰🇿' },
  { codice: 'UZ', nome: 'Uzbekistan',          bandiera: '🇺🇿' },
  { codice: 'IR', nome: 'Iran',                bandiera: '🇮🇷' },
  { codice: 'IQ', nome: 'Iraq',               bandiera: '🇮🇶' },
  { codice: 'SA', nome: 'Arabia Saudita',      bandiera: '🇸🇦' },
  { codice: 'AE', nome: 'Emirati Arabi',       bandiera: '🇦🇪' },
  { codice: 'IL', nome: 'Israele',             bandiera: '🇮🇱' },
  { codice: 'JO', nome: 'Giordania',           bandiera: '🇯🇴' },
  { codice: 'LB', nome: 'Libano',              bandiera: '🇱🇧' },
  { codice: 'SY', nome: 'Siria',               bandiera: '🇸🇾' },
  { codice: 'EG', nome: 'Egitto',              bandiera: '🇪🇬' },
  { codice: 'MA', nome: 'Marocco',             bandiera: '🇲🇦' },
  { codice: 'TN', nome: 'Tunisia',             bandiera: '🇹🇳' },
  { codice: 'DZ', nome: 'Algeria',             bandiera: '🇩🇿' },
  { codice: 'LY', nome: 'Libia',               bandiera: '🇱🇾' },
  { codice: 'NG', nome: 'Nigeria',             bandiera: '🇳🇬' },
  { codice: 'GH', nome: 'Ghana',               bandiera: '🇬🇭' },
  { codice: 'KE', nome: 'Kenya',               bandiera: '🇰🇪' },
  { codice: 'ET', nome: 'Etiopia',             bandiera: '🇪🇹' },
  { codice: 'TZ', nome: 'Tanzania',            bandiera: '🇹🇿' },
  { codice: 'UG', nome: 'Uganda',              bandiera: '🇺🇬' },
  { codice: 'CM', nome: 'Camerun',             bandiera: '🇨🇲' },
  { codice: 'CI', nome: 'Costa d\'Avorio',     bandiera: '🇨🇮' },
  { codice: 'SN', nome: 'Senegal',             bandiera: '🇸🇳' },
  { codice: 'ZA', nome: 'Sudafrica',           bandiera: '🇿🇦' },
  { codice: 'BR', nome: 'Brasile',             bandiera: '🇧🇷' },
  { codice: 'AR', nome: 'Argentina',           bandiera: '🇦🇷' },
  { codice: 'CO', nome: 'Colombia',            bandiera: '🇨🇴' },
  { codice: 'MX', nome: 'Messico',             bandiera: '🇲🇽' },
  { codice: 'CL', nome: 'Cile',               bandiera: '🇨🇱' },
  { codice: 'PE', nome: 'Perù',               bandiera: '🇵🇪' },
  { codice: 'VE', nome: 'Venezuela',           bandiera: '🇻🇪' },
  { codice: 'EC', nome: 'Ecuador',             bandiera: '🇪🇨' },
  { codice: 'BO', nome: 'Bolivia',             bandiera: '🇧🇴' },
  { codice: 'PY', nome: 'Paraguay',            bandiera: '🇵🇾' },
  { codice: 'UY', nome: 'Uruguay',             bandiera: '🇺🇾' },
  { codice: 'CA', nome: 'Canada',              bandiera: '🇨🇦' },
  { codice: 'AU', nome: 'Australia',           bandiera: '🇦🇺' },
  { codice: 'NZ', nome: 'Nuova Zelanda',       bandiera: '🇳🇿' },
  { codice: 'ZA', nome: 'Zimbabwe',            bandiera: '🇿🇼' },
  { codice: 'CU', nome: 'Cuba',               bandiera: '🇨🇺' },
  { codice: 'DO', nome: 'Repubblica Dominicana', bandiera: '🇩🇴' },
  { codice: 'JM', nome: 'Giamaica',            bandiera: '🇯🇲' },
  { codice: 'AF', nome: 'Afghanistan',         bandiera: '🇦🇫' },
  { codice: 'MM', nome: 'Myanmar',             bandiera: '🇲🇲' },
  { codice: 'KH', nome: 'Cambogia',            bandiera: '🇰🇭' },
  { codice: 'LA', nome: 'Laos',               bandiera: '🇱🇦' },
  { codice: 'MK', nome: 'Macedonia del Nord',  bandiera: '🇲🇰' },
  { codice: 'AL', nome: 'Albania',             bandiera: '🇦🇱' },
  { codice: 'BA', nome: 'Bosnia Erzegovina',   bandiera: '🇧🇦' },
  { codice: 'SI', nome: 'Slovenia',            bandiera: '🇸🇮' },
  { codice: 'LV', nome: 'Lettonia',            bandiera: '🇱🇻' },
  { codice: 'LT', nome: 'Lituania',            bandiera: '🇱🇹' },
  { codice: 'EE', nome: 'Estonia',             bandiera: '🇪🇪' },
  { codice: 'IE', nome: 'Irlanda',             bandiera: '🇮🇪' },
  { codice: 'IS', nome: 'Islanda',             bandiera: '🇮🇸' },
];

// ─────────────────────────────────────────────
//  NATIONALITY PICKER — Componente UI
// ─────────────────────────────────────────────

/**
 * Inizializza il componente nationality picker personalizzato.
 * Sostituisce un <select> standard con un dropdown ricercabile.
 */
function inizializzaNationalityPicker() {
  const display    = document.getElementById('nationality-display');
  const dropdown   = document.getElementById('nationality-dropdown');
  const searchInput= document.getElementById('nationality-search');
  const optionsEl  = document.getElementById('nationality-options');
  const flagEl     = document.getElementById('nationality-flag');
  const labelEl    = document.getElementById('nationality-label');
  const hiddenInput= document.getElementById('reg-nationality');

  if (!display) return; // Non siamo sulla pagina di registrazione

  // Carica tutte le opzioni
  let listaCompleta = [...NAZIONI].sort((a, b) => a.nome.localeCompare(b.nome));
  let nazioneScelta = null;

  function renderOpzioni(lista) {
    optionsEl.innerHTML = '';

    // Opzione "Aggiungi nuova"
    const custom = document.createElement('div');
    custom.className = 'nat-option nat-option-custom';
    custom.innerHTML = `<span class="nat-bandiera">✦</span><span class="nat-nome">Aggiungi altra nazione…</span>`;
    custom.addEventListener('click', () => aggiungiNazioneCustom());

    lista.forEach((nazione) => {
      const opt = document.createElement('div');
      opt.className = `nat-option${nazioneScelta?.codice === nazione.codice ? ' selezionata' : ''}`;
      opt.dataset.codice   = nazione.codice;
      opt.dataset.nome     = nazione.nome;
      opt.dataset.bandiera = nazione.bandiera;
      opt.innerHTML = `<span class="nat-bandiera">${nazione.bandiera}</span><span class="nat-nome">${nazione.nome}</span>`;

      opt.addEventListener('click', () => selezionaNazione(nazione));
      optionsEl.appendChild(opt);
    });

    optionsEl.appendChild(custom);
  }

  function selezionaNazione(nazione) {
    nazioneScelta     = nazione;
    flagEl.textContent  = nazione.bandiera;
    labelEl.textContent = nazione.nome;
    hiddenInput.value   = nazione.nome;
    display.dataset.valore = nazione.nome;
    chiudiDropdown();

    // Rimuove classe errore se presente
    document.getElementById('nationality-picker').classList.remove('errore');
  }

  function aggiungiNazioneCustom() {
    const nome = prompt('Inserisci il nome della nazione o community:');
    if (!nome || !nome.trim()) return;

    const nomePulito = nome.trim();

    // Controlla se esiste già
    const esistente = listaCompleta.find((n) => n.nome.toLowerCase() === nomePulito.toLowerCase());
    if (esistente) {
      selezionaNazione(esistente);
      return;
    }

    // Aggiunge alla lista locale (solo per questa sessione)
    const nuova = { codice: 'XX', nome: nomePulito, bandiera: '🌐' };
    listaCompleta = [...listaCompleta, nuova].sort((a, b) => a.nome.localeCompare(b.nome));
    selezionaNazione(nuova);
  }

  function apriDropdown() {
    dropdown.style.display = 'block';
    display.setAttribute('aria-expanded', 'true');
    searchInput.value = '';
    renderOpzioni(listaCompleta);
    setTimeout(() => searchInput.focus(), 50);
  }

  function chiudiDropdown() {
    dropdown.style.display = 'none';
    display.setAttribute('aria-expanded', 'false');
  }

  // Ricerca live
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    const filtrate = q
      ? listaCompleta.filter((n) => n.nome.toLowerCase().includes(q))
      : listaCompleta;
    renderOpzioni(filtrate);
  });

  // Toggle dropdown
  display.addEventListener('click', () => {
    dropdown.style.display === 'none' ? apriDropdown() : chiudiDropdown();
  });

  display.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apriDropdown(); }
    if (e.key === 'Escape') chiudiDropdown();
  });

  // Chiudi cliccando fuori
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#nationality-picker')) chiudiDropdown();
  });

  // Render iniziale
  renderOpzioni(listaCompleta);
}

// Inizializzazione gestita esternamente da main.js dopo DOMContentLoaded.