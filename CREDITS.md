# Credits – Pflanzen-Duell

## Arena
- **Echoarena** (`assets/models/arena.glb`): eigenes Modell (Echoarena-Prototyp) des Entwicklers.
  Für das Web mit gltf-transform/meshoptimizer komprimiert (ca. 75 KB statt 275 KB). Im Spiel eingefärbt und beleuchtet; die zwei Kerne sind die Spielerbasen.

## Pflanzen-Modelle (Meshy, alle CC0 1.0)
Alle Modelle wurden einzeln geprüft (keine Gesichter, keine Tiere oder Menschen), für Handys verkleinert
(6.000–10.000 Dreiecke, Texturen als WebP mit 512 px) und mit Meshopt komprimiert.

| Datei | Meshy-Modell | Autor/in | Quelle | Im Spiel |
|---|---|---|---|---|
| sunflower.glb | Sunflower | keowston84 | https://www.meshy.ai/posts/019d7391-a2b5-7a30-955c-678e117c8585 | Sonnenblume, Wirbelblüte |
| mushroom.glb | Mushroom | ddverster | https://www.meshy.ai/posts/01981d8f-745f-7444-ad5b-ed5d23f092da | Pilz, Pilzkeim |
| thornvine.glb | Game ready low poly thorn vine | the4gatten.og | https://www.meshy.ai/posts/0199bfd5-fb8c-78f6-941c-ba5cbf4fd285 | Dornenranke |
| aloe.glb | Close up flowering (Venusfliegenfalle-Prompt, zeigt eine blühende Sukkulente) | design | https://www.meshy.ai/posts/019650e6-a960-784c-89f1-99e57026ae0b | Aloe |
| cactus.glb | Cactus | gvisco | https://www.meshy.ai/posts/0196f4cd-6104-7c8c-a734-fdd097567bc9 | Kaktus |
| lavender.glb | Lavender | celinanord402 | https://www.meshy.ai/posts/019e3c7d-ee55-7245-926c-87f6cf65f0b9 | Lavendel |
| lotus.glb | lotus | kirinkarwai | https://www.meshy.ai/posts/019bca46-670b-7619-a4d4-2eb4e06b8a83 | Seerose, Lichtlotus |
| oak.glb | Low Poly oak Tree | lukaspezzei | https://www.meshy.ai/posts/019aa75e-4067-7971-b726-eb2afb6a0b21 | Eichenwächter |
| crystalflower.glb | An elaborate crystal flower | aliki | https://www.meshy.ai/posts/0198c369-bdea-7384-bc04-b983ce4e4838 | Feuerlilie |
| pumpkin.glb | pumpkin | TooPH | https://www.meshy.ai/posts/0196c0d2-ef87-7572-9a59-5caf0a437171 | Platzkürbis |
| rose.glb | Pink Rose | audrey.dumoulin1802 | https://www.meshy.ai/posts/019dcaa3-3439-741a-9a3b-9a39c9ab555f | Dornenrose |
| pine.glb | pine tree | ali.leylekoglu | https://www.meshy.ai/posts/019b4d48-092f-71aa-afe7-ec5e917f62a8 | Mammutbaum |
| bamboo.glb | Bamboo tree | canetoad43 | https://www.meshy.ai/posts/019889a5-a0f7-7b40-8caf-61999c9c6ad8 | Bambushain |

CC0 verlangt keine Namensnennung – wir nennen die Urheber trotzdem gern.

## Eigene prozedurale Pflanzen (im Code erzeugt)
Löwenzahn, Pusteblume, Ahornsamen, Fliegenfalle, Seerosen-Teich, Blütenkranz der Kreuzungen sowie alle Partikel (Pollen, Blütenblätter, Blätter, Sporen).

## Code-Bibliotheken (in index.html eingebettet)
- **three.js** r158 (inkl. GLTFLoader, BufferGeometryUtils, EffectComposer, UnrealBloomPass, OutputPass) – MIT-Lizenz, © 2010-2023 three.js authors – https://github.com/mrdoob/three.js
- **meshoptimizer** MeshoptDecoder – MIT-Lizenz, © Arseny Kapoulkine – https://github.com/zeux/meshoptimizer

Die vollständigen Lizenztexte stehen in `THIRD_PARTY_LICENSES.txt`.
