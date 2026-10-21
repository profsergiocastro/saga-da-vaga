export const TS = 16;
export const W = 44;
export const H = 30;
export const VW = 320;
export const VH = 192;

export const T = {
  GRASS: 0, DRY: 1, ROAD: 2, WALK: 3, PLAZA: 4, CAMPUS: 5, WALL: 6, TREE: 7, CACTUS: 8,
  FLOWER: 9, BUSH: 10, BENCH: 11, FENCE: 12, BUILDING: 13, ROCK: 14, POLE: 15, MOTO: 16, FLAG: 17, SIGN: 18,
} as const;

const SOLID = new Set<number>([6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
export const isSolidTile = (t: number) => SOLID.has(t);

export function hash(x: number, y: number, s = 0): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export type Building = {
  x: number; y: number; w: number; h: number; doorX: number;
  wall: string; roof: string; roofDark: string; trim: string;
  sign?: string; signBg?: string; signFg?: string; awning?: string;
};

export const GATE: [number, number][] = [[32, 15], [33, 15]];
export const FLAG_POS: [number, number] = [29, 16];
export const START = { x: 6, y: 8 };

export const BUILDINGS: Building[] = [
  { x: 3, y: 3, w: 7, h: 5, doorX: 6, wall: "#f2c14e", roof: "#c8553d", roofDark: "#963a2a", trim: "#b98a2c" },
  { x: 12, y: 4, w: 6, h: 5, doorX: 14, wall: "#5fb49c", roof: "#a44a3f", roofDark: "#76322a", trim: "#3d8a73", sign: "MERCEARIA SOL A PINO", signBg: "#fff3d6", signFg: "#7a3b2e" },
  { x: 24, y: 4, w: 8, h: 5, doorX: 27, wall: "#ef8fb1", roof: "#3d6fb6", roofDark: "#28508a", trim: "#c4607f", sign: "PAPELARIA DA CÉLIA", signBg: "#ffffff", signFg: "#28508a", awning: "#3d6fb6" },
  { x: 35, y: 4, w: 7, h: 5, doorX: 38, wall: "#f08a4b", roof: "#7a3b2e", roofDark: "#552519", trim: "#b85a2a", sign: "BODE & CIA LANCHES", signBg: "#2b1d18", signFg: "#ffd23f", awning: "#d7263d" },
  { x: 26, y: 18, w: 6, h: 5, doorX: 28, wall: "#efe8d6", roof: "#2e7d5b", roofDark: "#1f5a41", trim: "#2e7d5b", sign: "BLOCO A", signBg: "#1f5a41", signFg: "#ffffff" },
  { x: 35, y: 18, w: 7, h: 5, doorX: 38, wall: "#efe8d6", roof: "#c0392b", roofDark: "#8e2a1f", trim: "#2e7d5b", sign: "LABORATÓRIOS", signBg: "#1f5a41", signFg: "#ffffff" },
];

export type World = { tiles: Uint8Array; poles: [number, number][] };

export function buildWorld(): World {
  const t = new Uint8Array(W * H);
  const set = (x: number | undefined, y: number | undefined, v: number) => {
    if (x === undefined || y === undefined) return;
    if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, v: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v);
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dry = hash(x, y, 1) < (y > 24 ? 0.45 : 0.18);
      t[y * W + x] = dry ? T.DRY : hash(x, y, 2) > 0.95 ? T.FLOWER : T.GRASS;
    }
  // streets
  rect(1, 10, 42, 10, T.WALK);
  rect(1, 13, 42, 13, T.WALK);
  rect(1, 11, 42, 12, T.ROAD);
  rect(19, 14, 19, 28, T.WALK);
  rect(22, 14, 22, 28, T.WALK);
  rect(20, 13, 21, 28, T.ROAD);
  rect(24, 9, 31, 9, T.WALK);
  rect(6, 8, 6, 9, T.WALK);
  rect(14, 9, 14, 9, T.WALK);
  rect(38, 9, 38, 9, T.WALK);
  // praça
  rect(6, 15, 16, 25, T.PLAZA);
  rect(10, 14, 12, 14, T.PLAZA);
  rect(17, 19, 18, 20, T.PLAZA);
  for (const [x, y] of [[6, 15], [16, 15], [6, 25], [16, 25], [6, 19], [16, 23], [9, 25], [13, 15]]) set(x, y, T.TREE);
  set(8, 22, T.BENCH);
  set(14, 17, T.BENCH);
  set(11, 20, T.CACTUS);
  for (const [x, y] of [[10, 20], [12, 20], [11, 19], [11, 21], [7, 16], [15, 24]]) set(x, y, T.FLOWER);
  // campus
  rect(25, 15, 42, 28, T.WALL);
  rect(26, 16, 41, 27, T.CAMPUS);
  rect(32, 14, 33, 14, T.WALK);
  for (const [x, y] of GATE) set(x, y, T.CAMPUS);
  rect(26, 14, 30, 14, T.SIGN);
  rect(35, 14, 39, 14, T.SIGN);
  set(FLAG_POS[0], FLAG_POS[1], T.FLAG);
  for (const [x, y] of [[27, 25], [30, 26], [37, 25], [40, 26], [26, 16], [41, 16]]) set(x, y, T.TREE);
  for (const [x, y] of [[33, 25], [34, 25]]) set(x, y, T.BENCH);
  for (const [x, y] of [[27, 17], [30, 17], [36, 17], [40, 17], [28, 26], [39, 24]]) set(x, y, T.FLOWER);
  for (const [x, y] of [[26, 23], [41, 23], [26, 27], [41, 27]]) set(x, y, T.BUSH);
  // buildings
  for (const b of BUILDINGS) rect(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, T.BUILDING);
  // decor
  for (const [x, y] of [[3, 27], [8, 27], [13, 28], [2, 16], [2, 21], [17, 27], [10, 2], [19, 2], [22, 3], [33, 2], [42, 2], [2, 8]]) set(x, y, T.TREE);
  for (const [x, y] of [[5, 26], [15, 27], [23, 24], [23, 18], [11, 9], [21, 6], [1, 18], [18, 16]]) set(x, y, T.CACTUS);
  for (const [x, y] of [[5, 28], [11, 27], [23, 27], [20, 4], [3, 23]]) set(x, y, T.ROCK);
  for (const [x, y] of [[1, 9], [2, 9], [10, 8], [11, 8]]) set(x, y, T.FENCE);
  const poles: [number, number][] = [[3, 10], [10, 10], [17, 10], [23, 10], [34, 10], [40, 10]];
  for (const [x, y] of poles) set(x, y, T.POLE);
  set(32, 10, T.MOTO);
  // borders
  for (let x = 0; x < W; x++) {
    set(x, 0, T.TREE);
    set(x, H - 1, x % 3 === 0 ? T.CACTUS : T.TREE);
  }
  for (let y = 0; y < H; y++) {
    set(0, y, y % 4 === 0 ? T.CACTUS : T.TREE);
    set(W - 1, y, T.TREE);
  }
  return { tiles: t, poles };
}

export const INTERACT: Record<string, { label: string; lines: string[] }> = {
  "6,7": { label: "Casa", lines: ["Sua casa. Sua mãe grita lá de dentro: 'Leva a garrafa d'água, que o sol tá de rachar!'"] },
  "14,8": { label: "Mercearia", lines: ["Placa na porta: 'FIADO SÓ AMANHÃ'. O amanhã nunca chega."] },
  "27,8": { label: "Papelaria", lines: ["Cheiro de papel novo e cola branca. A Dona Célia está bem ali do lado, no balcão."] },
  "38,8": { label: "Lanchonete", lines: ["Cheirinho de paçoca de carne de sol... Foco! Primeiro a inscrição."] },
  "32,10": { label: "Moto", lines: ["Uma moto com adesivo: 'Deus é fiel e o freio também'."] },
  "8,22": { label: "Banco", lines: ["Um banco quentinho de sol. Ótimo pra revisar, péssimo pra cochilar."] },
  "14,17": { label: "Banco", lines: ["Alguém escreveu no banco: 'Beto esteve aqui (estudando, juro)'."] },
  "11,20": { label: "Mandacaru", lines: ["Um mandacaru firme no canteiro. Resistente como estudante em semana de prova."] },
  "28,22": { label: "Bloco A", lines: ["Salas vazias... por enquanto. O Episódio 2 vem aí!"] },
  "38,22": { label: "Laboratórios", lines: ["Um cartaz na porta: 'Favor não alimentar o servidor'."] },
  "29,16": { label: "Bandeira", lines: ["A bandeira tremula no vento quente do sertão."] },
  "33,25": { label: "Banco", lines: ["Daqui dá pra ver a Serra ao longe. Dá vontade de estudar arqueologia."] },
  "34,25": { label: "Banco", lines: ["Daqui dá pra ver a Serra ao longe. Dá vontade de estudar arqueologia."] },
};
for (let x = 26; x <= 30; x++)
  INTERACT[`${x},14`] = { label: "Placa", lines: ["Placa: INSTITUTO FEDERAL — CAMPUS SRN.", "(Representação fictícia e independente, feita para este protótipo de fã.)"] };
for (let x = 35; x <= 39; x++)
  INTERACT[`${x},14`] = { label: "Placa", lines: ["Placa: INSCRIÇÕES ABERTAS! Traga paciência e caneta azul."] };