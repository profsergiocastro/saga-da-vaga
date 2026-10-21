import { useEffect, useRef, useState } from "react";
import { drawChar, type Look } from "./render";

const CW = 720;
const CH = 480;
const GROUND = 402;
const PLAYER_W = 32;
const PLAYER_H = 46;
const WORLD_W = 2920;
const BLOCK = 36;

export const PLATFORM_FACTS = [
  { id: "public", x: 360, y: 252, text: "O IFPI é uma instituição pública federal de educação profissional e tecnológica.", short: "IFPI PÚBLICO" },
  { id: "courses", x: 720, y: 248, text: "Institutos Federais oferecem cursos técnicos, graduação e formação profissional.", short: "CURSOS" },
  { id: "campus", x: 1110, y: 252, text: "O Campus São Raimundo Nonato fica no Piauí, no coração do semiárido.", short: "CAMPUS SRN" },
  { id: "teaching", x: 1500, y: 246, text: "Na Licenciatura em Matemática, você estuda matemática e aprende a ensiná-la.", short: "LICENCIATURA" },
  { id: "tripod", x: 1930, y: 252, text: "Ensino, pesquisa e extensão são pilares importantes da vida nos Institutos Federais.", short: "ENSINO + PESQUISA" },
  { id: "spaces", x: 2340, y: 246, text: "Biblioteca, salas e laboratórios: aqui o conhecimento sai do papel e ganha prática.", short: "ESPAÇOS IFPI" },
] as const;

export const PLATFORM_HAZARDS = [
  { id: "cat1", x: 510, w: 40, h: 28, kind: "cat" as const, line: "Você parou para fazer carinho no gatinho. Fofo, mas o horário da aula não espera!" },
  { id: "student1", x: 870, w: 32, h: 46, kind: "student" as const, line: "Quase bateu em um colega carregando uma pilha de trabalhos. Olhe por onde anda, calouro!" },
  { id: "books1", x: 1050, w: 45, h: 30, kind: "books" as const, line: "Uma pilha de processos acadêmicos apareceu no caminho. Nem tudo se resolve com um carimbo!" },
  { id: "cat2", x: 1320, w: 40, h: 28, kind: "cat" as const, line: "O gato do campus venceu a batalha da atencao. Um carinho rapido virou atraso!" },
  { id: "student2", x: 1630, w: 32, h: 46, kind: "student" as const, line: "Desvio de corredor! Um colega vinha lendo o edital enquanto caminhava." },
  { id: "cat3", x: 1850, w: 40, h: 28, kind: "cat" as const, line: "Mais um fiscal felino da frequencia. Gatinhos nao aceitam justificativa de atraso." },
  { id: "books2", x: 2110, w: 45, h: 30, kind: "books" as const, line: "Cuidado com os livros! Eles ajudam a passar, mas nao precisam virar obstaculo." },
  { id: "student3", x: 2510, w: 32, h: 46, kind: "student" as const, line: "Ultimo corredor, ultimo colega com pressa. Pule com cuidado e siga para pegar seu uniforme!" },
];

export type PlatformRun = {
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  hearts: number;
  checkpoint: number;
  hitFacts: string[];
  factMessage: string | null;
  factTimer: number;
  hitCooldown: number;
  cleared: boolean;
  failed: boolean;
};

export type PlatformInput = { left?: boolean; right?: boolean; jump?: boolean };

export function createPlatformRun(): PlatformRun {
  return {
    x: 54, y: GROUND - PLAYER_H, vy: 0, grounded: true, hearts: 3,
    checkpoint: 54, hitFacts: [], factMessage: null, factTimer: 0,
    hitCooldown: 0, cleared: false, failed: false,
  };
}

export function registerFactHit(run: PlatformRun, id: string): PlatformRun {
  const fact = PLATFORM_FACTS.find((entry) => entry.id === id);
  if (!fact || run.hitFacts.includes(id)) return run;
  return { ...run, hitFacts: [...run.hitFacts, id], factMessage: fact.text, factTimer: 5 };
}

