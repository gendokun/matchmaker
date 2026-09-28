# 9InchPairs – 9IF Matchmaker & Spielersuche

Progressive Web App (PWA) für die wöchentliche Spielersuche und Spielpaarung der **9th Inch Fails Tabletop-Community**.

---

## Features

- **PWA-Ready (Progressive Web App)**:
  - Installierbar als eigenständige App auf iOS, Android und Desktop (`manifest.json`, Service Worker `sw.js`).
  - App-Shell-Caching für blitzschnelle Ladezeiten.
  - Dynamischer Offline-Indikator, wenn keine Internetverbindung besteht.
  - Network-First-Strategie für aktuelle Spielgesuche mit Graceful-Fallback.
- **Club-Design**:
  - Exakte Abstimmung auf die visuelle Identität von `drinks.9inchfails.de` (Dunkles Farbschema `#23272c`, Akzentfarbe `#f0692e`, Typografie mit Oswald, Barlow & IBM Plex Mono).
  - Offizielles 9th Inch Fails Club-Logo im Header und App-Icons (192px, 512px, Apple Touch).
- **Lokale Identität ("Remember Name")**:
  - Spielernamen werden via `localStorage` im Browser gemerkt.
  - Formulare ("Ich suche ein Spiel" und "Spiel annehmen") werden automatisch vorbefüllt.
  - Schnelle Namensänderung direkt über das Profil-Badge im Header.
- **System-Filter & Badges**:
  - Filter-Pills für schnelle Umschaltung (`Alle`, `AoS`, `40k`).
  - Automatische Erkennung und sauberes Rendern von System-Badges (Gold für *Age of Sigmar*, Blau für *Warhammer 40k*).
  - Volle Abwärtskompatibilität zur bestehenden Cloudflare D1-Datenbank (keine Schema-Migration nötig).
- **Schutz vor Selbstannahme**:
  - Spieler können ihr eigenes Spielgesuch nicht versehentlich selbst annehmen.

---

## Projektstruktur

```
matchmaker/
├── functions/
│   └── api/
│       ├── games.js            # GET /api/games?date=YYYY-MM-DD
│       ├── confirm.js          # POST /api/confirm (Spielpaarung festlegen)
│       ├── requests/
│       │   ├── index.js        # POST /api/requests (Neues Gesuch)
│       │   └── [id].js         # DELETE /api/requests/:id
│       └── confirmed/
│           └── [id].js         # DELETE /api/confirmed/:id
├── public/
│   ├── favicon.png
│   ├── index.html              # Modernisierte App-Shell
│   ├── manifest.json           # Web App Manifest
│   ├── script.js               # Frontend-Logik, PWA & State
│   ├── style.css               # Design-Tokens & Responsive Styling
│   ├── sw.js                   # Service Worker Cache & Sync
│   └── icons/                  # 9IF-Icons (192x192, 512x512, Apple, Logo)
├── schema.sql                  # D1 SQLite Datenbankschema
└── README.md
```

---

## Deployment (Cloudflare Pages)

Dieses Repository ist an ein Cloudflare Pages-Projekt angebunden. Jedes `push` auf `main` löst einen automatischen Build und Deploy aus:
- **Build Output Directory**: `public`
- **D1 Database Binding**: `DB` (Tabelle `game_requests` & `confirmed_games`)
