import { BUILDINGS, FLAG_POS, GATE, H, T, TS, W, hash, type Building, type World } from "./world";

type C = CanvasRenderingContext2D;
const px = (c: C, col: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};
const O = "#2a1d1a";

function speckle(c: C, tx: number, ty: number, base: string, cols: string[], n: number, tall = 1) {
  const X = tx * TS, Y = ty * TS;
  px(c, base, X, Y, TS, TS);
  for (let i = 0; i < n; i++) {
    const col = cols[Math.floor(hash(tx, ty, i + 3) * cols.length)] ?? base;
    px(c, col, X + Math.floor(hash(tx, ty, i + 40) * 15), Y + Math.floor(hash(tx, ty, i + 80) * 15), 1, tall);
  }
}

function ground(c: C, t: number, tx: number, ty: number) {
  const X = tx * TS, Y = ty * TS;
  switch (t) {
    case T.GRASS: speckle(c, tx, ty, "#8fb04a", ["#a6c45a", "#6f9337", "#7fa03f"], 9, 2); break;
    case T.DRY: speckle(c, tx, ty, "#c4ad62", ["#d6c27a", "#a8924a", "#b59d52"], 8, 2); break;
    case T.ROAD: speckle(c, tx, ty, "#d49a56", ["#b8803f", "#e7b977", "#c68b48"], 7); break;
    case T.WALK:
      px(c, "#ddd0b3", X, Y, TS, TS);
      px(c, "#ece2c9", X, Y, TS, 1); px(c, "#ece2c9", X, Y + 8, TS, 1);
      px(c, "#c2b08e", X, Y + 7, TS, 1); px(c, "#c2b08e", X, Y + 15, TS, 1);
      px(c, "#c2b08e", X + 7, Y, 1, 7); px(c, "#c2b08e", X + 15, Y + 8, 1, 7);
      break;
    case T.PLAZA:
      px(c, "#ece4cf", X, Y, TS, TS);
      for (let i = 0; i < TS; i++) {
        const yy = Math.round(Math.sin(((X + i) / 16) * Math.PI) * 3);
        px(c, "#5d5246", X + i, Y + 7 + yy, 1, 2);
      }
      break;
    case T.CAMPUS:
      px(c, "#cfc8b6", X, Y, TS, TS);
      px(c, "#b3aa95", X, Y + 7, TS, 1); px(c, "#b3aa95", X, Y + 15, TS, 1);
      px(c, "#b3aa95", X + (ty % 2 ? 3 : 11), Y, 1, 7); px(c, "#b3aa95", X + (ty % 2 ? 11 : 3), Y + 8, 1, 7);
      px(c, "#dcd6c6", X + 1, Y + 1, 5, 1);
      break;
  }
}

function groundFor(t: number, tx: number): number {
  if (t === T.CACTUS || t === T.ROCK) return T.DRY;
  if (t === T.POLE || t === T.MOTO) return T.WALK;
  if (t === T.FLAG) return T.CAMPUS;
  if (t === T.BENCH) return tx >= 26 ? T.CAMPUS : T.PLAZA;
  return T.GRASS;
}