export function stepPlatform(run: PlatformRun, dt: number, input: PlatformInput): PlatformRun {
  if (run.cleared || run.failed) return run;
  const s: PlatformRun = { ...run, factTimer: Math.max(0, run.factTimer - dt), hitCooldown: Math.max(0, run.hitCooldown - dt) };
  if (s.factTimer === 0) s.factMessage = null;

  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  s.x = Math.max(0, Math.min(WORLD_W - PLAYER_W, s.x + direction * 238 * dt));

  const oldY = s.y;
  if (input.jump && s.grounded) {
    s.vy = -590;
    s.grounded = false;
  }
  s.vy += 1480 * dt;
  s.y += s.vy * dt;

  if (s.y + PLAYER_H >= GROUND) {
    s.y = GROUND - PLAYER_H;
    s.vy = 0;
    s.grounded = true;
  }

  // Hitting a question brick from below reveals an IFPI fact once per block.
  if (s.vy < 0) {
    for (const fact of PLATFORM_FACTS) {
      const overlappingX = s.x + PLAYER_W > fact.x && s.x < fact.x + BLOCK;
      const brickBottom = fact.y + BLOCK;
      if (overlappingX && oldY >= brickBottom && s.y <= brickBottom) {
        s.y = brickBottom;
        s.vy = 140;
        s.grounded = false;
        Object.assign(s, registerFactHit(s, fact.id));
        break;
      }
    }
  }

  // Checkpoints keep a missed jump from sending the player all the way back.
  for (const checkpoint of [790, 1540, 2240]) {
    if (s.x >= checkpoint && s.checkpoint < checkpoint) s.checkpoint = checkpoint;
  }

  if (s.hitCooldown <= 0) {
    for (const hazard of PLATFORM_HAZARDS) {
      const hy = GROUND - hazard.h;
      const overlap = s.x + PLAYER_W > hazard.x && s.x < hazard.x + hazard.w &&
        s.y + PLAYER_H > hy && s.y < GROUND;
      if (!overlap) continue;
      // Landing on a hazard from above is a clean bounce, not a hit.
      if (s.vy > 0 && oldY + PLAYER_H <= hy + 9) {
        s.y = hy - PLAYER_H;
        s.vy = -360;
        s.grounded = false;
        break;
      }
      s.hearts -= 1;
      s.hitCooldown = 1.25;
      s.x = s.checkpoint;
      s.y = GROUND - PLAYER_H;
      s.vy = 0;
      s.grounded = true;
      s.factMessage = hazard.line;
      s.factTimer = 3.6;
      if (s.hearts <= 0) s.failed = true;
      break;
    }
  }

  if (s.x >= WORLD_W - 100) s.cleared = true;
  return s;
}

const STUDENT_LOOKS: Look[] = [
  { skin: "#b77c53", hair: "#221813", shirt: "#e9e7db", pants: "#315844", pack: "#36835b" },
  { skin: "#e0b08a", hair: "#34251c", shirt: "#78b9a0", pants: "#394f7d", pack: "#e8b64f" },
  { skin: "#8d5a3b", hair: "#171312", shirt: "#f3c85b", pants: "#504050", pack: "#bf5847" },
];
const PLAYER_LOOK: Look = { skin: "#c68a5b", hair: "#1e1410", shirt: "#2f80c4", pants: "#2b2f4a", pack: "#e0503a" };

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  ctx.fillStyle = "#e9e3d3"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#bcb6a6"; ctx.fillRect(x, y + h - 12, w, 12);
  ctx.fillStyle = "#347553"; ctx.fillRect(x, y, w, 9);
  ctx.fillStyle = "#fff7e5"; ctx.fillRect(x + 12, y + 13, w - 24, 4);
  for (let wx = x + 16; wx < x + w - 16; wx += 42) {
    ctx.fillStyle = "#3d7e91"; ctx.fillRect(wx, y + 28, 24, 29);
    ctx.fillStyle = "#9ad4dd"; ctx.fillRect(wx + 3, y + 31, 8, 10);
    ctx.fillStyle = "#2e5e6c"; ctx.fillRect(wx + 11, y + 28, 2, 29);
    ctx.fillRect(wx, y + 41, 24, 2);
  }
  ctx.fillStyle = "#285f43"; ctx.fillRect(x + 15, y + h - 32, 31, 32);
  ctx.fillStyle = "#b4d6ba"; ctx.fillRect(x + 20, y + h - 28, 5, 23);
  ctx.fillStyle = "#d2e7d2"; ctx.fillRect(x + w - 13, y + 14 + Math.sin(t * 2) * 2, 4, 4);
}

