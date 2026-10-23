# GOALASSO 3D Lab

Open `assets/demo3d/index.html` over HTTP. This is a separate rendering prototype; it does not read/write career saves, import the match engine, or provide multiplayer.

## Included

- A fully modelled pitch, terraced stadium, crowd, goals and deforming net.
- 22 original low-poly skinned player models with procedural joint animation, kit colours, numbers, ball shadows and sunlight shadows.
- Deterministic 19-second pass–carry–pass–shot presentation fixtures: goal and keeper parry. These are choreographed, not AI matches. Characters are generic, not likenesses of actual players.
- Three cameras, touch drag/pinch, pause, replay, seeking, quarter/half speed, fullscreen where supported, and a landscape phone layout.
- Automatic reduced rendering quality if measured FPS remains below 25; manual high/low options. Opening the information dialog displays measured browser FPS. Backgrounding pauses playback; loss of the WebGL context offers a reload.

## Files

`match.js` is renderer-independent, pure sampling in world metres. `actors.js` builds and poses the skinned models. `world.js` creates the environment. `app.js` drives the UI/render loop. Nothing moves while paused, and the render loop skips GPU work when paused or backgrounded.

All scene geometry, procedural textures, UI and animation in this demo were authored for this project. No external player models, commercial game assets or generated photographic player faces were used. The Heebo web font is optional; the interface falls back to Arial.

`vendor/three.js` is a locally bundled, pinned Three.js 0.180.0 (MIT); license alongside. Rebuild with an isolated tool install, without changing the game's npm dependencies:

```sh
npm install --prefix /tmp/goalasso-3d-tools three@0.180.0 esbuild
/tmp/goalasso-3d-tools/node_modules/.bin/esbuild /tmp/goalasso-3d-tools/node_modules/three/build/three.module.js --bundle --minify --format=esm --outfile=assets/demo3d/vendor/three.js
```

## Validation and limits

`node tests/demo3d.test.js` checks all 22 actor positions, finite coordinates, ball continuity, seek determinism, goal and save outcomes. Browser testing additionally covers WebGL initialization, play/pause/replay, seek, cameras, quality, and 390px portrait / 844px landscape layouts.

Headless Chromium here uses software rendering; its FPS does **not** establish performance on a physical iPhone. Verify that separately before claiming the 30 FPS device target is met. This prototype does not yet include motion-capture animations, collision/contact IK, football AI, sound, real player likenesses or the career integration. The timeline/renderer boundary is intended to support a future event adapter, not to replace the authoritative football simulation.

GitHub Pages already copies the `assets` directory, so the isolated demo is deployed at `/goalassoMANAGER/assets/demo3d/index.html` without changing the career entry points.
