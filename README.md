# JETLEV-FLYER — Water Rush

Mobile-Arcade-Spiel mit Pixelgrafik, Jetlev-Flyer-Branding und Web-Audio-Soundeffekten. HTML5 Canvas und Vanilla JavaScript, ohne Build-Schritt.

## Start

`index.html` im Browser öffnen oder `python3 -m http.server 8080` starten und `http://localhost:8080` aufrufen.

## Spielen

- PLAY / REPLAY startet einen Run.
- Touch, Maus, Leertaste oder Pfeil hoch halten: steigen. Loslassen: sinken.
- P / Escape oder Pause-Button: pausieren / fortsetzen.
- Noten-Button: Ton an / aus. Audio beginnt nach einer Benutzerinteraktion.
- Zehn Münzen aktivieren sechs Sekunden doppelten Münzwert (goldenes ×2). Magnetismus ist ausschließlich dem separaten Magnet-Power-up zugeordnet.
- Power-ups rotieren: Wasserschild (9 s / ein Treffer), Magnet (8 s / größere Reichweite), FLOW-Pickup (6 s, bis 9 s verlängerbar).
- Zentrale Effektkarten zeigen Restzeit und Ablauf. Jeder Effekt hat eigene Start-/Endklänge, Charakteranimationen und dezente Vibrationsmuster, sofern der Browser Vibration unterstützt. Reduzierte Bewegung deaktiviert Vibration.
- Vollständige Münzreihen geben +5. Etwa alle 240 m folgt nach dem Passieren aktiver Gefahren ein sechssekündiger Gold Run mit mehr Münzreihen.
- Raketen zeigen vor dem Eintritt ins Spielfeld eine Warnung und fliegen mit festgelegter Höhe nach links.
- Kontinuierliche Fluggeschwindigkeit, schnelle Umkehr und weiche Grenzzonen; Schubsound und Wasserstrahlen folgen einer geglätteten Eingabe.
- Der Tod zeigt einen kurzen Impact und eine 1,1-sekündige Pixel-Wasserexplosion mit synthetischem Bass-/Rausch-Sound.
- Knappe Ausweichmanöver geben zwei Bonusmünzen. Der Distanzrekord wird lokal gespeichert.

## Inselpass und Garage

Die Türkislagune, der Palmenhafen und die Vulkanbucht besitzen jeweils drei kumulative Missionen. Jeder beendete Run zählt für die gewählte Insel; drei abgeschlossene Missionen öffnen die nächste. Freigeschaltete Inseln bleiben frei wählbar. Der Hafen hat mehr maritime Kameradrohnen, die Vulkanbucht frühere und häufigere Renn-Wasserflugzeuge. Flugphysik, Kollisionsgrenzen und die Prüfung erreichbarer Münzreihen bleiben identisch.

Beim Run-Ende wandern die gesammelten Münzen einmalig in die Garage. Vier Looks verändern Anzugdetails und Wasserlicht; das originale rot-schwarze Jetlev-Gerät mit Versorgungsschlauch und separatem Motorboot bleibt erkennbar. Die Vorschau nutzt denselben Pilotenrenderer wie das Spiel. Käufe und Auswahl werden lokal gespeichert. Es gibt keine Echtgeldkäufe, täglichen Pflichten oder käuflichen Physikvorteile.

`progression.js` verwaltet Missionen, Besitz und Münzbank, `career.js` die Menüs und `theme.js` die drei Inselwelten. Fortschritt ist lokal auf diesen Browser beschränkt; Löschen der Websitedaten entfernt ihn. `tests/progression.test.cjs` prüft Freischaltungen, Abrechnung, Käufe und beschädigte Speicherdaten. Der Browsertest prüft Kauf, Ausrüstung, Inselwahl, Neuladen und Offline-Spiel.

## Faire Münzformationen

`level.js` teilt sich Flugphysik und Hindernisgrößen mit dem Spiel. Der Generator sucht für jede vollständige Formation einen konkreten Flugweg aus Halten-/Loslassen-Eingaben in 150-ms-Abschnitten. Die Simulation läuft wie das Spiel mit 120 Physikschritten pro Sekunde und berücksichtigt die steigende Geschwindigkeit. Alle Münzen müssen entlang desselben kollisionsfreien Wegs eingesammelt werden können; bestehende vorausliegende Münzen werden einbezogen.

Die Prüfung reserviert den gesamten vertikalen Drohnenbereich und berücksichtigt das höhere Raketentempo. Neue Hindernisse dürfen weder Münzen noch den reservierten Flugweg blockieren. Auch der Magnet verschiebt Münzen nur in freie Bereiche. Bei erfolgloser Suche wird der Spawn verschoben. Die begrenzte Suche kann mögliche Wege verwerfen; sie veröffentlicht keine ungeprüfte Formation. Die Erreichbarkeit bezieht sich auf den Spielerzustand zum Generierungszeitpunkt und setzt passende Steuerung voraus.

