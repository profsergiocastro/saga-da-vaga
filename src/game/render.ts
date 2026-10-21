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
    case T.GRASS:
      speckle(c, tx, ty, "#83a94a", ["#a7c66a", "#71963c", "#8fb755", "#6c8e37"], 4, 1);
      if (hash(tx, ty, 191) > 0.5) {
        const gx = X + 3 + Math.floor(hash(tx, ty, 192) * 8);
        const gy = Y + 3 + Math.floor(hash(tx, ty, 193) * 8);
        px(c, "#6e963e", gx, gy, 1, 3);
        px(c, "#a8c96b", gx + 1, gy + 1, 2, 1);
      }
      if (hash(tx, ty, 194) > 0.72) {
        px(c, "#577c32", X + 3 + Math.floor(hash(tx, ty, 195) * 9), Y + 11, 3, 1);
      }
      if (hash(tx, ty, 196) > 0.91) { px(c, "#f1c75f", X + 11, Y + 4, 1, 1); px(c, "#f7e6a2", X + 10, Y + 5, 3, 1); }
      break;
    case T.DRY:
      speckle(c, tx, ty, "#cbb66f", ["#e0cc85", "#ae9853", "#bba45d", "#d4bf79"], 4, 1);
      if (hash(tx, ty, 197) > 0.7) { px(c, "#a58d49", X + 3, Y + 12, 4, 1); px(c, "#e7d293", X + 4, Y + 11, 2, 1); }
      break;
    case T.ROAD:
      speckle(c, tx, ty, "#858b84", ["#92988f", "#737b75", "#9b9d91", "#777e79"], 3, 1);
      px(c, "#737b75", X, Y, TS, 1);
      px(c, "#a3a398", X, Y + 15, TS, 1);
      if (ty === 12 && (tx % 5 === 1 || tx % 5 === 2) && (tx < 18 || tx > 23)) {
        px(c, "#e9d88e", X + 4, Y + 6, 8, 2);
        px(c, "#fff0b5", X + 5, Y + 6, 5, 1);
      }
      if (tx === 20 && ty >= 14 && ty % 4 < 2) {
        px(c, "#e9d88e", X + 7, Y + 4, 2, 7);
        px(c, "#fff0b5", X + 7, Y + 4, 1, 4);
      }
      break;
    case T.WALK: {
      const variant = Math.floor(hash(Math.floor(tx / 2), Math.floor(ty / 2), 31) * 3);
      const stone = ["#d6d1c3", "#ded8c8", "#cbc6b8"][variant] ?? "#d6d1c3";
      px(c, stone, X, Y, TS, TS);
      px(c, "#f0eadb", X, Y, TS, 1);
      px(c, "#b5ad9d", X, Y + 15, TS, 1);
      px(c, "#c3bcac", X, Y + 7, TS, 1);
      px(c, "#c3bcac", X + 7, Y, 1, 7);
      px(c, "#eee7d8", X + 1, Y + 1, 5, 1);
      if ((tx + ty) % 3 === 0) px(c, "#bdb4a2", X + 10, Y + 3, 3, 1);
      break;
    }
    case T.PLAZA: {
      // Pale worn rectangular pavers on a staggered grid, as seen in the current 360° view.
      const variant = Math.floor(hash(Math.floor(tx / 2), ty, 51) * 4);
      const stones = ["#d8d5cb", "#dfdace", "#d0cdc3", "#e5e0d5"];
      const stone = stones[variant] ?? "#d8d5cb";
      px(c, stone, X, Y, TS, TS);
      px(c, "#ece8de", X, Y, TS, 1);
      px(c, "#b7b3a9", X, Y + 15, TS, 1);
      if (tx % 2 === (ty % 2)) {
        px(c, "#c0bcb1", X + 15, Y, 1, TS);
        px(c, "#efebe1", X + 14, Y, 1, TS);
      }
      if (hash(tx, ty, 53) > 0.82) {
        px(c, "#c4bcaa", X + 9, Y + 6, 3, 1);
        px(c, "#b6b0a1", X + 10, Y + 7, 2, 1);
      }
      if (hash(tx, ty, 54) > 0.9) px(c, "#ede5d4", X + 3, Y + 10, 5, 1);
      break;
    }
    case T.CAMPUS:
      px(c, "#d3cebf", X, Y, TS, TS);
      px(c, "#e9e2d2", X, Y, TS, 1);
      px(c, "#b0a994", X, Y + 15, TS, 1);
      px(c, "#c1baa7", X, Y + 7, TS, 1);
      px(c, "#c1baa7", X + (ty % 2 ? 3 : 11), Y, 1, 7);
      px(c, "#c1baa7", X + (ty % 2 ? 11 : 3), Y + 8, 1, 7);
      px(c, "#f2eadb", X + 1, Y + 1, 5, 1);
      break;
  }
}

