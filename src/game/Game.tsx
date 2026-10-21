import { useCallback, useEffect, useRef, useState } from "react";
import { DialogBox, DocsModal, HelpModal, Key, Menu, Notebook, Overlay, Panel, QuizModal, Confirm } from "./ui";
import { ACHIEVEMENTS, OBJECTIVES, apply, dialogFor, initialProgress, type Action, type NpcId, type Progress } from "./quest";
import { GATE, H, INTERACT, START, TS, VH, VW, W, buildWorld, isSolidTile } from "./world";
import { drawChar, drawFlag, drawGate, drawMarker, drawMoto, prerender, type Dir, type Look } from "./render";

type Mode = "start" | "play" | "dialog" | "quiz" | "docs" | "notebook" | "help" | "pause" | "ending";
type Npc = { id: NpcId; name: string; x: number; y: number; dir: Dir; look: Look };

const SAVE_KEY = "saga-da-vaga-v1";
const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const KEYDIR: Record<string, Dir> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
};
const OPP: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

const PLAYER_LOOK: Look = { skin: "#c68a5b", hair: "#1e1410", shirt: "#2f80c4", pants: "#2b2f4a", pack: "#e0503a" };
const makeNpcs = (): Npc[] => [
  { id: "beto", name: "Beto", x: 12, y: 17, dir: "down", look: { skin: "#a86b44", hair: "#2a1a12", shirt: "#f2c14e", pants: "#3b5b8a", cap: "#d7263d" } },
  { id: "celia", name: "Dona Célia", x: 28, y: 9, dir: "down", look: { skin: "#d9a37a", hair: "#a8a8a8", shirt: "#c8553d", pants: "#4a3b3b", apron: "#f5f0e1", glasses: true, bun: true } },
  { id: "lia", name: "Lia", x: 9, y: 22, dir: "down", look: { skin: "#8d5a3b", hair: "#1a1010", shirt: "#2e9e7a", pants: "#3b4a6b", glasses: true, braids: true } },
  { id: "fiscal", name: "Fiscal do Edital", x: 31, y: 14, dir: "down", look: { skin: "#e0b08a", hair: "#3a2a1a", shirt: "#e9e4d4", pants: "#3a3a3a", tie: "#2e5a9e", clipboard: true } },
];
const NEXT_NPC: (NpcId | null)[] = ["beto", "celia", "lia", "fiscal", null];