Logikprüfungen: `node tests/flight.test.cjs`, `node tests/level.test.cjs` und `node tests/game.test.cjs`. Die Generatorprüfung spielt die gefundenen Eingabefolgen nach und prüft alle Münzen, Drohnen, Raketen und eine unpassierbare Wand.

## Referenzen

- Geräteform und aufrechte Flughaltung: https://de.wikipedia.org/wiki/Jetlev-Flyer
- Rückenplatte, seitliche Düsen und Steuerhebel: https://jetlev-flyer.com/gallery/
- Original-Logo: https://jetlev-flyer.com/wp-content/uploads/logo_2371x293.jpg

Das Original-Logo liegt unverändert in `assets/jetlev-flyer-logo.jpg`. Spielgrafiken werden im Canvas gezeichnet. Die Schriftarten liegen lokal als WOFF2 vor; der Production-Build benötigt keine externen Requests.

## Mobile / Hochformat

Die Oberfläche nutzt die sichtbare Browserhöhe und berücksichtigt Notch und Home-Indikator. Mehrfinger-Touch und abgebrochene Gesten werden getrennt verwaltet. Bildschirmdrehung pausiert den Run und erhält relative Hindernis-/Münzabstände. Beim App-Wechsel pausiert das Spiel und der Audiokontext wird angehalten; WEITER setzt ihn nach einer Benutzerinteraktion fort.

Mobile Browserprüfung: Server starten, danach `python3 tests/mobile.py` mit installiertem Playwright/Chromium. Getestete emulierte Hochformate: 320×480, 360×640, 390×844, 430×932 und 768×1024; zusätzlich Drehung und Rückkehr ins Hochformat. Die Prüfung kontrolliert sichtbare Buttons, Touch-Ereignisse, Menüs und JavaScript-Fehler. Sie ersetzt keinen Test auf echter iPhone-/Android-Hardware, insbesondere nicht von Safari-Audio und Systemgesten.

## Production-Build und GitHub Pages

Voraussetzung: Node.js 24 (siehe `.nvmrc`).

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

`npm run dev` startet die ungebündelten Quellen. `npm run preview` liefert ausschließlich `dist/` unter `http://127.0.0.1:4173/jetlev-flyer/` aus. Für den Offline-Test immer den Production-Build verwenden.

Der esbuild-Build bündelt und minimiert JavaScript/CSS, versieht die Dateinamen mit Inhalts-Hashes und bindet lokale WOFF2-Schriften ein. Die Offline-Dateiliste und Service-Worker-Version werden aus den Build-Inhalten erzeugt. Gleiche Quellen und Lockdatei erzeugen den gleichen Build. Limits: maximal 35 KB gzip für JavaScript und 1,5 MB für die komplette Offline-App. Der Build veröffentlicht keine Tests, Quellkarten oder Entwicklungsdateien.

`.github/workflows/pages.yml` prüft Pull Requests und `main`: `npm ci`, Spiellogik, Production-Build, Chromium-PWA-/Offline-/Hochformat-Tests. Nur ein erfolgreicher Build auf `main` wird über GitHub Pages veröffentlicht. Das Deployment benötigt keine persönlichen Tokens: GitHub stellt die kurzlebigen Berechtigungen bereit. Bei Fehlern bleiben Test-Traces sieben Tage verfügbar. Dependabot erstellt wöchentlich Vorschläge für Dependency- und Action-Updates.

In GitHub unter **Settings → Pages → Source: GitHub Actions** aktivieren. Nach `git push` auf `main` läuft die Pipeline automatisch. Ein Rollback erfolgt durch `git revert <commit>` und erneuten Push; dadurch werden dieselben Tests auch vor dem Rollback durchlaufen.

### Installation und Offline-Updates

Android: im Browser die Installation anbieten lassen bzw. „App installieren“. iPhone: Safari → Teilen → Zum Home-Bildschirm. Einmal online vollständig öffnen, danach kann das Spiel offline gestartet werden. Jeder neue Aufruf prüft vor dem Spielstart auf Updates ohne HTTP-Cache für den Worker. Ein vollständig geladenes Update wird sofort aktiviert; bei abweichender Dokumentversion wird die passende Startseite automatisch geladen. Navigation lädt bevorzugt online. Bei Offlinebetrieb oder fehlgeschlagenem Update bleibt die gespeicherte Version spielbar; ohne erreichbaren Server ist der neueste Stand nicht garantierbar. Laufende Runs werden nicht automatisch neu geladen. Persönliche Rekorde im Local Storage werden beim Cache-Update nicht gelöscht.

Das Manifest und sämtliche URLs unterstützen den Repository-Unterpfad `/jetlev-flyer/`. Die PWA ist für Hochformat und Standalone-Anzeige konfiguriert. Schriftlizenzen liegen unter `assets/fonts/*-OFL.txt`.