function groundFor(t: number, tx: number): number {
  if (t === T.CACTUS || t === T.ROCK || t === T.MON_ONCAS || t === T.MON_TATU) return T.DRY;
  if (t === T.POLE || t === T.MOTO) return T.WALK;
  if (t === T.FLAG) return T.CAMPUS;
  if (t === T.CLOCK) return T.PLAZA;
  if (t === T.MON_SERIEMA) return T.PLAZA;
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
      // Fuller multi-tone canopy with a dark silhouette, leaf clusters and a visible trunk.
      px(c, "rgba(38,37,25,0.26)", X + 1, Y + 12, 14, 4);
      px(c, "#5a3a24", X + 6, Y + 8, 4, 7);
      px(c, "#81512c", X + 7, Y + 8, 2, 6);
      px(c, "#243f21", X + 1, Y + 5, 14, 8);
      px(c, "#2a5225", X + 3, Y + 2, 10, 10);
      px(c, "#315f28", X + 1, Y + 4, 6, 7);
      px(c, "#315f28", X + 9, Y + 4, 6, 7);
      px(c, "#477c32", X + 3, Y + 2, 9, 7);
      px(c, "#538b38", X + 4, Y + 1, 7, 5);
      px(c, "#659b42", X + 3, Y + 3, 4, 3);
      px(c, "#6ca849", X + 7, Y + 2, 4, 3);
      px(c, "#8abf56", X + 5, Y + 2, 2, 1);
      px(c, "#8abf56", X + 10, Y + 4, 2, 1);
      px(c, "#3a6d2b", X + 2, Y + 8, 4, 2);
      px(c, "#3a6d2b", X + 10, Y + 7, 4, 2);
      px(c, "#a3cd64", X + 5, Y + 5, 2, 1);
      if (hash(tx, ty, 9) > 0.56) {
        px(c, "#f2c14e", X + 11, Y + 6, 2, 2);
        px(c, "#ffe38b", X + 11, Y + 6, 1, 1);
      }
      if (hash(tx, ty, 10) > 0.68) px(c, "#8fb755", X + 3, Y + 7, 2, 1);
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

export function drawMoto(c: C, X: number, Y: number, rider: boolean, flip = false, helmet = true) {
  const m = (dx: number) => (flip ? X + 15 - dx : X + dx);
  const r = (col: string, dx: number, dy: number, w = 1, h = 1) => px(c, col, flip ? X + 16 - dx - w : X + dx, Y + dy, w, h);
  void m;
  r("rgba(0,0,0,0.25)", 1, 13, 15, 2);
  r("#1e1e1e", 1, 9, 5, 5); r("#1e1e1e", 10, 9, 5, 5); r("#9a9a9a", 3, 11); r("#9a9a9a", 12, 11);
  r("#d7263d", 4, 7, 8, 3); r("#a01b2d", 4, 9, 8, 1); r("#2b2b2b", 5, 6, 4, 1);
  r("#9a9a9a", 11, 4, 1, 3); r("#ffd23f", 12, 6, 2, 1);
  if (rider) {
    r("#2b2f4a", 6, 3, 3, 4); r("#3d8a73", 5, -2, 4, 5); r("#c68a5b", 9, 0, 2, 1);
    if (helmet) {
      r("#f2c14e", 5, -6, 4, 4); r("#ffffff", 6, -5, 2, 1);
    } else {
      // Helmetless rider shown as satire/warning, never as a recommended choice.
      r("#2a1d1a", 4, -6, 5, 4); r("#c68a5b", 5, -5, 4, 3);
      r("#2a1d1a", 5, -6, 3, 1);
    }
  }
}

function drawBuilding(c: C, b: Building) {
  const X = b.x * TS, Y = b.y * TS, Wd = b.w * TS, Hd = b.h * TS;
  const roofH = (b.h - 2) * TS + 2;
  // Deep cast shadow separates each facade from the ground and gives the scene a GBA-style depth cue.
  px(c, "rgba(39,31,24,0.24)", X + 5, Y + Hd - 1, Wd - 1, 5);
  px(c, O, X - 1, Y - 1, Wd + 2, roofH + (Hd - roofH) + 2);
  if (b.flatRoof) {
    // Campus buildings use a sober concrete parapet and flat slab, closer to the real IFPI blocks.
    px(c, "#aaa69b", X - 1, Y - 1, Wd + 2, roofH + 4);
    px(c, "#d8d4c8", X, Y, Wd, roofH);
    px(c, "#efede4", X + 1, Y + 1, Wd - 2, 3);
    px(c, "#c2beb2", X + 1, Y + 5, Wd - 2, 2);
    px(c, "#f7f4eb", X + 2, Y + 2, Wd - 4, 1);
    // Small roof vents hint at a working school campus.
    px(c, "#99958a", X + Wd - 12, Y + 9, 6, 7);
    px(c, "#b8b3a7", X + Wd - 11, Y + 10, 4, 5);
    px(c, "#89857b", X + Wd - 13, Y + 8, 8, 2);
    px(c, "#9d998e", X + 5, Y + 12, 8, 4);
    px(c, "#bcb8ac", X + 6, Y + 13, 6, 2);
    px(c, b.roofDark, X - 1, Y + roofH - 4, Wd + 2, 4);
    px(c, b.trim, X, Y + roofH - 4, Wd, 1);
  } else {
    // Traditional tile roofs remain on the local shops and houses.
    px(c, O, X - 1, Y - 1, Wd + 2, roofH + (Hd - roofH) + 2);
    px(c, b.roofDark, X, Y, Wd, roofH);
    px(c, b.roof, X + 1, Y + 1, Wd - 2, roofH - 4);
    for (let yy = Y + 4; yy < Y + roofH - 4; yy += 5) {
      px(c, b.roofDark, X + 1, yy, Wd - 2, 1);
      px(c, "rgba(255,220,174,0.26)", X + 1, yy + 1, Wd - 2, 1);
    }
    for (let row = 0, yy = Y + 3; yy < Y + roofH - 4; row++, yy += 8) {
      for (let col = 0, xx = X + (row % 2 ? 0 : 7); xx < X + Wd; col++, xx += 16) {
        px(c, b.roofDark, xx, yy, 1, 5);
        px(c, "rgba(255,231,190,0.28)", xx + 2, yy + 1, 5, 1);
        if ((col + row) % 3 === 0) px(c, "rgba(45,28,20,0.18)", xx + 7, yy + 3, 4, 1);
      }
    }
    px(c, "rgba(255,242,212,0.48)", X + 1, Y + 1, Wd - 2, 1);
    px(c, b.roofDark, X - 1, Y + roofH - 4, Wd + 2, 4);
    px(c, b.trim, X, Y + roofH - 4, Wd, 1);
  }
  // Stucco facade with a light/shadow edge and small masonry accents.
  const wy = Y + roofH;
  px(c, b.wall, X, wy, Wd, Hd - roofH);
  px(c, "rgba(255,255,230,0.3)", X + 1, wy + 1, Wd - 2, 2);
  px(c, "rgba(45,31,25,0.12)", X, wy, Wd, 2);
  for (let col = 0; col < b.w; col++) {
    const cx = X + col * TS;
    if (b.x + col === b.doorX) {
      // Door recess, lintel, planks, doorstep and brass handle.
      px(c, O, cx + 1, Y + Hd - 19, 14, 19);
      px(c, "#d8b78a", cx + 2, Y + Hd - 19, 12, 2);
      px(c, "#543522", cx + 3, Y + Hd - 17, 10, 16);
      px(c, "#80502e", cx + 4, Y + Hd - 16, 4, 14);
      px(c, "#6d4025", cx + 8, Y + Hd - 16, 4, 14);
      px(c, "#b77c43", cx + 4, Y + Hd - 15, 1, 12);
      px(c, "#d7a55d", cx + 11, Y + Hd - 9, 1, 2);
      px(c, "#e6d5af", cx, Y + Hd, TS, 2);
    } else if ((col + b.x) % 2 === 0) {
      const wx = cx + 3, wy2 = wy + 4;
      px(c, "#45332c", wx - 1, wy2 - 1, 12, 11);
      px(c, "#e9dfc9", wx, wy2, 10, 9);
      px(c, "#5a8290", wx + 1, wy2 + 1, 8, 7);
      px(c, "#83bac7", wx + 2, wy2 + 1, 5, 2);
      px(c, "#d9f3ef", wx + 2, wy2 + 1, 2, 2);
      px(c, "#d4e5d8", wx + 1, wy2 + 6, 8, 1);
      px(c, "#4a4138", wx + 4, wy2 + 1, 1, 7);
      px(c, "#4a4138", wx + 1, wy2 + 4, 8, 1);
      px(c, "#b9a78b", wx - 2, wy2 + 9, 14, 2);
      px(c, "rgba(255,255,255,0.3)", wx + 1, wy2, 8, 1);
    }
  }
  // Facade foot band, painted corner trim and occasional flower pots.
  px(c, b.trim, X, Y + Hd - 4, Wd, 4);
  px(c, "rgba(255,255,255,0.25)", X + 1, Y + Hd - 4, Wd - 2, 1);
  px(c, "rgba(49,37,27,0.18)", X, Y + Hd - 1, Wd, 1);
  if (b.awning) {
    px(c, O, X - 1, wy - 1, Wd + 2, 7);
    for (let xx = 0; xx < Wd; xx += 8) {
      px(c, (xx / 8) % 2 ? "#f5f0e1" : b.awning, X + xx, wy, 8, 5);
      px(c, (xx / 8) % 2 ? "#c7bcaa" : b.roofDark, X + xx, wy + 5, 8, 1);
      px(c, "rgba(255,255,255,0.28)", X + xx, wy, 8, 1);
    }
  }
  if (b.sign) {
    c.font = "700 8px Arial, sans-serif";
    const tw = Math.ceil(c.measureText(b.sign).width) + 8;
    const sx = Math.round(X + Wd / 2 - tw / 2), sy = Y + roofH - 15;
    px(c, O, sx - 2, sy - 2, tw + 4, 13);
    px(c, b.signBg ?? "#fff", sx, sy, tw, 10);
    px(c, "rgba(255,255,255,0.8)", sx, sy, tw, 1);
    px(c, "rgba(0,0,0,0.14)", sx, sy + 9, tw, 1);
    c.fillStyle = b.signFg ?? "#000"; c.textBaseline = "top";
    c.fillText(b.sign, sx + 4, sy + 2);
  }
}

function drawOncas(c: C) {
  const X = 22 * TS - 2, Y = 14 * TS - 8;
  // Raised brick island and caatinga planting, based on the real twin-jaguar roundabout.
  px(c, "rgba(43,34,25,0.25)", X + 3, Y + 35, 46, 5);
  px(c, "#6f4835", X + 1, Y + 31, 48, 8);
  px(c, "#a75d3c", X + 3, Y + 30, 44, 7);
  px(c, "#d18b56", X + 5, Y + 29, 40, 5);
  for (let i = 0; i < 10; i++) {
    const bx = X + 5 + i * 4;
    px(c, i % 2 ? "#9b573a" : "#e5a064", bx, Y + 32 + (i % 3), 3, 1);
    px(c, "#7d4834", bx + 2, Y + 35, 1, 2);
  }
  // Stylized left jaguar: seated, rounded haunches, upright chest and face.
  px(c, "#35251c", X + 5, Y + 18, 17, 12);
  px(c, "#35251c", X + 7, Y + 10, 12, 14);
  px(c, "#35251c", X + 9, Y + 5, 10, 10);
  px(c, "#35251c", X + 7, Y + 4, 4, 5); px(c, "#35251c", X + 16, Y + 4, 4, 5);
  px(c, "#d99e45", X + 7, Y + 20, 13, 8);
  px(c, "#efc66f", X + 9, Y + 11, 9, 13);
  px(c, "#e8b85d", X + 10, Y + 6, 8, 7);
  px(c, "#f7d990", X + 12, Y + 13, 5, 7);
  px(c, "#35251c", X + 8, Y + 26, 5, 4); px(c, "#35251c", X + 17, Y + 26, 5, 4);
  px(c, "#e4b65c", X + 9, Y + 25, 4, 3); px(c, "#e4b65c", X + 17, Y + 25, 4, 3);
  px(c, "#35251c", X + 18, Y + 20, 7, 2); px(c, "#35251c", X + 23, Y + 21, 2, 5);
  px(c, "#6d4427", X + 11, Y + 8, 2, 2); px(c, "#6d4427", X + 15, Y + 10, 2, 2);
  px(c, "#6d4427", X + 10, Y + 16, 2, 2); px(c, "#6d4427", X + 15, Y + 18, 2, 2);
  px(c, "#6d4427", X + 7, Y + 22, 2, 2); px(c, "#6d4427", X + 17, Y + 23, 2, 2);
  px(c, "#35251c", X + 12, Y + 9, 1, 1); px(c, "#35251c", X + 16, Y + 12, 1, 1);
  px(c, "#35251c", X + 12, Y + 15, 1, 1); px(c, "#35251c", X + 17, Y + 19, 1, 1);
  px(c, "#35251c", X + 13, Y + 10, 1, 1); px(c, "#35251c", X + 16, Y + 7, 1, 1);
  px(c, "#3c2a20", X + 12, Y + 11, 1, 1); px(c, "#3c2a20", X + 16, Y + 11, 1, 1);
  px(c, "#2b201b", X + 13, Y + 11, 1, 1); px(c, "#2b201b", X + 17, Y + 11, 1, 1);
  px(c, "#fff0c4", X + 13, Y + 13, 2, 1); px(c, "#fff0c4", X + 17, Y + 13, 2, 1);
  // Reclining jaguar on the right, with rosettes and a cream belly.
  px(c, "#35251c", X + 25, Y + 20, 21, 9);
  px(c, "#35251c", X + 31, Y + 15, 12, 9);
  px(c, "#35251c", X + 39, Y + 13, 8, 8);
  px(c, "#35251c", X + 39, Y + 11, 3, 4); px(c, "#35251c", X + 44, Y + 12, 3, 4);
  px(c, "#dca348", X + 27, Y + 21, 18, 6);
  px(c, "#edc36b", X + 32, Y + 17, 10, 6);
  px(c, "#e9bb60", X + 40, Y + 14, 6, 5);
  px(c, "#fff0bf", X + 38, Y + 20, 5, 3);
  px(c, "#35251c", X + 29, Y + 25, 4, 4); px(c, "#35251c", X + 39, Y + 25, 4, 4);
  px(c, "#e8b75e", X + 29, Y + 26, 3, 2); px(c, "#e8b75e", X + 39, Y + 26, 3, 2);
  px(c, "#35251c", X + 25, Y + 21, 2, 7); px(c, "#35251c", X + 24, Y + 27, 5, 2);
  for (const [sx, sy] of [[29, 22], [33, 20], [37, 22], [34, 25], [41, 18], [43, 21], [39, 24]] as const) {
    px(c, "#6d4427", X + sx - 2, Y + sy - 1, 3, 3);
    px(c, "#35251c", X + sx - 1, Y + sy, 1, 1);
  }
  px(c, "#3a2920", X + 42, Y + 16, 1, 1); px(c, "#3a2920", X + 45, Y + 16, 1, 1);
  px(c, "#fff0c4", X + 42, Y + 18, 2, 1);
  // Agave and dry planting on either side of the monument.
  for (let i = 0; i < 4; i++) {
    px(c, "#46733c", X + 2 + i * 2, Y + 27 - i, 1, 5 + i);
    px(c, "#75964b", X + 3 + i * 2, Y + 28 - i, 1, 3 + i);
    px(c, "#46733c", X + 42 + i, Y + 29 - i * 2, 1, 4 + i);
  }
}

function drawTatu(c: C) {
  const X = 2 * TS - 1, Y = 26 * TS - 9;
  px(c, "rgba(43,34,25,0.26)", X + 2, Y + 36, 47, 5);
  // White-rock mound characteristic of the armadillo monument's plinth.
  px(c, "#787e79", X + 2, Y + 31, 46, 10);
  const rocks: [number, number, number, string][] = [
    [3, 34, 7, "#e5e0d3"], [10, 33, 8, "#cfcabd"], [18, 35, 7, "#f4efdf"],
    [26, 33, 8, "#d8d4c8"], [35, 34, 8, "#f0ead9"], [6, 38, 9, "#c1c0b5"],
    [16, 38, 8, "#ece6d6"], [27, 38, 9, "#c9c6bb"], [37, 38, 8, "#dedace"],
  ];
  for (const [rx, ry, rw, col] of rocks) {
    px(c, "#777b73", X + rx, Y + ry, rw, 4);
    px(c, col, X + rx, Y + ry, rw - 1, 3);
    px(c, "#fffdf0", X + rx + 1, Y + ry, Math.max(2, rw - 4), 1);
  }
  // Shell: stepped ellipse silhouette, layered grey stone and carved armor bands.
  px(c, "#454b49", X + 6, Y + 17, 32, 15);
  px(c, "#676f6c", X + 4, Y + 18, 36, 11);
  px(c, "#8b918c", X + 6, Y + 13, 31, 13);
  px(c, "#a9aaa0", X + 10, Y + 10, 24, 4);
  px(c, "#c3c0b3", X + 14, Y + 11, 14, 2);
  px(c, "#b2b3a7", X + 8, Y + 16, 28, 7);
  px(c, "#8d9691", X + 7, Y + 19, 29, 5);
  for (let i = 0; i < 5; i++) {
    const sx = X + 10 + i * 5;
    px(c, "#626b67", sx, Y + 14, 1, 12);
    px(c, "#d0ccc0", sx + 1, Y + 14, 1, 10);
    px(c, "#9da49d", sx + 2, Y + 16, 2, 8);
  }
  // Armor scales along the back and an earthy rim.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      const sx = X + 9 + col * 4 + (row % 2 ? 1 : 0), sy = Y + 15 + row * 4;
      px(c, "#717a75", sx, sy, 3, 2);
      px(c, "#c1c0b4", sx, sy, 2, 1);
    }
  }
  // Head, long snout and little ears.
  px(c, "#515956", X + 34, Y + 21, 10, 7);
  px(c, "#858d86", X + 37, Y + 22, 8, 4);
  px(c, "#a9aaa0", X + 41, Y + 24, 6, 2);
  px(c, "#5c625c", X + 36, Y + 19, 3, 4);
  px(c, "#d4d0c3", X + 37, Y + 20, 2, 2);
  px(c, "#292d2a", X + 45, Y + 25, 2, 1);
  px(c, "#373d39", X + 39, Y + 23, 1, 1);
  // Short legs, claws and tail.
  px(c, "#575e59", X + 12, Y + 25, 5, 7); px(c, "#9a9f95", X + 13, Y + 27, 3, 4);
  px(c, "#575e59", X + 30, Y + 25, 5, 7); px(c, "#9a9f95", X + 31, Y + 27, 3, 4);
  px(c, "#515652", X + 4, Y + 25, 5, 2); px(c, "#777e76", X + 2, Y + 26, 4, 1);
  // A little mandacaru at the island edge ties the sculpture to the local landscape.
  px(c, "#285b37", X + 1, Y + 20, 3, 12); px(c, "#3e8148", X + 2, Y + 18, 2, 13);
  px(c, "#285b37", X - 1, Y + 23, 3, 5); px(c, "#285b37", X + 3, Y + 22, 3, 6);
}

