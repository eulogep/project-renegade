# Memory

- The source brief asks for a full original 2D run-and-gun vertical slice under the internal codename PROJECT RENEGADE.
- The session game-dev pipeline is Babylon.js hosted in a WebDev React static project; Phaser was not introduced so the project follows the active skill contract.
- Art assets are original AI-generated images, not ripped or adapted from commercial games. They are stored outside the project and referenced through WebDev storage paths.
- Browser audio was intentionally omitted because a passive preview cannot autoplay sound safely; the gameplay slice focuses on responsive controls, combat feedback, score and state flow.
- Audio is now user-gesture gated: the first pointer or keyboard gesture creates a Web Audio context, starts the generated chiptune loop, and enables short procedural retro SFX.
- Zone 02 begins after the first checkpoint with stalker enemies, a purple Ember Warden mini-boss, a new checkpoint, then the final Sentinel Core.
- Victory and game-over runs are recorded in `localStorage` under `project-renegade-leaderboard`; the top five entries are rendered in the victory overlay.
- `?demo` starts the run automatically. The game can also be started with the title button or Enter.
- Next verification pass: type-check, restart dev server, capture default and demo screenshots, inspect logs, then save the only first-delivery checkpoint.
