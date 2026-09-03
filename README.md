# PollApp

Eine Angular-Anwendung zum Erstellen und Beantworten von Umfragen. Umfragen werden mit
mehreren Fragen und Antwortmöglichkeiten angelegt, nach Kategorie gefiltert und in Echtzeit
ausgewertet. Die Daten liegen in einer Supabase-Datenbank.

## Funktionen

- **Umfragen anlegen** – bis zu 4 Fragen mit je 2 bis 6 Antworten, wahlweise mit Mehrfachauswahl
- **Kategorien** – Sport, Health, Gaming, Vacation, Food, Artist
- **Enddatum** – optional; ohne Enddatum läuft eine Umfrage unbegrenzt weiter
- **Filter auf der Startseite** – laufende oder bereits beendete Umfragen, zusätzlich nach Kategorie
- **Abstimmen** – Ergebnisse erscheinen direkt als Prozentwerte, danach geht es automatisch zurück zur Startseite
- **Ablaufende Umfragen** – die drei Umfragen, die als nächstes enden, werden hervorgehoben

## Technik

| Bereich       | Verwendet                                     |
| ------------- | --------------------------------------------- |
| Framework     | Angular 22 (Standalone Components, Signals)   |
| Datenbank     | Supabase (`@supabase/supabase-js`)            |
| Rendering     | Angular SSR mit Express                       |
| Styling       | SCSS                                          |
| Tests         | Vitest                                        |

## Einrichten

Node.js und npm werden vorausgesetzt (entwickelt mit npm 11).

```bash
npm install
```

Die Zugangsdaten zu Supabase stehen in `src/environments/environment.ts` (Produktion) und
`src/environments/environment.development.ts` (Entwicklung). Beide brauchen `supabaseUrl`
und `supabaseKey` der eigenen Supabase-Instanz.

## Befehle

```bash
npm start          # Entwicklungsserver auf http://localhost:4200/
npm run build      # Produktions-Build nach dist/
npm run watch      # Build, der bei Änderungen neu läuft
npm test           # Unit-Tests mit Vitest
```

Den fertigen Build mit Server-Side-Rendering starten:

```bash
npm run build
npm run serve:ssr:PollApp
```

## Aufbau

```
src/app/
├── app.ts                  Wurzelkomponente, enthält nur den RouterOutlet
├── app.routes.ts           Die vier Routen der App
├── app.config.ts           Router, Hydration, Scroll-Verhalten
├── layout/
│   ├── home/               Startseite mit Liste, Filter und Kategorie-Menü
│   ├── create-survey/      Formular zum Anlegen einer Umfrage
│   └── survey-view/        Einzelne Umfrage, Abstimmen und Ergebnisse
└── services/
    ├── service.ts          Interfaces für Survey, Question und Vote
    ├── supabase.ts         Verbindung zur Datenbank
    ├── surveys.ts          Umfragen laden und anlegen
    └── votes.ts            Stimmen laden und speichern
```

### Routen

| Pfad          | Komponente     | Zweck                          |
| ------------- | -------------- | ------------------------------ |
| `/home`       | `Home`         | Übersicht aller Umfragen       |
| `/create`     | `CreateSurvey` | Neue Umfrage anlegen           |
| `/survey/:id` | `SurveyView`   | Umfrage ansehen und abstimmen  |

`/` leitet auf `/home` um, unbekannte Pfade ebenfalls. `/home` und `/create` werden beim Build
vorgerendert, `/survey/:id` wird im Browser gerendert, weil die Id erst zur Laufzeit feststeht.

### Zustand

Die Komponenten halten keinen eigenen Datenbestand. `Surveys` und `Votes` sind
`providedIn: 'root'` und legen die geladenen Daten in Signals ab (`surveylist`, `votelist`);
die Komponenten leiten daraus mit `computed()` ab, was das Template anzeigt.

## Datenmodell

Drei Tabellen in Supabase:

**surveys**

| Spalte        | Typ    | Bedeutung                                 |
| ------------- | ------ | ----------------------------------------- |
| `id`          | number | Primärschlüssel                           |
| `title`       | text   | Name der Umfrage                          |
| `description` | text   | Beschreibungstext                         |
| `ends_at`     | text   | Enddatum, `null` wenn ohne Enddatum       |
| `category`    | text   | Kategorie für den Filter                  |

**questions**

| Spalte           | Typ     | Bedeutung                                  |
| ---------------- | ------- | ------------------------------------------ |
| `id`             | number  | Primärschlüssel                            |
| `survey_id`      | number  | Verweis auf `surveys.id`                   |
| `questions_text` | text    | Der Text der Frage                         |
| `allow_multiple` | boolean | Ob mehrere Antworten erlaubt sind          |
| `options`        | array   | Die Antwortmöglichkeiten in ihrer Reihenfolge |

**votes**

| Spalte         | Typ    | Bedeutung                                  |
| -------------- | ------ | ------------------------------------------ |
| `id`           | number | Primärschlüssel                            |
| `question_id`  | number | Verweis auf `questions.id`                 |
| `option_index` | number | Nummer der angekreuzten Antwort, 0 ist A   |
| `created_at`   | text   | Zeitpunkt der Abgabe                       |

Beim Anlegen einer Umfrage wird zuerst die Zeile in `surveys` geschrieben, dann die Fragen mit
der zurückgegebenen `survey_id`. Schlägt der zweite Schritt fehl, wird die Umfrage wieder
gelöscht, damit keine Umfrage ohne Fragen zurückbleibt.

## Konventionen

- Keine Funktion länger als 14 Zeilen
- JSDoc auf Deutsch über jeder Funktion, eine Leerzeile zwischen zwei Funktionen
- Formatierung über Prettier (`.prettierrc`)