function drawSeriema(c: C) {
  const X = 23 * TS - 1, Y = 18 * TS - 24;
  // Small stone island beside the road; the sculpture itself stands high above it.
  px(c, "rgba(43,34,25,0.24)", X + 1, Y + 50, 32, 5);
  px(c, "#74746b", X + 1, Y + 46, 32, 7);
  px(c, "#c8c3b3", X + 3, Y + 45, 28, 5);
  px(c, "#e4ddc9", X + 5, Y + 45, 22, 2);
  for (let i = 0; i < 6; i++) px(c, i % 2 ? "#b66b3c" : "#d18a50", X + 4 + i * 4, Y + 48, 3, 2);
  // Long legs and knobby feet.
  px(c, "#563d2b", X + 12, Y + 31, 2, 15); px(c, "#8d5637", X + 13, Y + 32, 1, 12);
  px(c, "#563d2b", X + 22, Y + 30, 2, 16); px(c, "#8d5637", X + 22, Y + 32, 1, 12);
  px(c, "#563d2b", X + 9, Y + 44, 6, 2); px(c, "#563d2b", X + 20, Y + 44, 7, 2);
  px(c, "#b17843", X + 10, Y + 42, 5, 2); px(c, "#b17843", X + 21, Y + 42, 5, 2);
  // Feathered body with distinct wing planes.
  px(c, "#392d24", X + 6, Y + 23, 22, 12);
  px(c, "#6e5140", X + 8, Y + 23, 18, 9);
  px(c, "#987254", X + 10, Y + 24, 13, 6);
  px(c, "#c29a6c", X + 11, Y + 25, 9, 2);
  for (let i = 0; i < 5; i++) {
    px(c, "#d0aa76", X + 10 + i * 2, Y + 28 + (i % 2), 2, 1);
    px(c, "#4a372a", X + 9 + i * 3, Y + 31, 2, 1);
  }
  // Long curved neck and small head, in reddish earthen tones.
  px(c, "#392d24", X + 19, Y + 10, 7, 17);
  px(c, "#6e5140", X + 20, Y + 11, 5, 15);
  px(c, "#a27b59", X + 21, Y + 12, 2, 12);
  px(c, "#392d24", X + 21, Y + 5, 9, 7);
  px(c, "#7c5b43", X + 22, Y + 6, 7, 5);
  px(c, "#392d24", X + 24, Y + 3, 3, 4);
  px(c, "#ba4531", X + 24, Y + 3, 1, 3);
  px(c, "#392d24", X + 28, Y + 8, 5, 2);
  px(c, "#d1a36c", X + 30, Y + 8, 4, 1);
  px(c, "#231f1b", X + 26, Y + 7, 1, 1);
  // Crest feathers, beak and tail.
  px(c, "#392d24", X + 22, Y + 2, 1, 3); px(c, "#392d24", X + 25, Y + 1, 1, 4);
  px(c, "#392d24", X + 28, Y + 2, 1, 3);
  px(c, "#392d24", X + 5, Y + 25, 4, 3); px(c, "#a27b59", X + 2, Y + 26, 4, 2);
}

