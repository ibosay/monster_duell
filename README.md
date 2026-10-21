# Pflanzen-Duell

Pflanzen-Duell ist ein deutsches Kartenspiel im Browser: Du pflanzt deinen Garten in die schwebende Garten-Arena, kreuzt Pflanzen zu stärkeren Sorten und bringst den Kristall deines Gegners zum Erlöschen. Du kannst gegen den Computer spielen oder zu zweit am selben Gerät.

Das Spiel (`index.html`) ist eine einzelne HTML-Datei mit eingebettetem Three.js; die 3D-Modelle liegen in `assets/models/`.

- **Garten-Arena:** nach dem eigenen Konzeptbild des Entwicklers, komplett im Code aus einfachen Low-Poly-Formen gebaut (Steinplatten, Mauern, Säulen mit Kristallen, Banner, Bäume, Blumen, Teiche, Felsinsel). Keine zusätzlichen Modelldateien.
- **Pflanzen:** CC0-Modelle von Meshy (Autorinnen und Autoren in `CREDITS.md`) sowie eigene prozedurale Pflanzen (Löwenzahn, Pusteblume, Ahornsamen, Fliegenfalle). Alle Pflanzen bewegen sich über einen eigenen Wind- und Biege-Shader.
- **Code-Bibliotheken:** Three.js und meshoptimizer (MIT), siehe `THIRD_PARTY_LICENSES.txt`.

**Spielen:** [https://ibosay.github.io/monster_duell/](https://ibosay.github.io/monster_duell/)

Am besten auf dem iPhone in Safari öffnen.