type SaveData = { progress: Progress; player: { x: number; y: number; dir: Dir } };

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setModeState] = useState<Mode>("start");
  const modeRef = useRef<Mode>("start");
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const progRef = useRef(progress);
  progRef.current = progress;
  const [dialog, setDialog] = useState<{ speaker: string; lines: string[]; action?: Action | undefined; key: number } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [scale, setScale] = useState(3);
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  soundRef.current = sound;
  const [hasSave, setHasSave] = useState(false);
  const [confirm, setConfirm] = useState<null | "reset" | "menu">(null);
  const [toast, setToast] = useState<string | null>(null);
  const helpReturn = useRef<Mode>("play");
  const audio = useRef<AudioContext | null>(null);
  const talkCounts = useRef<Record<string, number>>({});

  const game = useRef({
    world: buildWorld(),
    npcs: makeNpcs(),
    player: { tx: START.x, ty: START.y, fx: START.x, fy: START.y, prog: 1, moving: false, dir: "down" as Dir, walk: 0 },
    held: [] as Dir[],
  });

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    game.current.held = [];
    setModeState(m);
  }, []);

  const beep = useCallback((freq = 660, dur = 0.05, type: OscillatorType = "square") => {
    if (!soundRef.current) return;
    try {
      audio.current ??= new AudioContext();
      const a = audio.current, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
    } catch { /* audio optional */ }
  }, []);

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2600);
  }, []);

  const save = useCallback((p: Progress = progRef.current) => {
    const pl = game.current.player;
    const data: SaveData = { progress: p, player: { x: pl.tx, y: pl.ty, dir: pl.dir } };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); setHasSave(true); } catch { /* ignore */ }
  }, []);

  const doApply = useCallback((action: Action) => {
    const prev = progRef.current;
    const next = apply(prev, action);
    if (next === prev) return prev;
    progRef.current = next;
    setProgress(next);
    const newAch = next.achievements.filter((a) => !prev.achievements.includes(a));
    if (newAch.length) { showToast(`★ Conquista: ${ACHIEVEMENTS[newAch[0] ?? ""]?.name ?? ""}`); beep(880, 0.15, "triangle"); }
    else if (next.step !== prev.step) showToast("Objetivo atualizado!");
    save(next);
    return next;
  }, [beep, save, showToast]);

  const placePlayer = (x: number, y: number, dir: Dir) => {
    Object.assign(game.current.player, { tx: x, ty: y, fx: x, fy: y, prog: 1, moving: false, dir });
  };

  const newGame = () => {
    const p = initialProgress();
    progRef.current = p; setProgress(p);
    placePlayer(START.x, START.y, "down");
    talkCounts.current = {};
    save(p);
    setMode("play");
    showToast("Missão: A Inscrição");
  };

  const continueGame = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as SaveData;
        const p = { ...initialProgress(), ...d.progress };
        progRef.current = p; setProgress(p);
        placePlayer(d.player?.x ?? START.x, d.player?.y ?? START.y, d.player?.dir ?? "down");
      }
    } catch { /* corrupted save → keep defaults */ }
    setMode("play");
  };

  useEffect(() => {
    try { setHasSave(!!localStorage.getItem(SAVE_KEY)); } catch { /* ignore */ }
    const fit = () => {
      const s = Math.min((window.innerWidth - 24) / VW, (window.innerHeight - 24) / VH);
      setScale(s >= 2 ? Math.floor(s) : Math.max(1, s));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const gateOpen = () => progRef.current.step >= 4;

  const walkable = (x: number, y: number) => {
    const g = game.current;
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (isSolidTile(g.world.tiles[y * W + x] ?? 0)) return false;
    if (!gateOpen() && GATE.some(([gx, gy]) => gx === x && gy === y)) return false;
    return !g.npcs.some((n) => n.x === x && n.y === y);
  };

  const facing = () => {
    const p = game.current.player;
    const [dx, dy] = DV[p.dir];
    const x = p.tx + dx, y = p.ty + dy;
    const npc = game.current.npcs.find((n) => n.x === x && n.y === y);
    if (npc) return { npc, label: `Falar com ${npc.name}` };
    if (GATE.some(([gx, gy]) => gx === x && gy === y))
      return { label: "Portão", lines: gateOpen() ? ["Portão aberto! Bem-vindo ao campus."] : ["O portão está fechado. Aviso: 'Entrada somente com inscrição carimbada'."] };
    const it = INTERACT[`${x},${y}`];
    if (it) return { label: `Examinar: ${it.label}`, lines: it.lines };
    return null;
  };

  const interact = () => {
    const p = game.current.player;
    if (p.moving) return;
    const f = facing();
    if (!f) return;
    beep(520, 0.04);
    if (f.npc) {
      f.npc.dir = OPP[p.dir];
      const c = talkCounts.current[f.npc.id] ?? 0;
      talkCounts.current[f.npc.id] = c + 1;
      const talk = dialogFor(f.npc.id, progRef.current, c);
      setDialog({ speaker: f.npc.name, lines: talk.lines, action: talk.action, key: Date.now() });
    } else if (f.lines) {
      setDialog({ speaker: f.label.replace("Examinar: ", ""), lines: f.lines, key: Date.now() });
    }
    setMode("dialog");
  };

  const endDialog = () => {
    const a = dialog?.action;
    setDialog(null);
    if (a === "beto") { doApply("beto"); setMode("play"); }
    else if (a === "docs") setMode("docs");
    else if (a === "quiz") setMode("quiz");
    else if (a === "finish") { doApply("finish"); beep(990, 0.3, "triangle"); setMode("ending"); }
    else setMode("play");
  };

  const api = useRef({ interact, setMode, save, showToast });
  api.current = { interact, setMode, save, showToast };

  // global keyboard: only active during free play
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const g = game.current;
      const d = KEYDIR[e.key];
      if (d || e.key === " ") e.preventDefault();
      if (e.defaultPrevented && !d && e.key !== " ") return;
      if (modeRef.current !== "play") return;
      if (d) { g.held = [...g.held.filter((x) => x !== d), d]; return; }
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) api.current.interact();
      else if (e.key === "Escape") { api.current.save(); api.current.setMode("pause"); }
      else if (e.key === "j" || e.key === "J") api.current.setMode("notebook");
      else if (e.key === "h" || e.key === "H") { helpReturn.current = "play"; api.current.setMode("help"); }
    };
    const up = (e: KeyboardEvent) => {
      const d = KEYDIR[e.key];
      if (d) game.current.held = game.current.held.filter((x) => x !== d);
    };
    const blur = () => { game.current.held = []; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);

  // game loop
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const pre = prerender(game.current.world);
    const motes = Array.from({ length: 22 }, () => ({ x: Math.random() * VW, y: Math.random() * VH, v: 4 + Math.random() * 8, ph: Math.random() * 6 }));
    let last = performance.now(), raf = 0, lastHint: string | null = "";
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const g = game.current, p = g.player;
      // update
      if (modeRef.current === "play") {
        if (!p.moving) {
          const d = g.held[g.held.length - 1];
          if (d) {
            p.dir = d;
            const [dx, dy] = DV[d];
            if (walkable(p.tx + dx, p.ty + dy)) { p.fx = p.tx; p.fy = p.ty; p.tx += dx; p.ty += dy; p.prog = 0; p.moving = true; }
          }
        }
        const beto = g.npcs[0];
        if (beto) beto.dir = (["down", "left", "down", "right"] as Dir[])[Math.floor(t / 2.2) % 4] ?? "down";
      }
      if (p.moving) {
        p.prog += dt * 5;
        p.walk += dt * 10;
        if (p.prog >= 1) { p.prog = 1; p.moving = false; }
      }
      const ppx = (p.fx + (p.tx - p.fx) * p.prog) * TS, ppy = (p.fy + (p.ty - p.fy) * p.prog) * TS;
      const camX = Math.round(Math.max(0, Math.min(W * TS - VW, ppx + 8 - VW / 2)));
      const camY = Math.round(Math.max(0, Math.min(H * TS - VH, ppy + 8 - VH / 2)));
      // draw
      ctx.drawImage(pre, -camX, -camY);
      drawFlag(ctx, t, camX, camY);
      drawGate(ctx, progRef.current.step >= 4, camX, camY);
      const ents: { y: number; draw: () => void }[] = g.npcs.map((n, i) => ({
        y: n.y * TS,
        draw: () => drawChar(ctx, n.x * TS - camX, n.y * TS - camY, n.look, n.dir, 0, Math.sin(t * 3 + i * 1.7) > 0.3 ? -1 : 0),
      }));
      const step = p.moving ? Math.floor(p.walk) % 4 : 0;
      ents.push({ y: ppy, draw: () => drawChar(ctx, ppx - camX, ppy - camY, PLAYER_LOOK, p.dir, step, p.moving ? 0 : Math.sin(t * 2.5) > 0.6 ? -1 : 0) });
      ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
      const target = NEXT_NPC[progRef.current.step];
      const tn = g.npcs.find((n) => n.id === target);
      if (tn) drawMarker(ctx, tn.x * TS - camX, tn.y * TS - camY, t);
      // passing motorbike
      const mt = (t % 18) / 18;
      const mx = -40 + mt * (W * TS + 80);
      drawMoto(ctx, mx - camX, 11 * TS + 2 - camY, true);
      for (let i = 1; i <= 3; i++) {
        ctx.fillStyle = `rgba(230,190,130,${0.35 - i * 0.09})`;
        ctx.fillRect(Math.round(mx - camX - i * 5), Math.round(12 * TS + 10 - camY - ((t * 20 + i * 3) % 4)), 3, 3);
      }
      // sun motes + warm light
      ctx.fillStyle = "rgba(255,240,200,0.55)";
      for (const m of motes) {
        m.x += Math.sin(t + m.ph) * dt * 4 + dt * m.v * 0.5; m.y -= dt * m.v * 0.3;
        if (m.x > VW) m.x = 0; if (m.y < 0) m.y = VH;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }
      const grad = ctx.createRadialGradient(VW * 0.85, -20, 10, VW * 0.6, VH * 0.4, VW);
      grad.addColorStop(0, "rgba(255,210,120,0.22)");
      grad.addColorStop(1, "rgba(120,60,20,0.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VW, VH);
      // hint
      const h = modeRef.current === "play" && !p.moving ? facing()?.label ?? null : modeRef.current === "play" ? lastHint : null;
      if (h !== lastHint) { lastHint = h; setHint(h); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const obj = OBJECTIVES[progress.step] ?? OBJECTIVES[0]!;
  const inGame = mode !== "start";

  return (
    <div className="game-stage">
      <div className="relative select-none" style={{ width: VW * scale, height: VH * scale }}>
        <canvas ref={canvasRef} width={VW} height={VH} className="pixel-canvas" style={{ width: VW * scale, height: VH * scale }} />

        {inGame && (
          <>
            <div className="hud-objective pointer-events-none absolute left-2 top-2 z-10 max-w-[60%]">
              <p className="font-pixel text-[10px] text-sun">A SAGA DA VAGA · MISSÃO 01</p>
              <p className="font-game text-lg leading-tight text-panel-foreground">▶ {obj.title}</p>
              <p className="font-game text-sm leading-tight text-muted-foreground">{obj.hint}</p>
            </div>
            <div className="absolute right-2 top-2 z-10 flex gap-1">
              <button type="button" className="hud-btn" onClick={() => setMode("notebook")} title="Caderno">Caderno <Key k="J" /></button>
              <button type="button" className="hud-btn" onClick={() => { helpReturn.current = "play"; setMode("help"); }} title="Como jogar"><Key k="H" /> ?</button>
              <button type="button" className="hud-btn" onClick={() => setSound(!sound)} title="Som">{sound ? "♪" : "×♪"}</button>
              <button type="button" className="hud-btn" onClick={() => { save(); setMode("pause"); }} title="Pausa">II <Key k="Esc" /></button>
            </div>
            {mode === "play" && (
              <div className="hud-legend pointer-events-none absolute bottom-2 left-2 z-10 font-game text-sm">
                <Key k="WASD" /> andar · <Key k="Enter" /> interagir · <Key k="J" /> caderno · <Key k="Esc" /> pausa
              </div>
            )}
            {mode === "play" && hint && (
              <div className="hud-hint pointer-events-none absolute bottom-2 right-2 z-10 font-game text-base"><Key k="Enter" /> {hint}</div>
            )}
            {toast && mode !== "ending" && <div className="hud-toast absolute left-1/2 top-16 z-40 -translate-x-1/2 font-pixel text-xs">{toast}</div>}
          </>
        )}

        {mode === "start" && (
          <Overlay>
            <div className="title-card">
              <p className="font-pixel text-xs tracking-widest text-sun">PROTÓTIPO 01</p>
              <h1 className="title-logo font-pixel">A SAGA<br />DA VAGA</h1>
              <p className="font-game mb-4 text-xl text-panel-foreground">Missão: A Inscrição</p>
              <div className="mx-auto w-64">
                <Menu
                  items={[...(hasSave ? [{ label: "Continuar" }] : []), { label: hasSave ? "Novo jogo" : "Jogar" }, { label: "Como jogar" }]}
                  onSelect={(i) => {
                    const id = hasSave ? i : i + 1;
                    if (id === 0) continueGame();
                    else if (id === 1) newGame();
                    else { helpReturn.current = "start"; setMode("help"); }
                  }}
                />
              </div>
              <p className="font-game mt-4 text-sm text-muted-foreground"><Key k="↑↓" /> escolher · <Key k="Enter" /> confirmar</p>
              <p className="font-game mt-2 text-xs text-muted-foreground">Protótipo independente inspirado por fãs. Sem vínculo oficial com o IFPI. São Raimundo Nonato ficcionalizada com carinho.</p>
            </div>
          </Overlay>
        )}

        {mode === "dialog" && dialog && <DialogBox key={dialog.key} speaker={dialog.speaker} lines={dialog.lines} onDone={endDialog} blip={() => beep(440, 0.03)} />}

        {mode === "docs" && (
          <DocsModal
            onWrong={() => { doApply("docsFail"); beep(160, 0.2, "sawtooth"); }}
            onClose={() => setMode("play")}
            onSolved={() => {
              doApply("docsOk");
              beep(880, 0.12, "triangle");
              setDialog({ speaker: "Dona Célia", key: Date.now(), lines: [
                "Que beleza! Grampeado na ordem, sem orelha, sem dobra!",
                "Tome aqui o seu FORMULÁRIO DE INSCRIÇÃO. Cheirinho de papel novo.",
                "Ah, tem uma questão de desconto no formulário... A Lia, lá na praça, é craque em conta!",
              ] });
              setMode("dialog");
            }}
          />
        )}

        {mode === "quiz" && (
          <QuizModal
            onWrong={() => { doApply("quizFail"); beep(160, 0.2, "sawtooth"); }}
            onClose={() => setMode("play")}
            onSolved={() => {
              doApply("quizOk");
              setDialog({ speaker: "Lia", key: Date.now(), lines: [
                "Isso! Você calculou a parte e tirou do todo. É assim que se faz.",
                "Agora leva o formulário pro Fiscal do Edital, lá no portão do campus. Boa sorte!",
              ] });
              setMode("dialog");
            }}
          />
        )}

        {mode === "notebook" && <Notebook p={progress} onClose={() => setMode("play")} onEnding={() => setMode("ending")} />}
        {mode === "help" && <HelpModal onClose={() => setMode(helpReturn.current)} />}

        {mode === "pause" && (
          <Overlay>
            <Panel title="PAUSA" className="w-72">
              <Menu
                active={!confirm}
                onBack={() => setMode("play")}
                items={[
                  { label: "Continuar" }, { label: "Caderno" }, { label: "Como jogar" }, { label: "Salvar jogo" },
                  { label: `Som: ${sound ? "ligado" : "desligado"}` }, { label: "Reiniciar missão" }, { label: "Menu inicial" },
                ]}
                onSelect={(i) => {
                  if (i === 0) setMode("play");
                  else if (i === 1) setMode("notebook");
                  else if (i === 2) { helpReturn.current = "pause"; setMode("help"); }
                  else if (i === 3) { save(); showToast("Jogo salvo!"); }
                  else if (i === 4) setSound(!sound);
                  else if (i === 5) setConfirm("reset");
                  else setConfirm("menu");
                }}
              />
            </Panel>
            {confirm && (
              <Confirm
                text={confirm === "reset" ? "Isso apaga todo o progresso salvo e recomeça a missão." : "Voltar ao menu inicial? O progresso fica salvo."}
                onNo={() => setConfirm(null)}
                onYes={() => {
                  const c = confirm;
                  setConfirm(null);
                  if (c === "reset") { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } newGame(); }
                  else { save(); setMode("start"); }
                }}
              />
            )}
          </Overlay>
        )}

        {mode === "ending" && (
          <Overlay>
            <div className="title-card max-w-xl">
              <div className="badge-seal font-pixel" aria-hidden>✓</div>
              <p className="font-pixel text-xs text-sun">MISSÃO CONCLUÍDA</p>
              <h2 className="font-pixel my-2 text-2xl text-panel-foreground">A INSCRIÇÃO</h2>
              <p className="font-game text-xl text-panel-foreground">Você deu o primeiro passo rumo ao Instituto! Formulário entregue, documentos em ordem e 25% dominados.</p>
              <p className="font-game mt-2 text-lg text-sun">Recompensa: Selo "Inscrito com Louvor Burocrático" + um carimbo invisível na testa.</p>
              <p className="font-game mt-3 text-lg text-muted-foreground">Próximo episódio: <b className="text-panel-foreground">A Preparação Lendária</b> — em breve.</p>
              <div className="mx-auto mt-4 w-64">
                <Menu items={[{ label: "Explorar livremente" }, { label: "Abrir caderno" }, { label: "Menu inicial" }]}
                  onSelect={(i) => setMode(i === 0 ? "play" : i === 1 ? "notebook" : "start")} />
              </div>
            </div>
          </Overlay>
        )}
      </div>
    </div>
  );
}