function drawClock(c: C) {
  const X = 9 * TS - 4, Y = 17 * TS - 3;
  // Pruned ornamental trees with rounded, lollipop-like crowns behind the monument.
  for (const tx of [X + 5, X + 42]) {
    px(c, "#5b4934", tx + 5, Y + 1, 3, 13);
    px(c, "#345b34", tx, Y - 3, 13, 10);
    px(c, "#477947", tx + 2, Y - 5, 9, 8);
    px(c, "#64934f", tx + 4, Y - 5, 6, 5);
    px(c, "#7eaa60", tx + 5, Y - 4, 3, 2);
    px(c, "#a3c77c", tx + 6, Y - 4, 2, 1);
    px(c, "#2d4e2c", tx + 1, Y + 1, 2, 3);
    px(c, "#2d4e2c", tx + 10, Y + 1, 2, 3);
  }
  // Current street-view reference: despite the square's popular name, its focal feature
  // is a low beige concrete monument with three bays, open-block side walls and a mural.
  // Broad silhouette stays low so the plaza and its trees remain the visual focus.
  px(c, "rgba(43,34,25,0.22)", X + 1, Y + 33, 57, 4);
  // Three shallow front steps, with slightly worn concrete edges.
  px(c, "#a9a294", X + 1, Y + 29, 57, 5);
  px(c, "#c4c0b4", X + 2, Y + 28, 55, 4);
  px(c, "#d5d0c3", X + 4, Y + 26, 51, 3);
  px(c, "#e6e0d2", X + 5, Y + 26, 49, 1);
  px(c, "#aaa79b", X + 3, Y + 30, 53, 1);
  px(c, "#c7c3b7", X + 5, Y + 31, 49, 2);
  // Monument wall with cap/coping and a dark shaded right edge.
  px(c, "#97958c", X + 3, Y + 7, 52, 20);
  px(c, "#d0ccbf", X + 1, Y + 5, 54, 22);
  px(c, "#e3dfd3", X + 2, Y + 6, 51, 19);
  px(c, "#f0ecdf", X + 3, Y + 6, 49, 2);
  px(c, "#aaa79c", X + 3, Y + 24, 49, 2);
  px(c, "#bbb7aa", X + 2, Y + 26, 52, 1);
  // Left open concrete-block panel; repeated negative openings read clearly at game scale.
  px(c, "#c2beb2", X + 5, Y + 9, 11, 13);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const bx = X + 6 + col * 3, by = Y + 10 + row * 3;
      px(c, "#a19f95", bx, by, 2, 2);
      px(c, "#e8e4d8", bx, by, 1, 1);
    }
  }
  // Central mural: stylized grayscale roundabout scene and a little bus, original game art.
  px(c, "#8b8a81", X + 19, Y + 8, 19, 16);
  px(c, "#f0ede3", X + 20, Y + 9, 17, 14);
  px(c, "#d2d0c7", X + 21, Y + 10, 15, 12);
  // road loop / roundabout
  px(c, "#7d7e79", X + 23, Y + 11, 10, 1);
  px(c, "#7d7e79", X + 22, Y + 12, 1, 6);
  px(c, "#7d7e79", X + 33, Y + 12, 1, 6);
  px(c, "#7d7e79", X + 23, Y + 18, 10, 1);
  px(c, "#f3f1e9", X + 24, Y + 12, 8, 6);
  px(c, "#aaa99f", X + 25, Y + 13, 6, 4);
  px(c, "#777873", X + 24, Y + 16, 9, 1);
  // miniature bus on the mural's roundabout
  px(c, "#666862", X + 23, Y + 13, 4, 3);
  px(c, "#f5f3e8", X + 24, Y + 13, 2, 1);
  px(c, "#c3c4bc", X + 24, Y + 14, 2, 1);
  px(c, "#3f413d", X + 23, Y + 16, 1, 1);
  px(c, "#3f413d", X + 26, Y + 16, 1, 1);
  // Right concrete lattice panel
  px(c, "#c2beb2", X + 40, Y + 9, 11, 13);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const bx = X + 41 + col * 3, by = Y + 10 + row * 3;
      px(c, "#a19f95", bx, by, 2, 2);
      px(c, "#e8e4d8", bx, by, 1, 1);
    }
  }
  // Fine grime, cracks and worn concrete around the plinth.
  px(c, "#a9a69a", X + 7, Y + 23, 5, 1);
  px(c, "#bbb7aa", X + 15, Y + 7, 3, 1);
  px(c, "#c7c2b5", X + 38, Y + 25, 4, 1);
  px(c, "#8e8d84", X + 18, Y + 28, 7, 1);
}