function drawTile(c: C, t: number, tx: number, ty: number) {
  const X = tx * TS, Y = ty * TS;
  if (t <= T.CAMPUS) return ground(c, t, tx, ty);
  if (t === T.BUILDING) return;
  if (t === T.WALL) {
    px(c, "#f1ead8", X, Y, TS, TS);
    px(c, "#ffffff", X, Y, TS, 2);
    px(c, "#d8cfb8", X, Y + 2, TS, 1);
    px(c, "#2e7d5b", X, Y + 9, TS, 7);
    px(c, "#3f9a70", X, Y + 9, TS, 1);
    px(c, "#1f5a41", X, Y + 15, TS, 1);
    px(c, "#d8cfb8", X + (tx % 2 ? 4 : 12), Y + 3, 1, 6);
    return;
  }
  ground(c, groundFor(t, tx), tx, ty);
  switch (t) {
    case T.TREE: {
      px(c, "rgba(0,0,0,0.22)", X + 2, Y + 12, 12, 3);
      px(c, "#6b4423", X + 7, Y + 9, 2, 6); px(c, "#4e2f17", X + 8, Y + 9, 1, 6);
      px(c, "#2d5a20", X + 2, Y + 3, 12, 8); px(c, "#2d5a20", X + 1, Y + 5, 14, 4);
      px(c, "#3f7a2c", X + 2, Y + 2, 12, 7); px(c, "#3f7a2c", X + 1, Y + 4, 14, 3); px(c, "#3f7a2c", X + 4, Y + 1, 8, 1);
      px(c, "#5e9a3a", X + 4, Y + 2, 6, 3); px(c, "#5e9a3a", X + 3, Y + 4, 3, 2);
      px(c, "#86c04f", X + 5, Y + 2, 2, 1); px(c, "#86c04f", X + 10, Y + 3, 2, 1); px(c, "#86c04f", X + 4, Y + 5, 1, 1);
      if (hash(tx, ty, 9) > 0.6) { px(c, "#f2c14e", X + 11, Y + 6, 1, 1); px(c, "#f2c14e", X + 5, Y + 7, 1, 1); }
      break;
    }
    case T.CACTUS:
      px(c, "rgba(0,0,0,0.22)", X + 3, Y + 13, 11, 2);
      px(c, "#1d4a28", X + 6, Y + 1, 5, 14); px(c, "#2f6b3a", X + 7, Y + 1, 3, 14); px(c, "#4f9a55", X + 7, Y + 2, 1, 12);
      px(c, "#1d4a28", X + 2, Y + 4, 3, 7); px(c, "#2f6b3a", X + 3, Y + 4, 1, 6); px(c, "#1d4a28", X + 3, Y + 10, 4, 2);
      px(c, "#1d4a28", X + 12, Y + 3, 3, 6); px(c, "#2f6b3a", X + 12, Y + 3, 1, 5); px(c, "#1d4a28", X + 10, Y + 8, 3, 2);
      px(c, "#efe7a8", X + 8, Y + 4, 1, 1); px(c, "#efe7a8", X + 8, Y + 9, 1, 1); px(c, "#efe7a8", X + 3, Y + 6, 1, 1);
      px(c, "#f05a7e", X + 8, Y, 1, 1);
      break;
    case T.FLOWER: {
      const cols = ["#f05a7e", "#ffd23f", "#ffffff", "#ff8c42"];
      for (let i = 0; i < 4; i++) {
        const fx = X + 2 + Math.floor(hash(tx, ty, i + 100) * 11), fy = Y + 2 + Math.floor(hash(tx, ty, i + 200) * 10);
        px(c, "#4c7a2c", fx, fy + 2, 1, 2);
        const fc = cols[(i + tx) % 4] ?? "#fff"; px(c, fc, fx - 1, fy, 3, 1); px(c, fc, fx, fy - 1, 1, 3); px(c, "#ffe9a8", fx, fy, 1, 1);
      }
      break;
    }
    case T.BUSH:
      px(c, "rgba(0,0,0,0.2)", X + 2, Y + 12, 12, 3);
      px(c, "#2f6324", X + 2, Y + 5, 12, 9); px(c, "#4b8a32", X + 3, Y + 4, 10, 7); px(c, "#72b04a", X + 5, Y + 5, 3, 2);
      break;
    case T.BENCH:
      px(c, "rgba(0,0,0,0.2)", X + 1, Y + 12, 14, 2);
      px(c, "#4a3a2a", X + 2, Y + 9, 2, 5); px(c, "#4a3a2a", X + 12, Y + 9, 2, 5);
      px(c, "#8a5526", X + 1, Y + 3, 14, 3); px(c, "#a0672f", X + 1, Y + 7, 14, 3); px(c, "#c48a4a", X + 1, Y + 7, 14, 1);
      break;
    case T.FENCE:
      px(c, "#8a5526", X, Y + 6, TS, 2); px(c, "#8a5526", X, Y + 10, TS, 2);
      px(c, "#6b4423", X + 2, Y + 3, 2, 11); px(c, "#6b4423", X + 11, Y + 3, 2, 11);
      break;
    case T.ROCK:
      px(c, "rgba(0,0,0,0.2)", X + 2, Y + 12, 12, 3);
      px(c, "#6b6558", X + 3, Y + 6, 10, 7); px(c, "#8d8778", X + 4, Y + 5, 8, 6); px(c, "#b5ae9c", X + 5, Y + 6, 3, 2);
      break;
    case T.POLE:
      px(c, "rgba(0,0,0,0.2)", X + 6, Y + 13, 6, 2);
      px(c, "#5a5650", X + 7, Y - 12, 2, 26); px(c, "#8a857c", X + 7, Y - 12, 1, 26);
      px(c, "#5a4a3a", X + 2, Y - 10, 12, 2);
      px(c, "#cfe3ef", X + 3, Y - 12, 1, 2); px(c, "#cfe3ef", X + 12, Y - 12, 1, 2);
      break;
    case T.MOTO: drawMoto(c, X, Y + 1, false); break;
    case T.FLAG:
      px(c, "#5a5a5a", X + 7, Y + 12, 3, 3);
      px(c, "#9a9a9a", X + 8, Y - 18, 1, 31);
      break;
  }
}

