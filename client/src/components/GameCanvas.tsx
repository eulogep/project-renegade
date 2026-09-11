import { useEffect, useRef, useState } from "react";
import { createGameScene, type GameHandle, type HudState } from "@/game/scene";

const initialHud: HudState = {
  score: 0,
  lives: 3,
  health: 100,
  weapon: "AR-7",
  checkpoint: 0,
  bossHealth: null,
  bossName: null,
  audioReady: false,
  leaderboard: [],
  objective: "REACH THE CITADEL",
  mode: "title",
};

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<HudState>(initialHud);
  const [ready, setReady] = useState(false);
  const demo = new URLSearchParams(window.location.search).has("demo");

  useEffect(() => {
    let disposed = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: GameHandle | null = null;

    createGameScene(canvas, (nextHud) => {
      if (!disposed) setHud(nextHud);
    }).then((created) => {
      if (disposed) {
        created.dispose();
        return;
      }
      handle = created;
      handleRef.current = created;
      setReady(true);
      if (demo) window.setTimeout(() => created.start(), 260);
    });

    const onResize = () => handle?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      handleRef.current = null;
    };
  }, [demo]);

  const start = () => handleRef.current?.start();
  const togglePause = () => handleRef.current?.togglePause();
  const restart = () => handleRef.current?.restart();

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" aria-label="PROJECT RENEGADE game canvas" />
      <div className="scanlines" aria-hidden="true" />
      <div className="hud-layer" aria-live="polite">
        <div className="hud-top">
          <div className="health-cluster">
            <span className="hud-label">VITALS</span>
            <div className="health-track"><span style={{ width: `${hud.health}%` }} /></div>
            <span className="hud-value">{String(Math.max(0, hud.health)).padStart(3, "0")}</span>
          </div>
          <div className="score-cluster">
            <span className="hud-label">SCORE</span>
            <span className="score-value">{String(hud.score).padStart(7, "0")}</span>
          </div>
          <div className="weapon-cluster">
            <span className="hud-label">LOADOUT</span>
            <span className="weapon-value">{hud.weapon}</span>
          </div>
        </div>

        {hud.bossHealth !== null && hud.mode === "playing" && (
          <div className="boss-bar-wrap">
            <div className="boss-title"><span>{hud.bossName ?? "HOSTILE"}</span><span>HOSTILE // OVERRIDE</span></div>
            <div className="boss-track"><span style={{ width: `${hud.bossHealth}%` }} /></div>
          </div>
        )}

        <div className="hud-bottom">
          <div className="objective"><span className="objective-dot" /> {hud.objective} {!hud.audioReady && hud.mode === "playing" && <small className="audio-hint">CLICK TO ARM AUDIO</small>}</div>
          <div className="lives">LIVES <strong>{"◆".repeat(Math.max(0, hud.lives))}</strong></div>
        </div>
      </div>

      {hud.mode === "title" && (
        <section className="title-screen">
          <div className="title-art" aria-hidden="true" />
          <div className="title-content">
            <div className="eyebrow"><span className="eyebrow-line" /> OPERATION 07 // ISLE OF KESTREL</div>
            <h1>PROJECT <em>RENEGADE</em></h1>
            <p className="title-deck">The island went silent. The reactor woke up.<br />Get in, break the signal, get out.</p>
            <button className="deploy-button" onClick={start} disabled={!ready}>
              <span>{ready ? "DEPLOY NOW" : "SYNCING..."}</span><b>↗</b>
            </button>
            <div className="title-meta"><span>ARCADE VERTICAL SLICE</span><span>v0.9.7 // ORIGINAL BUILD</span></div>
          </div>
          <div className="title-footer"><span>ENTER / CLICK TO DEPLOY</span><span>BEST SCORE SAVES LOCALLY</span></div>
        </section>
      )}

      {hud.mode === "paused" && (
        <section className="modal-screen">
          <div className="modal-card"><span className="eyebrow">SIGNAL PAUSED</span><h2>Hold the line.</h2><p>Press P or resume when you are ready to breach the next sector.</p><button className="deploy-button" onClick={togglePause}>RESUME <b>↗</b></button></div>
        </section>
      )}

      {(hud.mode === "gameover" || hud.mode === "victory") && (
        <section className="modal-screen">
          <div className="modal-card">
            <span className="eyebrow">{hud.mode === "victory" ? "SIGNAL BROKEN // ISLAND SECURED" : "SIGNAL LOST // OPERATIVE DOWN"}</span>
            <h2>{hud.mode === "victory" ? "Core offline." : "Run it back."}</h2>
            <p>{hud.mode === "victory" ? `Final score ${String(hud.score).padStart(7, "0")}. The Kestrel gate is open.` : "The last checkpoint is still warm. Fast restart, no excuses."}</p>
            {hud.mode === "victory" && hud.leaderboard && hud.leaderboard.length > 0 && (
              <div className="leaderboard"><div className="leaderboard-head"><span>LOCAL RANKING</span><span>BEST RUNS</span></div>{hud.leaderboard.map((entry, index) => <div className={`leaderboard-row ${index === 0 ? "is-best" : ""}`} key={`${entry.score}-${index}`}><span><b>{String(index + 1).padStart(2, "0")}</b> {entry.zone}</span><strong>{String(entry.score).padStart(7, "0")}</strong></div>)}</div>
            )}
            <button className="deploy-button" onClick={restart}>REDEPLOY <b>↗</b></button>
          </div>
        </section>
      )}

      {hud.mode === "playing" && (
        <div className="control-strip"><span><b>A/D</b> MOVE</span><span><b>SPACE</b> JUMP</span><span><b>J</b> FIRE</span><span><b>Q / 1 / 2</b> WEAPON</span><span><b>P</b> PAUSE</span></div>
      )}
    </main>
  );
}