function drawLocalLandmarks(c: C) {
  drawOncas(c);
  drawTatu(c);
  drawSeriema(c);
  drawClock(c);
}

function drawCampusEntrance(c: C) {
  // Original pixel-art interpretation of the real campus frontage: a long beige fascia,
  // dark institutional lettering, green campus line and a shaded corridor below it.
  const X = 25 * TS + 2, Y = 14 * TS - 8, Wd = 17 * TS - 4, Hd = 20;
  px(c, "rgba(33,29,24,0.34)", X + 2, Y + Hd, Wd, 4);
  px(c, "#9c988d", X - 1, Y - 1, Wd + 2, Hd + 2);
  px(c, "#e4dfd2", X, Y, Wd, Hd);
  px(c, "#f0ecdf", X + 1, Y + 1, Wd - 2, Hd - 4);
  px(c, "#d0c9b8", X, Y + Hd - 4, Wd, 2);
  px(c, "#2e7d5b", X, Y + Hd - 2, Wd, 2);
  // Simplified green mark; it is redrawn as original game art, not copied from a raster logo.
  px(c, "#2e9b63", X + 7, Y + 4, 8, 3);
  px(c, "#2e9b63", X + 7, Y + 9, 8, 3);
  px(c, "#2e9b63", X + 7, Y + 14, 8, 2);
  px(c, "#1f5a41", X + 17, Y + 4, 2, 12);
  c.textBaseline = "top";
  c.font = "700 8px Arial, sans-serif";
  c.fillStyle = "#222722";
  c.fillText("INSTITUTO FEDERAL DO PIAUÍ", X + 27, Y + 3);
  c.font = "700 7px Arial, sans-serif";
  c.fillStyle = "#2e7d5b";
  c.fillText("Campus São Raimundo Nonato", X + 27, Y + 11);
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
  drawLocalLandmarks(c);
  drawCampusEntrance(c);
  board(c, 35 * TS + 2, 16 * TS + 2, 66, "#c8553d", "INSCRIÇÕES", "ABERTAS!", "#fff3d6");
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
  pack?: string; cap?: string; apron?: string; tie?: string; trim?: string; glasses?: boolean; bun?: boolean; braids?: boolean; clipboard?: boolean;
};

