# Mansa Projekt

Dieses Repository beinhaltet eine React/TypeScript Frontend-Anwendung sowie eine Spring Boot Backend-API. Beide Komponenten sind Docker-fähig und können lokal mit `docker compose` gestartet oder in der Cloud bereitgestellt werden.

## Fachlicher Überblick

Das System dient als Plattform für das Verwalten sogenannter **Jamiahs** (digitale Gemeinschaften) und den Handel mit **Risiken**. Nutzer können Profile anlegen, Jamiah-Gruppen gründen oder beitreten und Risiken einstellen bzw. darauf bieten. Eine Chatfunktion nutzt OpenAI, um Konversationen zu unterstützen.

### Kernfunktionen

- **Jamiah-Management:** Gruppen besitzen Eigenschaften wie monatliche Beiträge, maximale Teilnehmerzahl und Startdatum. CRUD-Endpunkte stehen unter `/api/jamiahs` bereit.
- **Risikohandel:** Risiken enthalten Angaben zu Typ, Wert, Laufzeit und Status (Draft, Published, Deal etc.). Verwaltung erfolgt über `/api/risks`.
- **Benutzerprofile:** Ein Profil speichert Stammdaten und ist über `/api/userProfiles` erreichbar.
- **Publisher-Informationen:** Risiken können einen Publisher enthalten, der separat verwaltet wird.
- **Chat mit KI-Unterstützung:** Das Frontend nutzt Firebase Auth, Firestore und OpenAI um Nachrichten zu speichern und automatisierte Antworten zu generieren.

## Lokale Ausführung

```bash
docker compose up --build
```

Damit werden drei Container gestartet:

1. **backend** – Spring Boot REST API auf Port 8080
2. **frontend** – React-App ausgeliefert durch nginx auf Port 3000
3. **db** – MySQL 8 mit dem Schema `mansa`

Das Compose-Setup setzt die Umgebungsvariable `REACT_APP_BACKEND_URL` im
Frontend-Container auf `http://backend:8080`, sodass API-Aufrufe korrekt an die
Backend-Service-Adresse geleitet werden.

Zugangsdaten für die Datenbank sind in `docker-compose.yml` hinterlegt und können per Umgebungsvariablen überschrieben werden.

## Cloud Architektur

### Continuous Deployment

Im Verzeichnis `.github/workflows` befindet sich ein GitHub-Actions-Workflow (`deploy.yml`), der beide Komponenten automatisiert baut und deployt:

1. **Frontend:**
   - Build der React-Anwendung mit Node 18
   - Deployment der gebauten Dateien zu **Firebase Hosting** mittels `firebase deploy`
2. **Backend:**
   - Docker-Image Build mit Maven (siehe `backend/Dockerfile`)
   - Push des Images in die **Google Container Registry (GCR)**
   - Rollout auf **Google Cloud Run** inklusive Anbindung an **Cloud SQL** über den Cloud SQL Proxy

Zugangsdaten und Konfigurationswerte wie Firebase- und GCP-Anmeldeinformationen werden als GitHub-Secrets hinterlegt.

### Laufzeitumgebung

- **Frontend** wird als statische Anwendung von Firebase Hosting ausgeliefert.
- **Backend** läuft in einer Cloud-Run-Instanz (Region `europe-west3`). Dort verbindet sich der Spring-Boot-Dienst über den Cloud-SQL-Connector mit einer **MySQL Cloud SQL** Instanz.
- **Datenbankcredentials** werden in Cloud Secret Manager gespeichert und beim Deployment als Umgebungsvariablen eingebunden (`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).

### Technologie-Stack

- **React** / **TypeScript** im Frontend
- **Firebase** für Authentifizierung, Firestore und Hosting
- **OpenAI API** für Chatbot-Antworten
- **Spring Boot** (Java 17) im Backend
- **Spring Data JPA** mit MySQL
- **Docker** zur Containerisierung
- **GitHub Actions** für Build und Deployment
- **Google Cloud Run** + **Cloud SQL** als Ausführungsumgebung

## Weitere Hinweise

- Individuelle Umgebungsvariablen für das Frontend werden über eine `.env` Datei (siehe `frontend/.env.example`) konfiguriert.
- Das Backend kann sowohl lokal mit einer mitgelieferten MySQL-Datenbank laufen als auch in der Cloud mit Cloud SQL.
- Die Chatfunktion befindet sich unter `/chat` und nutzt OpenAI über das Frontend direkt im Browser.

