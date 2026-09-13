import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Sprite } from "@babylonjs/core/Sprites/sprite";
import { SpriteManager } from "@babylonjs/core/Sprites/spriteManager";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";

export type GameMode = "title" | "playing" | "paused" | "gameover" | "victory";
export type WeaponName = "AR-7" | "VOLT SPREAD" | "ARC LANCE";
export type LeaderboardEntry = { score: number; zone: string };
export interface HudState {
  score: number;
  lives: number;
  health: number;
  weapon: WeaponName;
  checkpoint: number;
  bossHealth: number | null;
  bossName: string | null;
  objective: string;
  mode: GameMode;
  audioReady: boolean;
  leaderboard: LeaderboardEntry[];
}
export interface GameHandle {
  start(): void;
  togglePause(): void;
  restart(): void;
  resize(): void;
  dispose(): void;
}

type EnemyKind = "drone" | "trooper" | "turret" | "stalker";
type Bullet = { mesh: Mesh; x: number; y: number; vx: number; vy: number; damage: number; enemy: boolean; life: number };
type Particle = { mesh: Mesh; life: number; max: number; vx: number; vy: number };

const BG_URL = "/manus-storage/project-renegade-reference_8c03c85a.png";
const OPERATIVE_URL = "/manus-storage/project-renegade-operative_d6cbac57.png";
const DRONE_URL = "/manus-storage/project-renegade-drone_9215b050.png";
const WORLD_W = 154;
const GROUND_Y = -5.25;
const VIEW_H = 18;
const VIEW_W = 32;

function mat(scene: Scene, name: string, hex: string, emissive = false) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(hex);
  material.specularColor = Color3.Black();
  if (emissive) material.emissiveColor = Color3.FromHexString(hex);
  return material;
}

class Enemy {
  public node: Mesh;
  public sprite?: Sprite;
  public health: number;
  public maxHealth: number;
  public x: number;
  public y: number;
  public readonly kind: EnemyKind;
  private t = 0;
  private shootTimer = 0.6;
  private readonly ground: number;
  constructor(kind: EnemyKind, x: number, y: number, scene: Scene, droneManager: SpriteManager, materials: Record<string, StandardMaterial>) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.ground = y;
    this.maxHealth = kind === "turret" ? 5 : kind === "trooper" ? 3 : kind === "stalker" ? 4 : 2;
    this.health = this.maxHealth;
    this.node = MeshBuilder.CreateBox(`${kind}-${x}`, { width: kind === "turret" ? 1.3 : 1.1, height: kind === "trooper" ? 2.1 : 1.1, depth: 0.3 }, scene);
    this.node.isVisible = kind !== "trooper";
    this.node.material = kind === "turret" ? materials.rust : kind === "stalker" ? materials.purple : materials.enemy;
    this.node.position.z = -0.2;
    if (kind === "drone") {
      this.sprite = new Sprite(`drone-${x}`, droneManager);
      this.sprite.width = 2.2;
      this.sprite.height = 1.6;
      this.sprite.position.z = -0.5;
    }
  }
  update(dt: number, playerX: number, playerY: number, bullets: Bullet[], scene: Scene, materials: Record<string, StandardMaterial>) {
    this.t += dt;
    this.shootTimer -= dt;
    if (this.kind === "drone") this.y = this.ground + Math.sin(this.t * 3.4) * 0.65;
    if (this.kind === "stalker") { this.x += Math.sign(playerX - this.x) * dt * 1.15; this.y = this.ground + Math.sin(this.t * 5) * 0.25; }
    if (this.kind === "trooper") {
      this.x += Math.sign(playerX - this.x) * dt * 0.62;
      this.y = this.ground;
    }
    if (this.shootTimer <= 0 && Math.abs(playerX - this.x) < 20) {
      this.shootTimer = this.kind === "turret" ? 2.2 : this.kind === "stalker" ? .9 : 1.45;
      const dir = Math.sign(playerX - this.x) || -1;
      const projectile = MeshBuilder.CreateBox("enemy-bolt", { width: 0.44, height: 0.14, depth: 0.14 }, scene);
      projectile.material = materials.enemyBolt;
      bullets.push({ mesh: projectile, x: this.x, y: this.y + 0.2, vx: dir * 7.5, vy: this.kind === "drone" ? Math.sin(this.t) * 1.2 : 0, damage: 12, enemy: true, life: 3 });
    }
    this.node.position.set(this.x, this.y, -0.2);
    if (this.sprite) this.sprite.position.set(this.x, this.y, -0.5);
  }
  hit(damage: number) { this.health -= damage; return this.health <= 0; }
  dispose() { this.node.dispose(); this.sprite?.dispose(); }
}

