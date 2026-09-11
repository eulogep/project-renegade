# PROJECT RENEGADE Structure

The React layer is only the picture frame. Babylon owns the canvas, camera, scene graph, generated textures and render loop. Gameplay is framework-agnostic TypeScript under `client/src/game/`.

```text
client/src/
  components/
    GameCanvas.tsx       React host, HUD and mode overlays
  game/
    scene.ts             GameWorld, input, level data, combat, camera and lifecycle
  App.tsx                Full-screen route
  index.css              CRT presentation, typography and HUD styling
```

## Runtime ownership

`createGameScene()` owns the Babylon `Engine`, `Scene`, orthographic camera, materials, generated asset texture managers, player state, enemies, projectiles, particles, checkpoint logic, boss encounter and cleanup. It exposes only `GameHandle` methods to React.

The player and enemy simulation are plain records/classes. Babylon meshes and sprites are presentation nodes owned by those gameplay objects. The HUD receives immutable `HudState` snapshots and never mutates gameplay.

## Input contract

Keyboard actions are semantic: A/D or arrow keys move, Space/W/Up jumps, J/K/Z fires, 1/2/Q changes weapon, P pauses, Enter deploys from the title screen. Browser listeners are removed by `dispose()`.