function drawCat(ctx: CanvasRenderingContext2D, x: number, t: number, worldX: number) {
  const y = GROUND - 29 + Math.sin(t * 5 + x) * 1.5;
  const fur = Math.floor(worldX / 50) % 2 === 0 ? "#f5eee0" : "#d7a16c";
  ctx.fillStyle = "#5a3a2a"; ctx.fillRect(x + 6, y + 9, 30, 17);
  ctx.fillStyle = fur; ctx.fillRect(x + 7, y + 7, 27, 17);
  ctx.fillRect(x + 1, y + 3, 18, 16);
  ctx.fillStyle = fur; ctx.fillRect(x + 2, y - 1, 6, 8); ctx.fillRect(x + 12, y - 1, 6, 8);
  ctx.fillStyle = "#eaa6a2"; ctx.fillRect(x + 4, y + 1, 2, 4); ctx.fillRect(x + 14, y + 1, 2, 4);
  ctx.fillStyle = "#282222"; ctx.fillRect(x + 5, y + 8, 3, 3); ctx.fillRect(x + 13, y + 8, 3, 3);
  ctx.fillStyle = "#d77c83"; ctx.fillRect(x + 9, y + 13, 4, 3);
  ctx.fillStyle = "#fff"; ctx.fillRect(x + 4, y + 8, 1, 1); ctx.fillRect(x + 12, y + 8, 1, 1);
  ctx.fillStyle = fur; ctx.fillRect(x + 11, y + 20, 8, 6); ctx.fillRect(x + 25, y + 20, 7, 6);
  ctx.fillStyle = "#76503b"; ctx.fillRect(x + 34, y + 11, 9, 3); ctx.fillRect(x + 40, y + 4, 3, 10);
  ctx.fillStyle = "#fff4df"; ctx.fillRect(x + 10, y + 14, 1, 1);
}

function drawBooks(ctx: CanvasRenderingContext2D, x: number) {
  const y = GROUND - 30;
  const colors = ["#3e8a68", "#e9bf52", "#bd6552"];
  colors.forEach((color, i) => {
    ctx.fillStyle = "#49372d"; ctx.fillRect(x + i * 4, y + i * 8, 37 - i * 5, 8);
    ctx.fillStyle = color; ctx.fillRect(x + i * 4 + 2, y + i * 8 + 1, 33 - i * 5, 5);
    ctx.fillStyle = "#f9e7ad"; ctx.fillRect(x + i * 4 + 5, y + i * 8 + 3, 21 - i * 3, 1);
  });
}

function drawStudent(ctx: CanvasRenderingContext2D, x: number, t: number, index: number) {
  const look = STUDENT_LOOKS[index % STUDENT_LOOKS.length]!;
  ctx.save();
  ctx.translate(x, GROUND - 44);
  ctx.scale(1.85, 1.85);
  drawChar(ctx, 0, 8 + Math.sin(t * 5 + index) * 0.6, look, "left", Math.floor(t * 5) % 4, 0);
  // A conspicuous armful of papers makes the corridor traffic hazard readable.
  ctx.fillStyle = "#fff8e8"; ctx.fillRect(12, 12, 8, 11);
  ctx.fillStyle = "#c8c0ad"; ctx.fillRect(13, 14, 6, 1); ctx.fillRect(13, 17, 5, 1); ctx.fillRect(13, 20, 6, 1);
  ctx.restore();
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, factId: string, hit: boolean) {
  ctx.fillStyle = "#4a3322"; ctx.fillRect(x - 2, y - 2, BLOCK + 4, BLOCK + 4);
  ctx.fillStyle = hit ? "#588968" : "#efb941"; ctx.fillRect(x, y, BLOCK, BLOCK);
  ctx.fillStyle = hit ? "#3e6d4e" : "#c7822d"; ctx.fillRect(x, y + BLOCK - 5, BLOCK, 5);
  ctx.fillStyle = hit ? "#b7d9ad" : "#ffe8a1";
  ctx.fillRect(x + 3, y + 3, BLOCK - 6, 3); ctx.fillRect(x + 3, y + 3, 3, BLOCK - 6);
  ctx.fillStyle = hit ? "#345f45" : "#5a3b22"; ctx.font = "bold 25px monospace"; ctx.textAlign = "center";
  ctx.fillText(hit ? "✓" : "?", x + BLOCK / 2, y + 26);
  ctx.fillStyle = "#fff4c9"; ctx.fillRect(x + 8, y + BLOCK + 2, 20, 2);
  ctx.textAlign = "left";
  void factId;
}

