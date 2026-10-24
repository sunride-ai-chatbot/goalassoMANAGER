# Experimental match highlights: stage 1

Both the Pro and beginner local-career live screens offer **תלת־ממד ניסיוני**. It starts disabled for every newly mounted match screen. The existing pitch remains the fallback. This is a presentation of discrete engine events, not a continuous 3D football simulation.

## Authority and data flow

`stepMinute(M)` → immutable event/roster DTO → pure `eventFrame()` → Three.js renderer.

- This integration does not change `07-engine.js`, `08-settle.js` or `22-save.js`. Goals, scores, player statistics, substitutions, finances and persistence remain owned by existing code. No save version or migration is added.
- `Match3D.snapshot()` copies only playing identities, slots, numbers, kit colours, minute and score. The renderer never receives `M`, `G`, live player objects, engine callbacks or storage access.
- `beforeStep()` captures the XI before the minute: a scorer who is injured, dismissed or replaced later in that same minute is still the right actor in that event. Idle rendering and subsequent events use the current XI. Missing players are not replaced with invented actors.
- The event-array index is a per-mounted-match cursor. Every new event is consumed once, including quiet misses. Re-enabling 3D and restoring a saved game start at the current event count; historical events are not replayed automatically. Replays reuse the immutable clip only.
- Engine paths are in attacking coordinates (0–105 by 0–68 metres). The adapter centres these on the pitch and rotates away-team/second-half attacks. Heights, off-ball movement, keeper dives and parries are illustrative; only the engine-recorded 2D path and outcome are authoritative.

| Engine event | Presentation |
| --- | --- |
| `goal`, `pen` with a valid path and shooter | Goal / converted penalty |
| `shot` + `save` | Save by recorded keeper (or active keeper if omitted) |
| `shot` + `off` | Miss |
| `shot` + `post` | Post |
| `own`, `penmiss`, `var`, unsupported or malformed data | Existing commentary only; no invented 3D outcome |

`penmiss` is deliberately excluded: old events do not reliably distinguish a save from a wide penalty. VAR decisions never create a goal presentation on their own. Player bodies are generic original assets, not likenesses.

## Playback and failure handling

While an accepted clip is playing, the existing live timer waits at a presentation-only hold; it never calls an alternative simulation. Match speed still changes the intervals between minutes, while clips remain 5.6 seconds. Scores and event commentary update immediately from `M`, so the authoritative score can appear before the illustrative shot reaches the goal.

Pause and halftime also pause the 3D clip. A final-minute clip drains before normal full-time processing; a completed match is never stepped to minute 91. Skip, camera changes and replay cannot score or settle anything. Switching off, import failure, WebGL context loss, renderer exceptions or an active-playback stall releases the hold and restores the ordinary pitch. The game does not wait for dynamic module loading. Background tabs stop 3D GPU work and live-clock advancement. The beginner screen retains its existing explicit-resume behaviour after backgrounding.

The full page enters fullscreen, keeping management controls and substitution dialogs accessible. Browsers without fullscreen support show a landscape hint. Switching away, ending the match or remounting tears down the animation frame, listeners, resize observer, geometry, materials and textures, then detaches the canvas. Context reclamation is left to the browser: synchronously forcing context loss stalled the software WebGL driver after sustained rendering. The renderer is not persisted.

## Validation

- `npm run build && npm test`: existing regression suites plus `match3d.test.js` and `match3d-live.test.js`.
- Pure checks cover goals, misses, saves, posts, all home/away and half combinations, continuous ball paths, deterministic sampling, event immutability, active XI, malformed events, restoration, cursor deduplication, loading cancellation and fallback. A seeded full match has identical engine and career output with and without adapter sampling.
- Live-loop tests cover halftime pause/resume, presentation holds, final-minute goals, one settlement, Pro summary, no minute 91, and network playback reaching its recorded result without resimulation or settlement.
- `scripts/check-match3d.js` is an optional real-browser check using externally installed Playwright. Serve the built repository over HTTP, then run `CHROMIUM=/path/to/chrome node scripts/check-match3d.js http://127.0.0.1:8765 /tmp/match3d-check`. It exercises 390×844 portrait and 844×390 landscape, real event DTOs, controls, replay, queue order, roster changes, WebGL failure, reopening a saved match and both entry points. Same-tab reload after sustained software WebGL timed out in this environment and remains a manual device gate. It records screenshots and browser diagnostics. It uses disposable test careers, not a user's save.

## Performance and next gates

Mobile starts with pixel ratio capped at 1 and dynamic shadows disabled. Desktop auto quality can drop after two measured windows below 25 FPS. FPS windows count active animation only; idle/paused/background states do not continuously render. Diagnostics include measured FPS, draw calls, triangles and actor count.

Software WebGL measurements are not device benchmarks. **30 FPS on a physical iPhone is unverified.** Keep this mode opt-in until physical Safari testing covers a complete match, thermal behaviour, repeated replay/toggles, portrait/landscape, calls/backgrounding, substitutions, halftime, reload and WebGL recovery. A later stage can expand event coverage and improve motion/contact realism without changing the engine's authority. Network playback keeps the existing display: its recordings do not yet include the authoritative starting XI/slots, so the 3D toggle is disabled for `M.playback`. Network scores, event playback and summary flow are preserved, without resimulation or settlement.

## Observed validation in this session

- After merging the latest multiplayer changes from `e4a0864`, the full 41-suite regression run passed, including multiplayer, save persistence, adapter parity, beginner and Pro live loops. The network playback test verifies the 3D gate, recorded final score and no repeat settlement.
- Browser checks passed opt-in/loading, portrait overflow, landscape layout, a native WebGL loss/recovery before the stress run, goal/pause/replay/skip immutability, ordered saves/misses, active roster size, an actual substitution without rebuilding the view, reopening the same saved match, and Pro fullscreen management controls and teardown. After the multiplayer merge, the final seven-check browser sequence passed with zero JavaScript errors; see `match3d-browser-check.json`.
- Software Chromium reported about 60 FPS at low quality during the sampled clip (roughly 260,000 triangles, 150–175 draw calls, 22 actors). This is a short software-rendered sample, not an iPhone benchmark.
- Earlier attempts to inject native context loss after prolonged rendering and to reload the same tab timed out or stalled in this software WebGL environment. The final smoke run instead tested native loss before sustained animation and reopened the saved match in a fresh context; it passed. The native `WEBGL_lose_context.loseContext()` call itself was observed to block. The production teardown no longer forces this native loss synchronously. Save restoration and Pro final-minute behaviour also pass the code tests. Same-tab stress/reload and physical-device checks remain outstanding.
- Rollout remains opt-in on local careers; the default display and existing saved careers are unchanged. Physical-device validation is still required before making 3D the default.
