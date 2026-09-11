# Game Plan: PROJECT RENEGADE

## Risk Tasks

### 1. Side-view camera and sprite presentation
- **Why isolated:** The game combines an orthographic Babylon camera, a long scrolling world, generated transparent sprites and a DOM HUD that must remain legible over the playfield.
- **Approach:** Use a fixed 32 x 18 orthographic framing, follow the player on the x axis with clamped interpolation, keep gameplay objects in plain TypeScript and render sprites through Babylon SpriteManager.
- **Verify:** Player sprite remains visible while moving, camera follows smoothly without exposing the world boundary, generated operative and drone assets render with clean silhouettes, and HUD stays aligned at desktop and narrow widths.

### 2. Combat state handoff
- **Why isolated:** Input, cooldowns, weapon switching, projectile motion, enemy AI and boss transitions can fail when combined in one frame loop.
- **Approach:** Centralize semantic keyboard state, keep projectile records data-oriented, separate enemy update from hit resolution, and make title/playing/paused/gameover/victory explicit modes.
- **Verify:** A/D movement, jump, hold-to-fire, weapon switching, damage invulnerability and pause all work without stuck keys; enemy death increases score; the boss activates only at the citadel and victory occurs when its health reaches zero.

## Main Build

- **Assets needed:** Original 16:9 island/research-outpost visual reference used as a Babylon backdrop; original transparent operative sprite; original transparent sentinel drone sprite; all uploaded to WebDev storage. Remaining platforms, crates, hazards, projectiles and boss are procedural meshes with a consistent palette.
- **Audio and progression additions:** A generated 55-second chiptune loop starts after the first pointer or keyboard gesture, procedural square-wave effects reinforce shots, jumps, impacts, pickups and boss warnings, and a second citadel zone adds purple stalker enemies plus the Ember Warden mini-boss before the Sentinel Core.
- **Verify:**
  - Movement direction matches player input and jump has a readable arc.
  - Projectiles travel left-to-right, enemy bolts damage the player, and weapon changes affect fire cadence/spread.
  - Enemies, destructible crates, hazards, checkpoint, scrolling camera and final Sentinel Core encounter are all reachable in one run.
  - HUD shows vitals, score, loadout, lives, objective and contextual boss health.
  - Victory persists the run in `localStorage` and displays the top five local scores.
  - Title screen, fast restart, pause, game over and victory all have working controls.
  - No visual glitches, clipping, missing generated textures or browser console errors.
  - `?demo` starts automatically for deterministic screenshot verification.
  - Responsive canvas and HUD remain readable at 1280x720 and 375x812.