function drawLevel(ctx: CanvasRenderingContext2D, s: PlatformRun, time: number) {
  const camera = Math.max(0, Math.min(WORLD_W - CW, s.x - 210));
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#76c6e5"); sky.addColorStop(1, "#e4f2dd");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, CH);

  // Serra and trees in the distance, with parallax.
  ctx.fillStyle = "#91cbb3";
  for (let i = -1; i < 6; i++) {
    const hx = i * 230 - (camera * 0.18) % 230;
    ctx.beginPath(); ctx.moveTo(hx, 320); ctx.lineTo(hx + 120, 205 + (i % 2) * 18); ctx.lineTo(hx + 260, 320); ctx.fill();
  }
  ctx.fillStyle = "#5da27b";
  for (let i = -1; i < 10; i++) {
    const tx = i * 105 - (camera * 0.35) % 105;
    ctx.fillRect(tx + 14, 285, 8, 70);
    ctx.fillRect(tx, 265, 36, 30); ctx.fillRect(tx + 7, 252, 23, 15);
  }

  // Academic buildings and campus furniture scroll by behind the route.
  for (let bx = -((camera * 0.7) % 540) - 120; bx < CW + 600; bx += 540) {
    drawBuilding(ctx, bx, 115, 410, 215, time);
    ctx.fillStyle = "#2e6c4e"; ctx.fillRect(bx + 65, 88, 280, 24);
    ctx.fillStyle = "#f8f3df"; ctx.font = "bold 12px monospace"; ctx.fillText("INSTITUTO FEDERAL", bx + 79, 104);
    ctx.fillStyle = "#2e6c4e"; ctx.fillRect(bx + 60, 333, 292, 5);
  }

  // Campus lane.
  ctx.fillStyle = "#438d57"; ctx.fillRect(0, GROUND - 12, CW, 12);
  ctx.fillStyle = "#66b95c"; ctx.fillRect(0, GROUND - 12, CW, 4);
  ctx.fillStyle = "#cdbd98"; ctx.fillRect(0, GROUND, CW, CH - GROUND);
  ctx.fillStyle = "#b6a784";
  for (let x = -((camera * 1.2) % 68); x < CW; x += 68) {
    ctx.fillRect(x + 3, GROUND + 20, 62, 3);
    ctx.fillRect(x + 23, GROUND + 55, 42, 2);
  }
  ctx.fillStyle = "#e4d5b2";
  for (let x = -((camera * 1.2) % 136); x < CW; x += 136) ctx.fillRect(x, GROUND + 8, 2, 64);

  // Bricks containing small IFPI lessons.
  for (const fact of PLATFORM_FACTS) {
    const x = fact.x - camera;
    if (x < -BLOCK || x > CW) continue;
    drawBlock(ctx, x, fact.y, fact.id, s.hitFacts.includes(fact.id));
  }

  // Markers and hazards.
  for (const checkpoint of [790, 1540, 2240]) {
    const x = checkpoint - camera;
    if (x > -25 && x < CW) {
      ctx.fillStyle = "#3b3227"; ctx.fillRect(x, GROUND - 60, 4, 60);
      ctx.fillStyle = s.checkpoint >= checkpoint ? "#f2c94c" : "#7eb99a";
      ctx.fillRect(x + 4, GROUND - 60, 29, 20);
      ctx.fillStyle = "#285f43"; ctx.fillRect(x + 4, GROUND - 40, 15, 3);
    }
  }
  for (let i = 0; i < PLATFORM_HAZARDS.length; i++) {
    const h = PLATFORM_HAZARDS[i]!;
    const x = h.x - camera;
    if (x < -60 || x > CW + 60) continue;
    if (h.kind === "cat") drawCat(ctx, x, time, h.x);
    else if (h.kind === "student") drawStudent(ctx, x, time, i);
    else drawBooks(ctx, x);
  }

  // Arrival gate and campus sign.
  const gx = WORLD_W - 100 - camera;
  ctx.fillStyle = "#344d3b"; ctx.fillRect(gx, GROUND - 114, 12, 114); ctx.fillRect(gx + 78, GROUND - 114, 12, 114);
  ctx.fillStyle = "#267148"; ctx.fillRect(gx + 12, GROUND - 108, 66, 9); ctx.fillRect(gx + 12, GROUND - 18, 66, 9);
  ctx.fillStyle = "#f5f0df"; ctx.fillRect(gx + 17, GROUND - 90, 56, 53);
  ctx.fillStyle = "#236742"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
  ctx.fillText("IFPI", gx + 45, GROUND - 70); ctx.fillText("CALOURO", gx + 45, GROUND - 54);
  ctx.textAlign = "left";
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 0 ? "#fff7df" : "#337a4e";
    ctx.fillRect(gx + 25 + i * 11, GROUND - 32, 7, 7);
  }

  // Player: original pixel-art character, kept in the same palette as the exploration scene.
  ctx.save();
  ctx.scale(2, 2);
  const look = s.cleared ? { ...PLAYER_LOOK, shirt: "#f8f7ed", trim: "#25804c" } as Look : PLAYER_LOOK;
  drawChar(ctx, s.x / 2, s.y / 2 + 8, look, "right", Math.floor(time * 8) % 4, s.grounded ? 0 : -1);
  ctx.restore();

  // HUD progress line is drawn into the canvas so it follows the scrolling level.
  ctx.fillStyle = "rgba(22,47,37,0.88)"; ctx.fillRect(0, 0, CW, 52);
  ctx.fillStyle = "#fff7e5"; ctx.font = "bold 18px monospace"; ctx.fillText("ROTA DO CALOURO", 18, 24);
  ctx.font = "13px monospace"; ctx.fillStyle = "#c8e7d0"; ctx.fillText("SEGURE → / D  •  PULE COM ESPAÇO / ↑", 18, 43);
  ctx.fillStyle = "#f6ce67"; ctx.fillText("BLOCOS: " + s.hitFacts.length + "/" + PLATFORM_FACTS.length, CW - 155, 24);
  ctx.fillStyle = "#fff1d1"; ctx.fillText("♥".repeat(Math.max(0, s.hearts)), CW - 155, 43);
  ctx.fillStyle = "#d7e7cf"; ctx.fillRect(18, 61, 168, 6);
  ctx.fillStyle = "#57a36d"; ctx.fillRect(18, 61, 168 * Math.min(1, s.x / (WORLD_W - 100)), 6);
}

