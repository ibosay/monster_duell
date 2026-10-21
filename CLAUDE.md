# CLAUDE.md – Pflanzen-Duell

Das „Drehbuch“ dieses Spiels. Jede Claude-Sitzung liest diese Datei zuerst und hält sich daran.
Besitzer: Ibosay (Ibragim). Er ist kein Programmierer: Antworten auf Deutsch, Schritt für Schritt,
ehrlich (auch wenn etwas nicht klappt), Zahlen nur nach Prüfung.

## 1. Was das Spiel ist

- Deutsches 3D-Kartenspiel im Browser (Three.js r158), live auf https://ibosay.github.io/monster_duell/
- Zwei Gärtner pflanzen Pflanzen in die schwebende **Echoarena**, greifen an, **kreuzen** Pflanzen
  zu stärkeren Sorten und löschen den Kern (Resonanzring) des Gegners aus. 30 Leben pro Seite.
- Modi: **Gartenreise** (Kampagne, 3 Kapitel × 4 Stufen), Gegen Computer, Spieler gegen Spieler (ein Gerät).
- Ziel: **Steam (PC) + Handy im Browser**. Stil: Pastell Aqua/Lavendel, weich, edel.

## 2. Feste Regeln (nicht ohne Ibosay ändern)

1. **Keine Gesichter, keine Menschen, keine Tiere** in Modellen und Grafiken. Gärtner sind Totems/Schreine.
   Grundregel: Alles, was verboten oder nicht erlaubt ist, wird nicht benutzt und nicht eingebaut.
2. **Nur Claude ändert dieses Repo.** (Früher hat parallel ein Cursor-Agent gearbeitet → zwei verschiedene v14.)
   Trotzdem vor JEDER Arbeit: `git fetch origin main` und prüfen, ob main neuer ist als der eigene Stand.
   Fremde Änderungen werden zusammengeführt, nie überschrieben.
3. Die **Echoarena-Geometrie bleibt unverändert** (Modell `quellcode/assets/echoarena.glb`).
   Licht, Material und Effekte dürfen sich ändern.
4. **Balance nur mit Zahlen**: nach jeder Änderung an Karten/Werten `node werkzeuge/sim.js 8000`.
   Keine Karte soll über ~70 % Siegquote liegen, erster/zweiter Spieler ~50/50.
5. **Live-Stellen nur nach Test** (Ablauf unten). Bei Bugfixes für das Live-Spiel darf direkt live gegangen
   werden, wenn die Tests grün sind; neue Features vorher als Testseite zeigen, wenn Ibosay nichts anderes sagt.
6. Fremde Grafiken nur mit **CC0**-Lizenz oder eigener Erzeugung (Meshy). Urheber in `CREDITS.md` eintragen.

## 3. Aufbau

```
/ (Repo-Wurzel = Live-Seite über GitHub Pages)
├── index.html            fertiges Spiel (wird gebaut, NICHT von Hand bearbeiten)
├── assets/models/*.glb   Pflanzenmodelle (Meshy CC0, meshopt-komprimiert)
├── README.md, CREDITS.md, THIRD_PARTY_LICENSES.txt
└── quellcode/            hier wird gearbeitet
    ├── build.py          baut ../index.html  (Aufruf: cd quellcode && python3 build.py)
    ├── shell.html        Seitengerüst, CSS, Menüs/Overlays
    ├── logic.js          Regeln, Karten, Kampf, KI, Balance-Werte
    ├── campaign.js       Kampagne „Gartenreise“ (Stufen, Sterne, Gold)
    ├── meta.js           Speicherstand, Erfolge, Tagesaufgaben, Steam-Brücke
    ├── engine.js         3D-Szene, Kamera, Layout, Qualitätsstufen, Absturz-Schutz
    ├── fx2.js            Zauber-/Fallen-Effekte
    ├── plants.js         Pflanzenmodelle, Biege-Shader, seltene Pflanzen (prozedural)
    ├── arena.js          Echoarena laden (GLB eingebettet), Kerne
    ├── gfx.js            Grafik: IBL, Bloom, Schutzfilter, Farbkorrektur, Kern-Effekte
    ├── menu3d.js         Startmenü: lebendige 3D-Arena hinter den Menüs (Kamerafahrt, Schau-Pflanzen)
    ├── ui.js             Bedienung, Hand, Knöpfe, Menüs
    ├── vendor/           three.min.js r158 (MIT)
    ├── pp.js / gl.js     Nachbearbeitung + GLTF-Lader (aus three r158 erzeugt)
    ├── assets/echoarena.glb
    ├── assets/logo.webp  Spiel-Logo (wird in index.html eingebettet; fehlt es, zeigt das Menü 🌱 + Text)
    └── werkzeuge/        sim.js (Balance), simcamp.js (Kampagne)
```

## 4. Arbeitsablauf (wie im Video: kleine Schritte, nach jedem Schritt testen)

1. `git fetch origin main` → Stand prüfen (Regel 2).
2. Änderung in `quellcode/` machen. Eine Sache pro Schritt.
3. `cd quellcode && python3 build.py` → baut `../index.html`.
4. Testen:
   - Syntax: alle JS-Dateien zusammen mit `node --check` prüfen.
   - Balance (wenn Werte geändert): `node werkzeuge/sim.js 8000`, Kampagne: `node werkzeuge/simcamp.js 500`.
   - Browser (Playwright, Chromium liegt bereit): Menü → Partie → mehrere Züge, Kampagne Stufe 1,
     Hoch- und Querformat, PC 1920×1080. Keine Fehler in der Konsole.
   - Achtung: Die Testumgebung hat keine Grafikkarte (SwiftShader). Fehler, die nur auf echten
     Grafikkarten auftreten, dort gezielt nachstellen (siehe Fallen unten).