export function drawMoto(c: C, X: number, Y: number, rider: boolean, flip = false) {
  const m = (dx: number) => (flip ? X + 15 - dx : X + dx);
  const r = (col: string, dx: number, dy: number, w = 1, h = 1) => px(c, col, flip ? X + 16 - dx - w : X + dx, Y + dy, w, h);
  void m;
  r("rgba(0,0,0,0.25)", 1, 13, 15, 2);
  r("#1e1e1e", 1, 9, 5, 5); r("#1e1e1e", 10, 9, 5, 5); r("#9a9a9a", 3, 11); r("#9a9a9a", 12, 11);
  r("#d7263d", 4, 7, 8, 3); r("#a01b2d", 4, 9, 8, 1); r("#2b2b2b", 5, 6, 4, 1);
  r("#9a9a9a", 11, 4, 1, 3); r("#ffd23f", 12, 6, 2, 1);
  if (rider) {
    r("#2b2f4a", 6, 3, 3, 4); r("#3d8a73", 5, -2, 4, 5); r("#c68a5b", 9, 0, 2, 1);
    r("#f2c14e", 5, -6, 4, 4); r("#ffffff", 6, -5, 2, 1);
  }
}

function drawBuilding(c: C, b: Building) {
  const X = b.x * TS, Y = b.y * TS, Wd = b.w * TS, Hd = b.h * TS;
  const roofH = (b.h - 2) * TS + 2;
  px(c, "rgba(0,0,0,0.2)", X + 4, Y + Hd, Wd - 2, 4);
  // roof
  px(c, b.roof, X, Y, Wd, roofH);
  for (let yy = Y + 4; yy < Y + roofH - 3; yy += 4) px(c, b.roofDark, X, yy, Wd, 1);
  for (let xx = X + 6; xx < X + Wd; xx += 8) for (let yy = Y + 4; yy < Y + roofH - 3; yy += 8) px(c, b.roofDark, xx, yy, 1, 4);
  px(c, "rgba(255,255,255,0.25)", X, Y, Wd, 2);
  px(c, b.roofDark, X - 1, Y + roofH - 3, Wd + 2, 3);
  // wall
  const wy = Y + roofH;
  px(c, b.wall, X, wy, Wd, Hd - roofH);
  px(c, b.trim, X, Y + Hd - 3, Wd, 3);
  px(c, "rgba(0,0,0,0.12)", X, wy, Wd, 2);
  for (let col = 0; col < b.w; col++) {
    const cx = X + col * TS;
    if (b.x + col === b.doorX) {
      px(c, "#3b2416", cx + 2, Y + Hd - 17, 12, 17); px(c, "#6b3e1f", cx + 3, Y + Hd - 16, 10, 16);
      px(c, "#83502a", cx + 4, Y + Hd - 15, 3, 13); px(c, "#ffd23f", cx + 11, Y + Hd - 8, 1, 1);
    } else if ((col + b.x) % 2 === 0) {
      px(c, "#3b2f2a", cx + 3, wy + 5, 10, 9); px(c, "#7ec8e3", cx + 4, wy + 6, 8, 7);
      px(c, "#d8f3ff", cx + 5, wy + 7, 2, 2); px(c, "#3b2f2a", cx + 8, wy + 6, 1, 7);
    }
  }
  if (b.awning) {
    for (let xx = 0; xx < Wd; xx += 4) px(c, (xx / 4) % 2 ? "#f5f0e1" : b.awning, X + xx, wy, 4, 5);
    for (let xx = 0; xx < Wd; xx += 4) px(c, (xx / 4) % 2 ? "#f5f0e1" : b.awning, X + xx + 1, wy + 5, 2, 1);
  }
  if (b.sign) {
    c.font = "bold 7px monospace";
    const tw = Math.ceil(c.measureText(b.sign).width) + 8;
    const sx = Math.round(X + Wd / 2 - tw / 2), sy = Y + roofH - 15;
    px(c, O, sx - 1, sy - 1, tw + 2, 12); px(c, b.signBg ?? "#fff", sx, sy, tw, 10);
    c.fillStyle = b.signFg ?? "#000"; c.textBaseline = "top";
    c.fillText(b.sign, sx + 4, sy + 2);
  }
}

