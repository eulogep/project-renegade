# PROJECT RENEGADE — Game Spec

## Player experience

PROJECT RENEGADE is a compact side-view arcade run-and-gun set on the Isle of Kestrel. The player moves through a neon research outpost, survives enemy fire, changes weapons on the fly, defeats the Ember Warden mini-boss, and reaches the Sentinel Core.

## Controls

| Action | Keyboard |
|---|---|
| Move | A/D or arrow keys |
| Jump | Space, W, or Up |
| Fire | J, K, or Z |
| Switch weapon | Q or 1/2 |
| Pause | P |

The first pointer or keyboard gesture unlocks the generated chiptune loop and retro Web Audio effects.

## Core systems

The game includes three weapons, enemy projectiles, destructible crates, hazards, checkpoints, score, lives, pause, restart, game over, victory, a second zone with Stalker enemies, the Ember Warden mini-boss, the Sentinel Core final encounter, and a browser-local top-five leaderboard.

## Polish contract

Movement should feel responsive and forgiving, including a short coyote-time window after leaving the ground. Shots and damage should communicate impact through particles, synthesized effects, and restrained camera shake. Switching tabs while playing must clear held input and pause the simulation. HUD overlays must remain legible at desktop and mobile-ish viewports, with visible focus treatment for interactive buttons.

## Acceptance criteria

1. The title screen loads without runtime errors.
2. A complete run can progress from zone 01 through the Ember Warden to the Sentinel Core.
3. The first user gesture can unlock audio without autoplay errors blocking gameplay.
4. The player can pause, resume, restart, and recover safely after window blur.
5. Victory records the score locally and presents the top five entries.
6. TypeScript and production build pass, and the game remains visually legible at 1280x720 and 375x812.

