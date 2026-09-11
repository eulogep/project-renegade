# Assets

**Art direction:** Original crisp pixel-inspired rendering for a tropical military science-fiction arcade game. Palette: deep indigo, teal cyan, ember orange, acid green and warm cream. Strong silhouettes, readable projectiles, dusk atmosphere, restrained CRT scanlines.

| Asset | Purpose | Source / prompt summary | WebDev path |
|---|---|---|---|
| `project-renegade-reference.png` | Wide visual target and scrolling backdrop | In-game 16:9 island research outpost with operative, drone, sentinel, crates and HUD | `/manus-storage/project-renegade-reference_8c03c85a.png` |
| `project-renegade-operative.png` | Player sprite | Original teal armored operative with orange scarf, side-view, transparent background | `/manus-storage/project-renegade-operative_d6cbac57.png` |
| `project-renegade-drone.png` | Drone enemy sprite | Original dark iron hovering sentinel drone with amber eye, side-view, transparent background | `/manus-storage/project-renegade-drone_9215b050.png` |
| `project-renegade-chiptune.wav` | Chiptune gameplay loop | Original 55-second instrumental loop with square lead, triangle bass, 8-bit drums and mini-boss tension bridge | `/manus-storage/project-renegade-chiptune_e54d9a2b.wav` |

The three images and the music were generated specifically for this project and uploaded through `manus-upload-file --webdev`. Platforms, hazards, crates, bullets, particles, reactor gate, Ember Warden and Sentinel Core are procedural Babylon meshes so the game remains lightweight and deterministic. Short retro sound effects are synthesized with Web Audio after the first user gesture.