function board(c: C, X: number, Y: number, w: number, bg: string, l1: string, l2: string, fg2: string) {
  px(c, "#4a3a2a", X + 6, Y + 14, 3, 8); px(c, "#4a3a2a", X + w - 9, Y + 14, 3, 8);
  px(c, "#f1ead8", X - 1, Y - 1, w + 2, 18); px(c, bg, X, Y, w, 16);
  c.font = "bold 6px monospace"; c.textBaseline = "top"; c.fillStyle = "#ffffff";
  c.fillText(l1, X + Math.round((w - c.measureText(l1).width) / 2), Y + 2);
  c.fillStyle = fg2;
  c.fillText(l2, X + Math.round((w - c.measureText(l2).width) / 2), Y + 9);
}

export function prerender(world: World): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W * TS; cv.height = H * TS;
  const c = cv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const t = world.tiles[ty * W + tx] ?? 0;
    if (t === T.BUILDING || t === T.SIGN) ground(c, T.GRASS, tx, ty);
  }
  for (const b of BUILDINGS) drawBuilding(c, b);
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const t = world.tiles[ty * W + tx] ?? 0;
    if (t !== T.BUILDING && t !== T.SIGN) drawTile(c, t, tx, ty);
  }
  board(c, 26 * TS + 2, 14 * TS - 6, 76, "#1f5a41", "INSTITUTO FEDERAL", "— CAMPUS SRN —", "#ffd23f");
  board(c, 35 * TS + 2, 14 * TS - 6, 76, "#c8553d", "INSCRIÇÕES", "ABERTAS!", "#fff3d6");
  // power lines
  const poles = [...world.poles].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < poles.length - 1; i++) {
    const [ax, ay] = poles[i]!, [bx] = poles[i + 1]!;
    for (const off of [3, 12]) {
      const x1 = ax * TS + off, x2 = bx * TS + off, y = ay * TS - 11;
      for (let x = x1; x <= x2; x++) {
        const k = (x - x1) / (x2 - x1);
        px(c, "#2b2b2b", x, Math.round(y + Math.sin(k * Math.PI) * 5), 1, 1);
      }
    }
  }
  return cv;
}

export type Dir = "up" | "down" | "left" | "right";
export type Look = {
  skin: string; hair: string; shirt: string; pants: string;
  pack?: string; cap?: string; apron?: string; tie?: string; glasses?: boolean; bun?: boolean; braids?: boolean; clipboard?: boolean;
};