5. Version hochzählen (`GAME_VERSION` in plants.js + meta-Tag in shell.html), Commit, push.
6. Ibosay kurz und ehrlich berichten: was geändert, was getestet, was nicht getestet werden konnte.

Ibosay gibt Feedback in Alltagssprache („Monster zu stark“, „ruckelt“). Das in Zahlen/Code übersetzen,
nicht zurückfragen, was er technisch meint – außer es ist wirklich mehrdeutig.

## 5. Bekannte Fallen (schon einmal passiert)

- **Schwarzer Block auf PCs (v20 behoben):** `pow(x, …)` mit x < 0 oder `smoothstep(a,b,…)` mit a > b
  erzeugt auf echten GPUs NaN; der Bloom verschmiert NaN zu riesigen schwarzen Flächen. In Shadern immer
  `clamp`/`max` vor `pow`. Der Schutzfilter (`SANE_SHADER` in gfx.js) muss vor dem Bloom bleiben.
- **iPhone schwarzer Bildschirm / Pflanzen weg (v16/v17):** Grafikspeicher. Handy-Stufe „mobile“
  (kein Bloom-Puffer, Pixelrate ≤ 1,5, keine Punktlichter). Bei Kontextverlust baut `rebuildRenderer()`
  eine neue Zeichenfläche und erzeugt alle Pflanzen neu.
- **Koordinaten Echoarena:** Modell Z-oben, +Y = Gegner. Spiel: Y-oben, −Z = Gegner. Maßstab 0,84.
  Kerne bei z = ±5,21 (HEROZ), Pflanzenreihen bei z = ±2,06 (ROWZ).
- **Vertexfarben im GLB sind sRGB** → beim Laden in linear umrechnen (eaSrgbLin).
- Claude-Testseite (Artifact) nimmt keine .glb-Dateien → Modelle werden dort base64 eingebettet.
- **Startmenü (v21):** `menu3d.js` schaltet sich über einen MutationObserver auf den Menü-Overlays ein
  (`ovMenu`, `ovCamp`, `ovHero`, `ovErfolge`) und nur, wenn kein Duell läuft. Schau-Pflanzen haben uid ≥ 800000
  und werden beim Spielstart entfernt. `layout()` gibt im Menü an `menuLayout()` ab (Arena neben/über dem Fenster).
  Neues Overlay, hinter dem die Arena laufen soll → in `MENU_OVERLAYS` eintragen.

## 6. Grafikstufen

`E.tier`: `high` (PC: IBL, MSAA + Bloom, Schatten 2048, Punktlichter) · `mobile` (Handy) · `low`.
Automatik nach Gerät; Menü-Knopf „⚙️ Grafik“ speichert die Wahl (`localStorage pd_quality`).
URL-Schalter: `?q=high|low|auto`.

## 7. Balance-Stand (v20)

- Mega-Kreuzung ×1,5 (Ureiche 5/10, Sonnenlilie 10/10 ohne Extra-Eigenschaft), Feuerlilie 7/7.
- Seltenheit: gewöhnlich 3, selten 2, episch 1, legendär 1 Kopie im Deck.
- Simulation 8000 Partien: keine Karte über 70 %, erster/zweiter Spieler 50/50.
- Kampagne (Spieler-KI): Kapitel 1 ~95/92/88 %, Bosse 58 / 50 / 36 %.

## 8. Nächste Schritte (Stand 22.10.2026)

1. **Meshy-Modelle** (Ibosay erzeugt, Claude optimiert + baut ein): 12 Pflanzen, 6 Kreuzungen,
   5 Gärtner-Totems, Deko, 2 Arena-Rahmen. Prompts im Claude-Dokument „Pflanzen-Duell – Meshy-Prompts für Steam“.
   Optimierung: Handy ~8.000 Dreiecke / 512er-Texturen, PC ~25.000 / 1024er, meshopt.
2. **Ton**: Musik + Effekte (Pflanzen, Angriff, Treffer, Kreuzen, Sieg).
3. ~~Startmenü mit Logo und animiertem Hintergrund~~ → **erledigt in v21**, als echte 3D-Szene statt Video
   (scharf in jeder Auflösung, kein Download). Offen: Logo in voller Auflösung (aktuell 963×420 aus der Vorschau)
   und Lizenz klären (siehe CREDITS.md: ElevenLabs nur mit bezahltem Abo kommerziell nutzbar).
4. **Steam-Version**: Electron-Hülle, Vollbild, Maus/Tastatur, Einstellungen, Steamworks (Erfolge sind in
   meta.js schon vorbereitet: `window.MonsterDuellSteam`).

## 9. Versionen

v13 Garten-Arena (Cursor) · v14 Echoarena + Balance · v15 Grafik-Upgrade · v16 Handy-Modus ·
v17 Absturz-Neuaufbau · v18 Kampagne · v19 Zusammenführung mit Cursor-v14 (seltene Pflanzen, Seltenheit) ·
v20 PC-Fix (NaN-Schutzfilter), Grafik-Schalter, größere PC-Oberfläche · Quellcode ab jetzt im Repo ·
v21 Startmenü mit Logo + lebendiger 3D-Arena im Hintergrund.
