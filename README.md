# 🏛️ AGORÀ v6.0 - Piattaforma per Studenti Internazionali ed Expat

Agorà v6.0 è una Web Application Full-Stack sviluppata come progetto personale e Capolavoro per l'anno scolastico 2025/2026. La piattaforma si propone come un ecosistema collaborativo sicuro e performante, pensato per aiutare gli studenti internazionali e gli expat a orientarsi, condividere materiali didattici e fare community attraverso un forum dedicato.

Il progetto unisce le competenze di programmazione web lato server (Node.js/Express) con le logiche strutturali e di sicurezza mutuate dallo studio dell'Informatica (gestione delle eccezioni, strutture dati, paradigmi OOP e sistemi IAM).

### 📂 Download del Progetto (Google Drive)
Per esaminare il codice sorgente completo, l'architettura dei file e testare l'applicazione in ambiente locale, è possibile scaricare il pacchetto dedicato direttamente dal seguente collegamento:

🔗 **Link per il download:** https://drive.google.com/file/d/1O8WEJd-FsnkFukXp9DfMm0q4l4xnYXue/view?usp=sharing

*(Nota: Il file `.zip` contiene l'intera struttura delle directory, inclusi i database JSON locali e il file `server.js`. Una volta estratto, seguire le istruzioni presenti in questo file `README.md` per l'avvio rapido del server).*

---

## 🛠️ Tecnologie Utilizzate

* **Frontend:** HTML5, CSS3 (Stile "Neoclassico Digitale"), JavaScript Vanilla (Asincrono tramite Fetch API e manipolazione dinamica del DOM).
* **Backend:** Node.js, Express.js (Gestione del routing, REST API e Middleware).
* **Persistenza Dati:** Database locali su file piatti in formato JSON (`users.json`, `materials.json`, `logs.json`).
* **Sicurezza & Upload:** Libreria `multer` per il filtraggio e il caricamento sicuro dei file, sistema di auditing automatizzato e controllo degli accessi basato sui ruoli (RBAC).

---

## 📁 Struttura delle Cartelle

```text
AGORA/
├── data/
│   ├── logs.json          # Registro di auditing delle autenticazioni
│   ├── materials.json     # Database dei materiali condivisi
│   └── users.json         # Database degli utenti e dei ruoli (IAM)
├── public/                # File statici distribuiti dal server
│   ├── css/               # Fogli di stile (Interfaccia UI/UX)
│   ├── js/                # Logica client-side e chiamate API (Fetch)
│   ├── uploads/           # Cartella di destinazione dei file caricati
│   ├── admin.html         # Pannello di amministrazione protetto
│   ├── dashboard.html     # Hub principale dei materiali e delle nazioni
│   └── index.html         # Pagina di Login e Registrazione (Home)
├── .gitignore
├── package.json           # Dipendenze e script del progetto
├── README.md              # Questo file di istruzioni
└── server.js              # Entry point del backend in Node.js

```

## 🚀 Istruzioni per l'Installazione e l'Esecuzione Locale

Per testare l'applicazione sul proprio computer, assicurarsi di avere installato **Node.js** (versione 16 o superiore), quindi seguire questi passaggi:

### 1. Scaricare ed estrarre il progetto

Scarica il pacchetto `.zip` da Google Drive ed estrai il contenuto in una cartella, oppure clona la repository da GitHub.

### 2. Installare le dipendenze

Apri il terminale del tuo computer (o il terminale integrato di VS Code), posizionati all'interno della cartella principale del progetto ed esegui il seguente comando per installare Express e Multer:

```
npm install

```

_(Nota: Questo comando ricreerà la cartella node_modules necessaria al funzionamento del server)._

### 3. Avviare il server

Sempre dal terminale, lancia l'applicazione con il comando:

```
node server.js

```

Se l'avvio va a buon fine, nel terminale comparirà il messaggio: `Server running on port 3000`.

### 4. Aprire l'applicazione nel browser

Apri il tuo browser web (Chrome, Firefox o Edge) e collegati al seguente indirizzo:

```
http://localhost:3000

```

Verrai reindirizzato alla pagina di Login di Agorà v6.0, dove potrai registrarti e testare tutte le funzionalità (Hub materiali, Forum e Pannello Admin).

## 🔒 Credenziali di Test preconfigurate (Opzionali)

Per testare immediatamente i diversi livelli di accesso (IAM) senza registrarsi, è possibile utilizzare i seguenti account di prova già presenti nel database:

-   **Account Studente Standard:**
    
    -   **Username:** `marco.rossi`
        
    -   **Password:** `studente123`
        
-   **Account Amministratore (Admin):**
    
    -   **Username:** `admin`
        
    -   **Password:** `admin123`
        

**Sviluppato da:** Gabriele Savino (Classe  4^B INFO)

**Anno Scolastico:** 2025/2026