export function PlatformLevel({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<PlatformRun>(createPlatformRun());
  const heldRef = useRef(new Set<string>());
  const jumpRef = useRef(false);
  const [hud, setHud] = useState({ hearts: 3, factMessage: null as string | null, hitFacts: 0, cleared: false, failed: false });
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowright", "arrowleft", "arrowup", " ", "a", "d", "w"].includes(k)) e.preventDefault();
      if (["arrowright", "d"].includes(k)) heldRef.current.add("right");
      if (["arrowleft", "a"].includes(k)) heldRef.current.add("left");
      if (["arrowup", "w", " "].includes(k) && !e.repeat) jumpRef.current = true;
      if (["arrowright", "arrowleft", "arrowup", " ", "a", "d", "w"].includes(k)) setControlsVisible(false);
      if (runRef.current.failed && (k === "enter" || k === " ")) {
        runRef.current = createPlatformRun();
        heldRef.current.clear();
        jumpRef.current = false;
        setHud({ hearts: 3, factMessage: null, hitFacts: 0, cleared: false, failed: false });
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowright", "d"].includes(k)) heldRef.current.delete("right");
      if (["arrowleft", "a"].includes(k)) heldRef.current.delete("left");
    };
    const blur = () => heldRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let previousFact: string | null = null;
    let previousHearts = 3;
    let previousHitFacts = 0;
    let previousCleared = false;
    let previousFailed = false;

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      time += dt;
      const before = runRef.current;
      const state = stepPlatform(before, dt, {
        left: heldRef.current.has("left"),
        right: heldRef.current.has("right"),
        jump: jumpRef.current,
      });
      jumpRef.current = false;
      runRef.current = state;
      drawLevel(ctx, state, time);
      if (state.factMessage !== previousFact || state.hearts !== previousHearts ||
        state.hitFacts.length !== previousHitFacts || state.cleared !== previousCleared || state.failed !== previousFailed) {
        setHud({ hearts: state.hearts, factMessage: state.factMessage, hitFacts: state.hitFacts.length, cleared: state.cleared, failed: state.failed });
        previousFact = state.factMessage;
        previousHearts = state.hearts;
        previousHitFacts = state.hitFacts.length;
        previousCleared = state.cleared;
        previousFailed = state.failed;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setHold = (key: "left" | "right", on: boolean) => {
    if (on) { heldRef.current.add(key); setControlsVisible(false); }
    else heldRef.current.delete(key);
  };
  const jump = () => { jumpRef.current = true; setControlsVisible(false); };

  return (
    <section className="platform-stage" aria-label="Fase de plataforma Rota do Calouro">
      <canvas ref={canvasRef} width={CW} height={CH} className="platform-canvas" aria-label="Jogo de plataforma pelo campus do IFPI" />
      {hud.factMessage && !hud.cleared && !hud.failed && (
        <div className="platform-fact" role="status">
          <span className="platform-fact-label">{PLATFORM_FACTS.some((fact) => fact.text === hud.factMessage) ? "FATO DESBLOQUEADO" : "ALERTA DO CAMPUS"}</span>
          {hud.factMessage}
        </div>
      )}
      {controlsVisible && (
        <div className="platform-start-hint">O portão abriu! Agora começa a Rota do Calouro. Salte gatos, colegas e pilhas de processos; bata a cabeça nos blocos dourados para aprender sobre o IFPI.</div>
      )}
      <div className="platform-touch-controls">
        <button type="button" aria-label="Mover para esquerda" onPointerDown={() => setHold("left", true)} onPointerUp={() => setHold("left", false)} onPointerLeave={() => setHold("left", false)} onPointerCancel={() => setHold("left", false)}>◀</button>
        <button type="button" aria-label="Mover para direita" onPointerDown={() => setHold("right", true)} onPointerUp={() => setHold("right", false)} onPointerLeave={() => setHold("right", false)} onPointerCancel={() => setHold("right", false)}>▶</button>
        <button type="button" className="platform-jump-button" aria-label="Pular" onPointerDown={jump}>PULAR ↑</button>
      </div>
      {hud.failed && (
        <div className="platform-modal">
          <div className="platform-reward-card">
            <p className="platform-kicker">ATRASO ACADÊMICO CRÍTICO</p>
            <h2>Você perdeu o horário!</h2>
            <p>O gatinho distraiu, o colega cruzou o corredor e os processos venceram por W.O. Respire fundo: o campus continua aqui.</p>
            <button type="button" onClick={() => {
              runRef.current = createPlatformRun();
              heldRef.current.clear(); jumpRef.current = false;
              setHud({ hearts: 3, factMessage: null, hitFacts: 0, cleared: false, failed: false });
              setControlsVisible(true);
            }}>Tentar novamente [ENTER]</button>
          </div>
        </div>
      )}
      {hud.cleared && (
        <div className="platform-modal">
          <div className="platform-reward-card">
            <p className="platform-kicker">FASE CONCLUÍDA • ROTA DO CALOURO</p>
            <div className="uniform-preview" aria-hidden="true"><span className="uniform-collar" /><span className="uniform-emblem">IF</span><span className="uniform-stripe" /></div>
            <h2>UNIFORME DESBLOQUEADO!</h2>
            <p>Você atravessou o corredor sem transformar os gatinhos em inimigos, desviou do trânsito estudantil e aprendeu {hud.hitFacts} fato(s) sobre o IFPI.</p>
            <p className="uniform-caption">Camisa branca • detalhes verdes • dignidade acadêmica +10</p>
            <button type="button" onClick={onComplete}>Vestir a camisa do IFPI e entrar no campus</button>
          </div>
        </div>
      )}
    </section>
  );
}
