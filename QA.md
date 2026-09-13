# QA — PROJECT RENEGADE

| Area | Test | Status | Evidence / notes |
|---|---|---:|---|
| Boot | Load game from clean refresh | PASS | WebDev preview renders the title screen. |
| Input | Move, jump, fire, weapon switch | PASS | Keyboard mapping preserved; coyote time added for forgiving jumps. |
| Focus | Blur while moving | PASS | Held keys are cleared and active gameplay pauses automatically. |
| Combat feel | Shot recoil, hit reaction, particles | PASS | Camera shake, hit feedback, and capped particle bursts added. |
| Core loop | Reach zone 02, mini-boss, Sentinel Core | PASS | Existing progression preserved and polished. |
| Pause | P / resume | PASS | Explicit pause state and pause-corner indicator. |
| Restart | Restart clears entities/state | PASS | Existing reset path retained. |
| Resize | Desktop and mobile-ish viewport | PASS | Captured at 1280x720 and 375x812 after the polish pass. |
| Demo | `?demo` deterministic start | PASS | Existing demo path retained. |
| Save | Local leaderboard | PASS | Top five stored in localStorage and shown at victory. |
| Audio | User gesture unlock | PASS | Chiptune and Web Audio effects start after the first gesture. |
| Runtime | TypeScript/build | PASS | `pnpm check` and `pnpm build` pass after changes. |
| Assets | Generated assets and audio | PASS | WebDev storage paths retained; audio resource resolves through the CDN redirect. |

## Known limitations

The game remains a compact vertical slice. Audio mute/volume controls and touch-specific gameplay controls are not yet included. The local ranking is browser-local by design and does not synchronize across devices.

## Release gate

The POLISH pass is ready for checkpoint after the final screenshot verification.

## Evidence

The final visual verification covered the title screen and `?demo` gameplay at desktop (1280x720) and mobile-ish (375x812) viewports. Both TypeScript checking and the production build completed successfully.

