# Fridge Manager App

## Obiettivo del progetto

Il progetto prevede la realizzazione di un’applicazione mobile dedicata alla gestione e all’organizzazione degli alimenti all’interno di un frigorifero condiviso.  
L’obiettivo è offrire uno strumento pratico per monitorare le scorte, migliorare la collaborazione tra più utenti e ridurre gli sprechi alimentari.

## Funzionalità principali

L’applicazione è progettata per:

- Ridurre gli sprechi alimentari attraverso un migliore controllo delle scadenze e delle quantità disponibili  
- Facilitare la condivisione degli alimenti tra più utenti  
- Migliorare l’organizzazione degli spazi e delle categorie di prodotti  
- Supportare la creazione di ricette basate sugli ingredienti presenti  

## Contesti di utilizzo

Il sistema è pensato per essere adottato in diversi contesti, tra cui:

- Abitazioni condivise  
- Nuclei familiari  
- Residenze universitarie  
- Ambienti di lavoro  

## Visione

L’obiettivo è fornire uno strumento semplice, intuitivo e affidabile che consenta a gruppi di persone di gestire in modo collaborativo gli alimenti, ottimizzando i consumi e promuovendo una gestione più consapevole delle risorse.

# Avvio programma
**Clonare la repo**
- Aprire terminale `git clone https://github.com/zodiacapricorn/Sfrigo.git`
- Spostarsi nella cartella `cd Sfrigo\Code\sfrigo`

**Controlla che node sia installato**
- Inserisci `node -v` nel terminale, se non viene restituita la versione di node allora bisogna installarlo. (sito: https://nodejs.org, dopodiche riavvia il terminale e riesegui il comando).

**Installa dependencies e avvio**
- Apri il terminale e inserisci `npm install`, dopodiché inserire `npm run dev`

# Analisi Statica
**Clonare la repo**
Aprire il terminale e inserire `npx eslint . -f html -o eslint-reports/eslint-report.html`, creerà un file html contenente il report delle pagine `.js` controllate e i relativi problemi.
