# Pflanzen-Duell

Pflanzen-Duell ist ein deutsches Kartenspiel im Browser: Du pflanzt deinen Garten in die schwebende Echoarena, kreuzt Pflanzen zu stärkeren Sorten und bringst den Kristall deines Gegners zum Erlöschen. Du kannst gegen den Computer spielen oder zu zweit am selben Gerät.

Das Spiel (`index.html`) ist eine einzelne HTML-Datei mit eingebettetem Three.js; die 3D-Modelle liegen in `assets/models/`.

- **Echoarena:** eigenes 3D-Modell (Echoarena_Prototyp.glb, geschichtete Schalenform, Keramikfelder, Resonanzringe, Klanglamellen in Aqua und Lavendel). Unverändert übernommen und direkt in `index.html` eingebettet. Die beiden Resonanzringe sind die Kerne der Spieler.
- **Pflanzen:** CC0-Modelle von Meshy (Autorinnen und Autoren in `CREDITS.md`) sowie eigene prozedurale Pflanzen (Löwenzahn, Pusteblume, Ahornsamen, Fliegenfalle). Alle Pflanzen bewegen sich über einen eigenen Wind- und Biege-Shader.
- **Code-Bibliotheken:** Three.js und meshoptimizer (MIT), siehe `THIRD_PARTY_LICENSES.txt`.

**Spielen:** [https://ibosay.github.io/monster_duell/](https://ibosay.github.io/monster_duell/)

Am besten auf dem iPhone in Safari öffnen.