export function drawChar(c: C, x: number, y: number, L: Look, dir: Dir, step: number, hb: number) {
  // Characters now use a taller 16×24-style sprite silhouette, like a handheld-era RPG:
  // feet still line up to the tile grid, but the head, hair and clothing get more visual room.
  x = Math.round(x); y = Math.round(y);
  const headY = y - 8 + hb;
  const lo = step === 1 ? -1 : step === 3 ? 1 : 0;
  const ro = step === 3 ? -1 : step === 1 ? 1 : 0;
  px(c, "rgba(34,28,22,0.28)", x + 2, y + 13, 12, 3);
  // Pack, straps and shoulder silhouette.
  if (L.pack && dir === "up") {
    px(c, O, x + 3, y + 1, 10, 9);
    px(c, "#9e3229", x + 4, y + 2, 8, 7);
    px(c, L.pack, x + 4, y + 2, 7, 5);
    px(c, "rgba(255,255,255,0.28)", x + 5, y + 3, 5, 1);
    px(c, "#5b2f24", x + 5, y + 7, 6, 1);
    px(c, "#e5b765", x + 7, y + 7, 2, 2);
  } else if (L.pack && dir === "left") {
    px(c, O, x + 10, y + 1, 5, 8); px(c, L.pack, x + 11, y + 2, 3, 6);
  } else if (L.pack && dir === "right") {
    px(c, O, x + 1, y + 1, 5, 8); px(c, L.pack, x + 2, y + 2, 3, 6);
  }
  // Legs and shoes, with alternating stride frames.
  px(c, O, x + 4, y + 7 + lo, 4, 8 - lo);
  px(c, O, x + 8, y + 7 + ro, 4, 8 - ro);
  px(c, L.pants, x + 5, y + 8 + lo, 2, 5);
  px(c, L.pants, x + 9, y + 8 + ro, 2, 5);
  px(c, "rgba(255,255,255,0.18)", x + 5, y + 8 + lo, 1, 3);
  px(c, "rgba(0,0,0,0.2)", x + 6, y + 12, 1, 2);
  px(c, "#372c2a", x + 4, y + 13 + lo, 4, 2);
  px(c, "#372c2a", x + 8, y + 13 + ro, 4, 2);
  px(c, "#b8a28a", x + 5, y + 13 + lo, 2, 1);
  px(c, "#b8a28a", x + 9, y + 13 + ro, 2, 1);
  // Torso with collar, sleeves, side shade and individualized work/school details.
  px(c, O, x + 3, y - 1, 10, 10);
  px(c, L.shirt, x + 4, y, 8, 7);
  px(c, "rgba(255,255,255,0.25)", x + 5, y, 5, 1);
  px(c, "rgba(0,0,0,0.16)", x + 10, y + 2, 2, 5);
  const sw = step === 1 ? 1 : step === 3 ? -1 : 0;
  px(c, O, x + 2, y + 1 + sw, 3, 6);
  px(c, O, x + 11, y + 1 - sw, 3, 6);
  px(c, L.shirt, x + 3, y + 2 + sw, 2, 4);
  px(c, L.shirt, x + 11, y + 2 - sw, 2, 4);
  if (L.trim) {
    px(c, L.trim, x + 6, y, 4, 1);
    px(c, L.trim, x + 4, y + 5, 1, 2);
    px(c, L.trim, x + 11, y + 5, 1, 2);
    px(c, L.trim, x + 10, y + 2, 1, 2);
  }
  px(c, L.skin, x + 3, y + 6 + sw, 2, 2);
  px(c, L.skin, x + 11, y + 6 - sw, 2, 2);
  px(c, "rgba(255,255,255,0.3)", x + 4, y + 1, 1, 4);
  px(c, L.skin, x + 7, y - 1, 2, 2);
  px(c, "#eee5d5", x + 6, y, 4, 2);
  if (L.apron && dir !== "up") {
    px(c, O, x + 4, y + 2, 8, 7);
    px(c, L.apron, x + 5, y + 3, 6, 5);
    px(c, "rgba(0,0,0,0.14)", x + 5, y + 7, 6, 1);
    px(c, "#dfcdb0", x + 6, y + 4, 1, 1);
  }
  if (L.tie && dir === "down") {
    px(c, "#f7f0df", x + 6, y, 4, 2);
    px(c, O, x + 7, y + 1, 2, 5);
    px(c, L.tie, x + 7, y + 1, 1, 4);
    px(c, "#6b8fbe", x + 8, y + 2, 1, 2);
  }
  if (L.pack && dir === "down") {
    px(c, O, x + 3, y + 1, 2, 6); px(c, L.pack, x + 4, y + 2, 1, 4);
    px(c, O, x + 11, y + 1, 2, 6); px(c, L.pack, x + 11, y + 2, 1, 4);
  }
  if (L.clipboard && dir !== "up") {
    px(c, O, x + 11, y + 4, 5, 7);
    px(c, "#9b7547", x + 12, y + 4, 3, 6);
    px(c, "#fbf4e3", x + 12, y + 5, 3, 4);
    px(c, "#7c8a8a", x + 13, y + 6, 1, 1);
    px(c, "#7c8a8a", x + 13, y + 8, 2, 1);
  }
  // Head: larger clusters, ears, highlights and small facial features.
  if (L.bun) {
    px(c, O, x + 5, headY - 2, 6, 4);
    px(c, L.hair, x + 6, headY - 2, 4, 3);
    px(c, "rgba(255,255,255,0.18)", x + 6, headY - 2, 2, 1);
  }
  px(c, O, x + 3, headY, 10, 8);
  px(c, L.skin, x + 4, headY + 1, 8, 6);
  px(c, "rgba(255,232,190,0.35)", x + 5, headY + 1, 3, 2);
  px(c, "rgba(91,47,32,0.18)", x + 9, headY + 3, 2, 3);
  if (L.braids && dir !== "up") {
    px(c, O, x + 2, headY + 4, 2, 8); px(c, L.hair, x + 3, headY + 4, 1, 7);
    px(c, O, x + 12, headY + 4, 2, 8); px(c, L.hair, x + 12, headY + 4, 1, 7);
    px(c, "#6a4836", x + 2, headY + 8, 1, 1); px(c, "#6a4836", x + 12, headY + 8, 1, 1);
  }
  const hair = L.cap ?? L.hair;
  if (dir === "up") {
    px(c, L.hair, x + 4, headY + 1, 8, 6);
    px(c, "#2e241e", x + 4, headY + 5, 8, 2);
    px(c, "rgba(255,255,255,0.16)", x + 5, headY + 1, 4, 1);
    if (L.cap) {
      px(c, O, x + 3, headY, 10, 4);
      px(c, L.cap, x + 4, headY + 1, 8, 2);
      px(c, "rgba(255,255,255,0.25)", x + 5, headY + 1, 5, 1);
    }
    if (L.braids) { px(c, L.hair, x + 7, headY + 5, 2, 5); }
  } else {
    px(c, hair, x + 4, headY, 8, 3);
    px(c, "rgba(255,255,255,0.2)", x + 5, headY, 4, 1);
    if (dir === "down") {
      px(c, L.hair, x + 3, headY + 2, 2, 4); px(c, L.hair, x + 11, headY + 2, 2, 4);
      if (L.cap) {
        px(c, O, x + 3, headY + 1, 10, 4);
        px(c, L.cap, x + 4, headY + 2, 8, 2);
        px(c, "rgba(255,255,255,0.28)", x + 5, headY + 2, 5, 1);
        px(c, L.cap, x + 11, headY + 4, 4, 1);
      }
      px(c, O, x + 6, headY + 4, 1, 2); px(c, O, x + 9, headY + 4, 1, 2);
      px(c, "#fff0d4", x + 6, headY + 4, 1, 1); px(c, "#fff0d4", x + 9, headY + 4, 1, 1);
      px(c, "#8c5141", x + 7, headY + 6, 2, 1);
      px(c, "rgba(240,90,126,0.48)", x + 5, headY + 6, 2, 1);
      px(c, "rgba(240,90,126,0.48)", x + 10, headY + 6, 2, 1);
      if (L.glasses) {
        px(c, O, x + 5, headY + 3, 3, 3); px(c, O, x + 9, headY + 3, 3, 3);
        px(c, "#d7f0f5", x + 6, headY + 4, 1, 1); px(c, "#d7f0f5", x + 10, headY + 4, 1, 1);
        px(c, "#5b5146", x + 8, headY + 4, 1, 1);
      }
    } else {
      const left = dir === "left";
      px(c, L.hair, left ? x + 8 : x + 4, headY + 2, 4, 4);
      px(c, O, left ? x + 5 : x + 10, headY + 3, 2, 2);
      px(c, "#fff0d4", left ? x + 5 : x + 10, headY + 3, 1, 1);
      if (L.cap) {
        px(c, O, left ? x + 2 : x + 10, headY + 1, 5, 3);
        px(c, L.cap, left ? x + 2 : x + 11, headY + 2, 4, 2);
        px(c, "rgba(255,255,255,0.25)", left ? x + 3 : x + 11, headY + 2, 2, 1);
      }
      if (L.glasses) {
        px(c, O, left ? x + 4 : x + 9, headY + 3, 4, 2);
        px(c, "#d7f0f5", left ? x + 5 : x + 10, headY + 4, 2, 1);
      }
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