export async function createGameScene(canvas: HTMLCanvasElement, onHud: (hud: HudState) => void): Promise<GameHandle> {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  engine.setHardwareScalingLevel(1);
  const scene = new Scene(engine);
  scene.clearColor.set(0.015, 0.03, 0.08, 1);
  const camera = new FreeCamera("renegade-camera", new Vector3(0, 0, -20), scene);
  camera.setTarget(Vector3.Zero());
  camera.mode = 1;
  camera.orthoLeft = -VIEW_W / 2;
  camera.orthoRight = VIEW_W / 2;
  camera.orthoTop = VIEW_H / 2;
  camera.orthoBottom = -VIEW_H / 2;
  camera.minZ = 0.1;
  camera.maxZ = 100;
  new HemisphericLight("moonlight", new Vector3(0, 1, -1), scene).intensity = 0.55;
  const glow = new GlowLayer("cyan-glow", scene);
  glow.intensity = 0.5;

  const materials = {
    ground: mat(scene, "mossy-ground", "#173D45"),
    groundTop: mat(scene, "ground-top", "#7CBF67", true),
    metal: mat(scene, "metal", "#283544"),
    rust: mat(scene, "rust", "#8E3D2C"),
    enemy: mat(scene, "enemy", "#B33A32"),
    enemyBolt: mat(scene, "enemy-bolt", "#FF8C31", true),
    cyan: mat(scene, "cyan", "#24E0E6", true),
    orange: mat(scene, "orange", "#FF7138", true),
    lime: mat(scene, "lime", "#B9F04A", true),
    purple: mat(scene, "purple", "#8B5CF6", true),
    white: mat(scene, "white", "#F8F0D8", true),
  };

  const bg = MeshBuilder.CreatePlane("generated-backdrop", { width: 180, height: 101.25 }, scene);
  const bgMat = new StandardMaterial("generated-backdrop-mat", scene);
  bgMat.diffuseTexture = new Texture(BG_URL, scene);
  bgMat.diffuseTexture.hasAlpha = false;
  bgMat.emissiveColor = new Color3(0.38, 0.42, 0.7);
  bgMat.specularColor = Color3.Black();
  bgMat.alpha = 0.6;
  bg.material = bgMat;
  bg.position.set(77, 2, 5);

  const farMountains = MeshBuilder.CreatePlane("parallax-mountains", { width: 180, height: 12 }, scene);
  farMountains.position.set(77, -1.4, 3.8);
  const mountainMat = mat(scene, "mountain-mat", "#101F46");
  mountainMat.alpha = 0.74;
  farMountains.material = mountainMat;
  const canopy = MeshBuilder.CreatePlane("canopy", { width: 180, height: 8 }, scene);
  canopy.position.set(77, -3.65, 2.8);
  const canopyMat = mat(scene, "canopy-mat", "#0B2934");
  canopyMat.alpha = 0.88;
  canopy.material = canopyMat;

  const ground = MeshBuilder.CreateBox("ground", { width: WORLD_W + 8, height: 1.2, depth: 0.6 }, scene);
  ground.position.set(WORLD_W / 2, GROUND_Y - 0.55, 0);
  ground.material = materials.ground;
  const grass = MeshBuilder.CreateBox("grass-line", { width: WORLD_W + 8, height: 0.14, depth: 0.7 }, scene);
  grass.position.set(WORLD_W / 2, GROUND_Y + 0.04, -0.1);
  grass.material = materials.groundTop;

  const operativeManager = new SpriteManager("operative-sprites", OPERATIVE_URL, 1, { width: 1920, height: 1920 }, scene);
  const droneManager = new SpriteManager("drone-sprites", DRONE_URL, 24, { width: 1920, height: 1920 }, scene);
  const playerSprite = new Sprite("operative", operativeManager);
  playerSprite.width = 2.15;
  playerSprite.height = 2.9;
  playerSprite.position.z = -0.7;

  const player = { x: 5, y: GROUND_Y + 1.55, vx: 0, vy: 0, health: 100, lives: 3, onGround: true, invuln: 0, fireTimer: 0, weapon: "AR-7" as WeaponName, checkpoint: 0 };
  const enemies: Enemy[] = [];
  const bullets: Bullet[] = [];
  const particles: Particle[] = [];
  const crates: Mesh[] = [];
  let boss: { body: Mesh; core: Mesh; x: number; y: number; health: number; shoot: number; active: boolean } | null = null;
  let miniBoss: { body: Mesh; core: Mesh; x: number; y: number; health: number; shoot: number; active: boolean } | null = null;
  let audioReady = false;
  let audioCtx: AudioContext | null = null;
  let musicAudio: HTMLAudioElement | null = null;
  const leaderboardKey = "project-renegade-leaderboard";
  const readLeaderboard = (): LeaderboardEntry[] => {
    try { return JSON.parse(localStorage.getItem(leaderboardKey) ?? "[]") as LeaderboardEntry[]; } catch { return []; }
  };
  const saveScore = () => {
    const next = [...readLeaderboard(), { score, zone: boss?.health === 0 ? "FULL CLEAR" : miniBoss?.health === 0 ? "ZONE 02" : "ZONE 01" }].sort((a, b) => b.score - a.score).slice(0, 5);
    try { localStorage.setItem(leaderboardKey, JSON.stringify(next)); } catch { /* storage is optional */ }
  };
  const playSfx = (kind: "shot" | "hit" | "jump" | "pickup" | "boss") => {
    if (!audioCtx || !audioReady) return;
    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const frequencies = { shot: 410, hit: 130, jump: 260, pickup: 740, boss: 88 };
    oscillator.type = kind === "boss" ? "sawtooth" : "square";
    oscillator.frequency.setValueAtTime(frequencies[kind], now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "hit" ? 62 : frequencies[kind] * 1.7, now + (kind === "boss" ? .22 : .08));
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(kind === "boss" ? .09 : .045, now + .006); gain.gain.exponentialRampToValueAtTime(.0001, now + (kind === "boss" ? .24 : .11));
    oscillator.connect(gain).connect(audioCtx.destination); oscillator.start(now); oscillator.stop(now + (kind === "boss" ? .25 : .12));
  };
  const armAudio = () => {
    if (audioReady) return;
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextCtor) audioCtx = new AudioContextCtor();
    musicAudio = new Audio("/manus-storage/project-renegade-chiptune_e54d9a2b.wav"); musicAudio.loop = true; musicAudio.volume = .26;
    void musicAudio.play().catch(() => undefined);
    audioReady = true; emitHud();
  };
  let mode: GameMode = "title";
  let score = 0;
  let objective = "REACH THE CITADEL";
  let cameraX = VIEW_W / 2;
  let keyDown = new Set<string>();
  let jumpQueued = false;
  let fireQueued = false;
  let coyoteTime = 0;
  let cameraShake = 0;
  let cameraShakePower = 0;
  let lastTime = performance.now();
  let disposed = false;
  let lastHud = "";

  const emitHud = () => {
    const activeEncounter = miniBoss?.active && miniBoss.health > 0 ? miniBoss : boss?.active ? boss : null;
    const hud: HudState = { score, lives: player.lives, health: Math.round(player.health), weapon: player.weapon, checkpoint: player.checkpoint, bossHealth: activeEncounter ? Math.max(0, activeEncounter.health) : null, bossName: miniBoss?.active && miniBoss.health > 0 ? "EMBER WARDEN" : boss?.active ? "SENTINEL CORE" : null, objective, mode, audioReady: audioReady, leaderboard: readLeaderboard() };
    const serial = JSON.stringify(hud);
    if (serial !== lastHud) { lastHud = serial; onHud(hud); }
  };
  const setMode = (next: GameMode) => { mode = next; emitHud(); };

  const spawnEnemy = (kind: EnemyKind, x: number, y: number) => enemies.push(new Enemy(kind, x, y, scene, droneManager, materials));
  const buildLevel = () => {
    [15, 26, 42, 56, 72, 88, 103].forEach((x, i) => spawnEnemy(i % 3 === 0 ? "drone" : i % 3 === 1 ? "trooper" : "turret", x, i % 3 === 0 ? -1.5 : GROUND_Y + 1.1));
    [101, 114].forEach((x) => spawnEnemy("stalker", x, GROUND_Y + 1.1));
    [22, 31, 47, 77, 96].forEach((x) => {
      const crate = MeshBuilder.CreateBox(`crate-${x}`, { width: 1.55, height: 1.55, depth: 0.5 }, scene);
      crate.position.set(x, GROUND_Y + 0.78, -0.15);
      crate.material = materials.metal;
      crates.push(crate);
    });
    [36, 64, 92].forEach((x) => {
      const hazard = MeshBuilder.CreateBox(`hazard-${x}`, { width: 3.1, height: 0.08, depth: 0.2 }, scene);
      hazard.position.set(x, GROUND_Y + 0.12, -0.25);
      hazard.material = materials.orange;
      hazard.metadata = { hazard: true };
    });
    const gate = MeshBuilder.CreateBox("reactor-gate", { width: 3.4, height: 6.7, depth: 0.6 }, scene);
    gate.position.set(126, -1.3, 0.1);
    gate.material = materials.metal;
    const gateCore = MeshBuilder.CreateCylinder("gate-core", { diameter: 2.2, height: 0.25, tessellation: 24 }, scene);
    gateCore.rotation.x = Math.PI / 2;
    gateCore.position.set(126, -1.3, -0.5);
    gateCore.material = materials.cyan;
    boss = { body: MeshBuilder.CreateBox("sentinel-core-body", { width: 4, height: 4.7, depth: 0.8 }, scene), core: MeshBuilder.CreateCylinder("sentinel-core", { diameter: 1.65, height: 0.5, tessellation: 24 }, scene), x: 132, y: GROUND_Y + 2.5, health: 100, shoot: 1.4, active: false };
    boss.body.material = materials.rust;
    boss.body.position.z = -0.4;
    boss.core.rotation.x = Math.PI / 2;
    boss.core.material = materials.orange;
    boss.core.position.z = -0.85;
    boss.body.isVisible = false;
    boss.core.isVisible = false;
    const zoneGate = MeshBuilder.CreateBox("zone-two-gate", { width: 1.2, height: 6.4, depth: .4 }, scene);
    zoneGate.position.set(82, -1.8, .15); zoneGate.material = materials.purple;
    miniBoss = { body: MeshBuilder.CreateBox("ember-warden-body", { width: 4.2, height: 4.8, depth: .8 }, scene), core: MeshBuilder.CreateCylinder("ember-warden-core", { diameter: 1.45, height: .5, tessellation: 16 }, scene), x: 92, y: GROUND_Y + 2.5, health: 60, shoot: 1.1, active: false };
    miniBoss.body.material = materials.purple; miniBoss.body.position.z = -.4; miniBoss.core.rotation.x = Math.PI / 2; miniBoss.core.material = materials.lime; miniBoss.core.position.z = -.85; miniBoss.body.isVisible = false; miniBoss.core.isVisible = false;
  };
  const clearLevel = () => {
    enemies.splice(0).forEach((enemy) => enemy.dispose());
    bullets.splice(0).forEach((bullet) => bullet.mesh.dispose());
    particles.splice(0).forEach((particle) => particle.mesh.dispose());
    crates.splice(0).forEach((crate) => crate.dispose());
    if (boss) { boss.body.dispose(); boss.core.dispose(); }
    if (miniBoss) { miniBoss.body.dispose(); miniBoss.core.dispose(); }
  };
  const reset = () => {
    clearLevel();
    player.x = 5; player.y = GROUND_Y + 1.55; player.vx = 0; player.vy = 0; player.health = 100; player.lives = 3; player.onGround = true; player.invuln = 0; player.fireTimer = 0; player.weapon = "AR-7"; player.checkpoint = 0;
    score = 0; objective = "REACH THE CITADEL"; cameraX = VIEW_W / 2; buildLevel(); setMode("title");
  };
  const burst = (x: number, y: number, color: StandardMaterial, count = 8) => {
    const available = Math.max(0, 180 - particles.length);
    count = Math.min(count, available);
    for (let i = 0; i < count; i++) {
      const mesh = MeshBuilder.CreateBox("spark", { width: 0.12, height: 0.12, depth: 0.08 }, scene); mesh.material = color; mesh.position.set(x, y, -0.9);
      particles.push({ mesh, life: 0.36 + Math.random() * 0.28, max: 0.65, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.35) * 7 });
    }
  };
  const fire = () => {
    if (player.fireTimer > 0) return;
    player.fireTimer = player.weapon === "ARC LANCE" ? 0.34 : 0.16;
    const originX = player.x + 1.05;
    const count = player.weapon === "VOLT SPREAD" ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - 1) * 0.13;
      const mesh = MeshBuilder.CreateBox("pulse-shot", { width: player.weapon === "ARC LANCE" ? 1.2 : 0.62, height: player.weapon === "ARC LANCE" ? 0.16 : 0.1, depth: 0.1 }, scene);
      mesh.material = player.weapon === "ARC LANCE" ? materials.purple : materials.cyan;
      bullets.push({ mesh, x: originX, y: player.y + 0.18, vx: 18, vy: spread * 8, damage: player.weapon === "ARC LANCE" ? 3 : 1, enemy: false, life: 1.8 });
    }
    burst(originX, player.y + 0.18, player.weapon === "ARC LANCE" ? materials.purple : materials.cyan, 3);
    cameraShake = Math.max(cameraShake, 0.08); cameraShakePower = Math.max(cameraShakePower, player.weapon === "ARC LANCE" ? 0.1 : 0.045);
    playSfx("shot");
  };
  const damagePlayer = (amount: number) => {
    if (player.invuln > 0 || mode !== "playing") return;
    player.health -= amount; player.invuln = 0.8; burst(player.x, player.y, materials.orange, 7); cameraShake = 0.22; cameraShakePower = 0.18; playSfx("hit");
    if (player.health <= 0) {
      player.lives -= 1;
      if (player.lives <= 0) { saveScore(); setMode("gameover"); return; }
      player.health = 100; player.x = player.checkpoint || 5; player.y = GROUND_Y + 1.55; player.vy = 0; objective = `CHECKPOINT ${player.checkpoint ? "REACHED" : "ACTIVE"}`;
    }
    emitHud();
  };
  const handleInput = (event: KeyboardEvent, down: boolean) => {
    const key = event.key.toLowerCase();
    if (down) {
      armAudio();
      keyDown.add(key);
      if (key === " " || key === "w" || key === "arrowup") jumpQueued = true;
      if (key === "j" || key === "k" || key === "z") fireQueued = true;
      if (key === "enter" && mode === "title") start();
      if (key === "p" && (mode === "playing" || mode === "paused")) togglePause();
      if (key === "1") player.weapon = "AR-7";
      if (key === "2") player.weapon = "VOLT SPREAD";
      if (key === "q") player.weapon = player.weapon === "AR-7" ? "VOLT SPREAD" : player.weapon === "VOLT SPREAD" ? "ARC LANCE" : "AR-7";
      emitHud();
    } else keyDown.delete(key);
  };
  const onKeyDown = (event: KeyboardEvent) => { if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) event.preventDefault(); handleInput(event, true); };
  const onKeyUp = (event: KeyboardEvent) => handleInput(event, false);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  const onBlur = () => { keyDown.clear(); jumpQueued = false; fireQueued = false; if (mode === "playing") setMode("paused"); };
  window.addEventListener("blur", onBlur);
  const onPointerDown = () => armAudio();
  window.addEventListener("pointerdown", onPointerDown, { once: true });

  const update = (dt: number) => {
    if (mode !== "playing") return;
    dt = Math.min(dt, 0.033);
    player.invuln = Math.max(0, player.invuln - dt); player.fireTimer = Math.max(0, player.fireTimer - dt);
    const left = keyDown.has("a") || keyDown.has("arrowleft"); const right = keyDown.has("d") || keyDown.has("arrowright");
    const move = (right ? 1 : 0) - (left ? 1 : 0);
    player.vx = Scalar.Lerp(player.vx, move * 6.3, 0.22); player.x = Scalar.Clamp(player.x + player.vx * dt, 1.2, WORLD_W - 2);
    coyoteTime = player.onGround ? 0.1 : Math.max(0, coyoteTime - dt);
    if (jumpQueued && (player.onGround || coyoteTime > 0)) { player.vy = 10.7; player.onGround = false; coyoteTime = 0; burst(player.x, GROUND_Y + 0.2, materials.lime, 4); playSfx("jump"); }
    jumpQueued = false;
    player.vy -= 24 * dt; player.y += player.vy * dt;
    const floor = GROUND_Y + 1.55;
    if (player.y <= floor) { player.y = floor; player.vy = 0; player.onGround = true; }
    if (fireQueued || keyDown.has("j") || keyDown.has("k") || keyDown.has("z")) fireQueued = false, fire();
    if (player.x > 56 && player.checkpoint < 56) { player.checkpoint = 56; objective = "CHECKPOINT LOCKED // BREACH THE CITADEL"; burst(56, GROUND_Y + 2, materials.lime, 14); playSfx("pickup"); }
    if (player.x > 84 && miniBoss && !miniBoss.active && miniBoss.health > 0) { miniBoss.active = true; objective = "ZONE 02 // DEFEAT THE EMBER WARDEN"; playSfx("boss"); }
    if (miniBoss?.active) {
      miniBoss.body.isVisible = true; miniBoss.core.isVisible = true; miniBoss.body.position.set(miniBoss.x, miniBoss.y + Math.sin(performance.now() / 250) * .2, -.4); miniBoss.core.position.set(miniBoss.x, miniBoss.y, -.85); miniBoss.core.rotation.y += dt * 3; miniBoss.shoot -= dt;
      if (miniBoss.shoot <= 0) { miniBoss.shoot = .92; [-.55, 0, .55].forEach((vy) => { const mesh = MeshBuilder.CreateBox("warden-bolt", { width: .5, height: .13, depth: .1 }, scene); mesh.material = materials.lime; bullets.push({ mesh, x: miniBoss!.x - 2, y: miniBoss!.y + vy, vx: -9, vy, damage: 13, enemy: true, life: 3 }); }); }
    }
    if (player.x > 112 && !boss?.active && miniBoss?.health === 0) { if (boss) boss.active = true; objective = "DESTROY THE SENTINEL CORE"; playSfx("boss"); }
    if (boss?.active) {
      boss.body.isVisible = true; boss.core.isVisible = true; boss.body.position.set(boss.x, boss.y, -0.4); boss.core.position.set(boss.x, boss.y, -0.85); boss.core.rotation.y += dt * 2.2; boss.shoot -= dt;
      const activeBoss = boss;
      if (activeBoss && activeBoss.shoot <= 0) { activeBoss.shoot = 1.25; [-0.7, 0, 0.7].forEach((vy) => { const mesh = MeshBuilder.CreateBox("core-bolt", { width: 0.52, height: 0.14, depth: 0.1 }, scene); mesh.material = materials.orange; bullets.push({ mesh, x: activeBoss.x - 1.9, y: activeBoss.y + vy, vx: -8.2, vy, damage: 16, enemy: true, life: 3 }); }); }
    }
    enemies.forEach((enemy) => enemy.update(dt, player.x, player.y, bullets, scene, materials));
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]; bullet.life -= dt; bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.mesh.position.set(bullet.x, bullet.y, bullet.enemy ? -0.65 : -0.95);
      if (bullet.life <= 0 || bullet.x < -2 || bullet.x > WORLD_W + 4 || bullet.y < -9 || bullet.y > 9) { bullet.mesh.dispose(); bullets.splice(i, 1); continue; }
      if (bullet.enemy && Math.abs(bullet.x - player.x) < 1.1 && Math.abs(bullet.y - player.y) < 1.45) { bullet.mesh.dispose(); bullets.splice(i, 1); damagePlayer(bullet.damage); continue; }
      if (!bullet.enemy) {
        let hit = false;
        for (const enemy of enemies) if (Math.abs(bullet.x - enemy.x) < 1.2 && Math.abs(bullet.y - enemy.y) < 1.4) { hit = true; if (enemy.hit(bullet.damage)) { score += enemy.kind === "turret" ? 500 : 250; burst(enemy.x, enemy.y, materials.orange, 13); enemy.dispose(); enemies.splice(enemies.indexOf(enemy), 1); } else burst(bullet.x, bullet.y, materials.white, 3); break; }
        if (!hit && miniBoss?.active && miniBoss.health > 0 && Math.abs(bullet.x - miniBoss.x) < 2.1 && Math.abs(bullet.y - miniBoss.y) < 2.7) { miniBoss.health -= bullet.damage; hit = true; burst(bullet.x, bullet.y, materials.lime, 4); if (miniBoss.health <= 0) { miniBoss.health = 0; miniBoss.active = false; miniBoss.body.isVisible = false; miniBoss.core.isVisible = false; score += 2500; player.checkpoint = 88; objective = "ZONE 02 CLEARED // CITADEL APPROACH"; burst(miniBoss.x, miniBoss.y, materials.lime, 28); playSfx("pickup"); } }
        if (!hit && boss?.active && Math.abs(bullet.x - boss.x) < 2.1 && Math.abs(bullet.y - boss.y) < 2.7) { boss.health -= bullet.damage; hit = true; burst(bullet.x, bullet.y, materials.purple, 4); if (boss.health <= 0) { boss.health = 0; score += 5000; objective = "ISLAND SECURED // SIGNAL BROKEN"; burst(boss.x, boss.y, materials.cyan, 36); saveScore(); setMode("victory"); } }
        if (hit) { bullet.mesh.dispose(); bullets.splice(i, 1); continue; }
        for (const crate of crates) if (crate.isDisposed() === false && Math.abs(bullet.x - crate.position.x) < 1.1 && Math.abs(bullet.y - crate.position.y) < 1.1) { crate.scaling.x -= 0.18; burst(bullet.x, bullet.y, materials.white, 2); if (crate.scaling.x < 0.2) { score += 100; crate.dispose(); } bullet.mesh.dispose(); bullets.splice(i, 1); break; }
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.vy -= 15 * dt; p.mesh.scaling.scaleInPlace(0.96); if (p.life <= 0) { p.mesh.dispose(); particles.splice(i, 1); } }
    for (const mesh of crates) if (!mesh.isDisposed() && mesh.metadata?.hazard !== true && Math.abs(mesh.position.x - player.x) < 1.2 && player.y < GROUND_Y + 2.2) { player.x -= player.vx * dt; }
    if ([36, 64, 92].some((x) => Math.abs(player.x - x) < 1.4) && player.onGround) damagePlayer(7 * dt);
    if (player.x > 148) { saveScore(); setMode("victory"); }
    cameraX = Scalar.Lerp(cameraX, Scalar.Clamp(player.x, VIEW_W / 2, WORLD_W - VIEW_W / 2), 0.08); cameraShake = Math.max(0, cameraShake - dt); cameraShakePower = Scalar.Lerp(cameraShakePower, 0, 0.18); camera.position.x = cameraX + (cameraShake > 0 ? (Math.random() - 0.5) * cameraShakePower : 0); camera.position.y = cameraShake > 0 ? (Math.random() - 0.5) * cameraShakePower * 0.5 : 0;
    playerSprite.position.set(player.x, player.y, -0.7); playerSprite.angle = player.vx < -0.2 ? 180 : 0; playerSprite.cellIndex = 0;
    emitHud();
  };

  const renderLoop = () => { if (disposed) return; const now = performance.now(); const dt = (now - lastTime) / 1000; lastTime = now; update(dt); scene.render(); };
  buildLevel(); emitHud(); engine.runRenderLoop(renderLoop);
  const start = () => { if (mode === "title" || mode === "gameover" || mode === "victory") { if (mode !== "title") reset(); mode = "playing"; objective = "REACH THE CITADEL"; emitHud(); } };
  const togglePause = () => { if (mode === "playing") setMode("paused"); else if (mode === "paused") setMode("playing"); };
  const restart = () => { reset(); mode = "playing"; emitHud(); };
  const resize = () => { engine.resize(); };
  const dispose = () => { disposed = true; window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur); window.removeEventListener("pointerdown", onPointerDown); musicAudio?.pause(); musicAudio = null; audioCtx?.close(); clearLevel(); operativeManager.dispose(); droneManager.dispose(); scene.dispose(); engine.dispose(); };
  return { start, togglePause, restart, resize, dispose };
}