export function drawChar(c: C, x: number, y: number, L: Look, dir: Dir, step: number, hb: number) {
  x = Math.round(x); y = Math.round(y);
  px(c, "rgba(0,0,0,0.28)", x + 3, y + 14, 10, 2);
  const lo = step === 1 ? -1 : 0, ro = step === 3 ? -1 : 0;
  // legs
  px(c, O, x + 4, y + 11 + lo, 4, 4 - lo); px(c, O, x + 8, y + 11 + ro, 4, 4 - ro);
  px(c, L.pants, x + 5, y + 11 + lo, 2, 3); px(c, L.pants, x + 9, y + 11 + ro, 2, 3);
  // back pack (behind when facing down)
  if (L.pack && dir !== "up") {
    const bx = dir === "left" ? x + 10 : dir === "right" ? x + 2 : -99;
    if (bx > -99) { px(c, O, bx - 1, y + 6, 6, 7); px(c, L.pack, bx, y + 7, 4, 5); }
  }
  // body + arms
  const sw = step === 1 ? 1 : step === 3 ? -1 : 0;
  px(c, O, x + 2, y + 6, 12, 6);
  px(c, L.shirt, x + 4, y + 7, 8, 4);
  px(c, L.shirt, x + 3, y + 7 + sw, 1, 3); px(c, L.shirt, x + 12, y + 7 - sw, 1, 3);
  px(c, L.skin, x + 3, y + 10 + sw, 1, 1); px(c, L.skin, x + 12, y + 10 - sw, 1, 1);
  px(c, "rgba(255,255,255,0.2)", x + 4, y + 7, 8, 1);
  if (L.apron && dir !== "up") px(c, L.apron, x + 5, y + 8, 6, 4);
  if (L.tie && dir === "down") { px(c, "#ffffff", x + 6, y + 7, 4, 1); px(c, L.tie, x + 7, y + 7, 2, 4); }
  if (L.pack) {
    if (dir === "up") { px(c, O, x + 3, y + 6, 10, 7); px(c, L.pack, x + 4, y + 7, 8, 5); px(c, "rgba(0,0,0,0.25)", x + 4, y + 9, 8, 1); px(c, "#ffd23f", x + 7, y + 10, 2, 1); }
    else if (dir === "down") { px(c, L.pack, x + 5, y + 7, 1, 4); px(c, L.pack, x + 10, y + 7, 1, 4); }
  }
  if (L.clipboard && dir !== "up") { px(c, "#8a5526", x + 11, y + 8, 4, 5); px(c, "#ffffff", x + 12, y + 9, 2, 3); }
  // head
  const hy = y + hb;
  if (L.bun) { px(c, O, x + 5, hy - 3, 6, 4); px(c, L.hair, x + 6, hy - 2, 4, 2); }
  px(c, O, x + 3, hy, 10, 7);
  px(c, L.skin, x + 4, hy + 1, 8, 5);
  if (L.braids && dir !== "up") { px(c, L.hair, x + 3, hy + 4, 1, 6); px(c, L.hair, x + 12, hy + 4, 1, 6); }
  const hair = L.cap ?? L.hair;
  if (dir === "up") { px(c, L.hair, x + 4, hy + 1, 8, 5); if (L.cap) px(c, L.cap, x + 4, hy, 8, 3); if (L.braids) { px(c, L.hair, x + 7, hy + 5, 2, 5); } }
  else {
    px(c, hair, x + 4, hy, 8, 2);
    if (dir === "down") {
      px(c, L.hair, x + 4, hy + 2, 1, 2); px(c, L.hair, x + 11, hy + 2, 1, 2);
      if (L.cap) px(c, L.cap, x + 4, hy + 2, 8, 1);
      px(c, O, x + 6, hy + 3, 1, 2); px(c, O, x + 9, hy + 3, 1, 2);
      px(c, "rgba(240,90,126,0.45)", x + 5, hy + 5, 1, 1); px(c, "rgba(240,90,126,0.45)", x + 10, hy + 5, 1, 1);
      if (L.glasses) { px(c, O, x + 5, hy + 3, 6, 1); px(c, "#cfeaff", x + 5, hy + 4, 2, 1); px(c, "#cfeaff", x + 9, hy + 4, 2, 1); }
    } else {
      const left = dir === "left";
      px(c, L.hair, left ? x + 8 : x + 4, hy + 2, 4, 3);
      if (L.cap) px(c, L.cap, left ? x + 2 : x + 10, hy + 2, 4, 1);
      px(c, O, left ? x + 5 : x + 10, hy + 3, 1, 2);
      if (L.glasses) px(c, O, left ? x + 4 : x + 9, hy + 3, 3, 1);
    }
  }
}

export function drawGate(c: C, open: boolean, ox: number, oy: number) {
  for (const [gx, gy] of GATE) {
    const X = gx * TS - ox, Y = gy * TS - oy;
    if (open) { px(c, "#5b5b66", X + (gx === 32 ? 0 : 14), Y - 6, 2, 22); continue; }
    px(c, "#3a3a44", X, Y - 4, TS, 2);
    for (let i = 1; i < TS; i += 3) px(c, "#5b5b66", X + i, Y - 4, 1, 19);
    px(c, "#ffd23f", X, Y + 6, TS, 3);
    for (let i = 0; i < TS; i += 4) px(c, "#2a1d1a", X + i, Y + 6, 2, 3);
  }
}

export function drawFlag(c: C, t: number, ox: number, oy: number) {
  const X = FLAG_POS[0] * TS + 9 - ox, Y = FLAG_POS[1] * TS - 18 - oy;
  for (let i = 0; i < 11; i++) {
    const w = Math.round(Math.sin(t * 5 + i * 0.7) * 1);
    px(c, "#2e7d5b", X + i, Y + w, 1, 7);
    px(c, "#f1ead8", X + i, Y + w + 3, 1, 1);
  }
}

export function drawMarker(c: C, x: number, y: number, t: number) {
  const b = Math.round(Math.sin(t * 6) * 1.5);
  x = Math.round(x); y = Math.round(y) + b;
  px(c, O, x + 6, y - 11, 4, 9);
  px(c, "#ffd23f", x + 7, y - 10, 2, 5);
  px(c, "#ffd23f", x + 7, y - 4, 2, 1);
}