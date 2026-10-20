# Asset-Lizenzen – Monster-Duell 3D

Alle 3D-Modelle in `assets/models/` außer `goblin.glb` (siehe unten, Meshy / lionnik2013, ebenfalls CC0) stammen von **Quaternius** (https://quaternius.com)
und wurden über **Poly Pizza** bezogen. Jedes Modell ist dort als
**Public Domain (CC0 1.0)** ausgewiesen: https://creativecommons.org/publicdomain/zero/1.0/

CC0 bedeutet: frei nutzbar, auch kommerziell, Veränderung erlaubt, keine Namensnennung nötig.
Wir nennen die Quelle trotzdem gern.

Für das Spiel wurden die Modelle mit gltf-transform optimiert: dedup, prune, resample,
Texturen auf 256 px, Meshopt-Kompression und Animationen umbenannt (Idle/Attack/Hit/Death).
Im Spiel werden sie zur Laufzeit eingefärbt und mit Extras ergänzt (Flügel, Horn, Panzer, Krone, Aura).

| Datei | Original (Poly Pizza) | Autor | Lizenz | Verwendet für |
|---|---|---|---|---|
| rat.glb | Rat – https://poly.pizza/m/iltq5bVNaV | Quaternius | CC0 1.0 | Rattenschwarm, Pestschwarm (Fusion) |
| bat.glb | Bat (Animated Monster Pack) – https://poly.pizza/m/hNO9XvjlKa | Quaternius | CC0 1.0 | Fledermaus |
| wolf.glb | Wolf (Ultimate Animated Animals) – https://poly.pizza/m/P1gU3Qkr9r | Quaternius | CC0 1.0 | Wolf, Vampirwolf (Fusion) |
| snake.glb | Snake – https://poly.pizza/m/x9x0viZs8V | Quaternius | CC0 1.0 | Schlange, Hydra (Fusion) |
| skeleton.glb | Skeleton – https://poly.pizza/m/yq5ATpujSt | Quaternius | CC0 1.0 | Skelett |
| knight.glb | Skeleton (Krieger) – https://poly.pizza/m/1XZD9GK6Kj | Quaternius | CC0 1.0 | Todesritter (Fusion) |
| frog.glb | Frog (Ultimate Monsters) – https://poly.pizza/m/37wofOCOzG | Quaternius | CC0 1.0 | Kröte |
| dragon.glb | Dragon (Ultimate Monsters) – https://poly.pizza/m/3rUm1cN3yp | Quaternius | CC0 1.0 | Feuerdrache |
| drake.glb | Dragon Evolved (Ultimate Monsters) – https://poly.pizza/m/LlwD0QNUPj | Quaternius | CC0 1.0 | Greif |
| horse.glb | White Horse (Animated Animal Pack) – https://poly.pizza/m/bEdE4rmZy9 | Quaternius | CC0 1.0 | Einhorn, Pegasus (Fusion) |
| giant.glb | Giant – https://poly.pizza/m/BldaiPtyJa | Quaternius | CC0 1.0 | Steingolem, Bergkoloss (Fusion) |
| hywirl.glb | Hywirl (Ultimate Monsters) – https://poly.pizza/m/zjr7CmWGER | Quaternius | CC0 1.0 | Fee |
| goblin.glb | „Goblin“ auf Meshy – https://www.meshy.ai/3d-models/goblin-019d6dd2-556a-79af-83df-8308aba33c57 | lionnik2013 | CC0 1.0 | Goblin, Goblinkönig (Mega) |

`goblin.glb` (Meshy, statisch, ohne Rig: alter Goblin auf Moosfelsen mit Speer) wurde für Handys optimiert:
weld, Vereinfachung von 1,45 Mio. auf ca. 25.000 Dreiecke (meshoptimizer simplifyWithAttributes),
Texturen als WebP (Farbe 1024 px, Normal/Metall-Rauheit 512 px), Meshopt-Kompression – ca. 0,5 MB statt 54 MB.
Im Spiel wird er prozedural animiert (Atmen, Speerstoß, Rückstoß, Hüpfer, Umkippen).
Er ersetzt das frühere goblin.glb, dessen Herkunft/Rechte unklar waren.

Pack-Seiten:
- https://poly.pizza/bundle/Ultimate-Monsters-Bundle-5oyGWAmOB6
- https://poly.pizza/bundle/Ultimate-Animated-Animal-Pack-ILAPXeUYiS
- https://quaternius.com (alle Packs dort als CC0 angegeben)

Bewusst NICHT verwendet, weil sie nur CC-BY lizenziert sind: Witch, Golem und Ogre (joney_lol).

## Code-Bibliotheken (lokal eingebettet, kein CDN)
- three.js r158 inkl. GLTFLoader, SkeletonUtils, BufferGeometryUtils, EffectComposer,
  UnrealBloomPass, OutputPass – MIT-Lizenz, © three.js authors – https://github.com/mrdoob/three.js
- meshoptimizer MeshoptDecoder – MIT-Lizenz, © Arseny Kapoulkine – https://github.com/zeux/meshoptimizer
