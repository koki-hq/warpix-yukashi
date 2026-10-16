// 店の 表。坂の 途中の 古い 洋館の 一階（320×180）。ドアを クリックして 入店する。
import { drawSprite, px, seeded, makeLightMap, applyLightMap } from './pixel.js';
import { yukashiFront } from './sprites.js';
import { lookOf, drawRain, drawFog } from './scene.js';

export const FACADE_W = 320;
export const FACADE_H = 180;
export const DOOR = { x: 142, y: 76, w: 36, h: 74 };
const WINDOWS = [{ x: 34, y: 80, w: 84, h: 56 }, { x: 202, y: 80, w: 84, h: 56 }];
const GROUND = 152;

const FACADE_LIGHT = {
  asa: { ambient: [0.82, 0.84, 0.9], lamps: [] },
  hiru: { ambient: [1, 0.98, 0.94], lamps: [] },
  yu: { ambient: [0.62, 0.48, 0.44], lamps: [{ x: 160, y: 100, r: 120, color: [0.35, 0.22, 0.1] }] },
  yoru: {
    ambient: [0.26, 0.27, 0.42],
    lamps: [
      { x: 76, y: 108, r: 70, color: [0.8, 0.55, 0.28] },
      { x: 244, y: 108, r: 70, color: [0.8, 0.55, 0.28] },
      { x: 160, y: 96, r: 60, color: [0.7, 0.5, 0.25] },
      { x: 306, y: 64, r: 70, color: [0.7, 0.55, 0.3] },
    ],
  },
};

function drawSkyAndGround(ctx, t) {
  const band = 10;
  t.sky.forEach((key, i) => px(ctx, key, 0, i * band, FACADE_W, i === 2 ? 40 : band));
  // 石畳
  px(ctx, '2', 0, GROUND, FACADE_W, FACADE_H - GROUND);
  const rnd = seeded(17);
  for (let y = GROUND + 2, row = 0; y < FACADE_H; y += 5 + row, row++) {
    const h = 4 + row;
    for (let x = (row % 2) * 6 - 6; x < FACADE_W; x += 12 + row * 2) {
      px(ctx, rnd() < 0.5 ? '3' : '4', x + 1, y, 10 + row * 2, h - 1);
      px(ctx, '5', x + 2, y, 6, 1);
    }
  }
}

function drawBuilding(ctx) {
  // 二階：しっくいと 木の 梁
  px(ctx, '1', 14, 0, 292, 4);
  px(ctx, '8', 18, 4, 284, 58);
  for (const x of [18, 100, 216, 298]) px(ctx, '4', x, 4, 4, 58);
  px(ctx, '4', 18, 4, 284, 3);
  px(ctx, '4', 18, 32, 284, 2);
  for (const [x0, x1] of [[22, 100], [220, 298]]) {
    for (let i = 0; i < 2; i++) {
      for (let k = 0; k < 26; k++) px(ctx, '4', x0 + (i ? 78 - k * 3 : k * 3), 34 + k, 2, 1);
    }
  }
  // 二階の 窓（おくのさんの 住まい）
  for (const wx of [124, 172]) {
    px(ctx, '1', wx - 2, 10, 28, 24);
    px(ctx, 'm', wx, 12, 24, 20);
    px(ctx, '1', wx + 11, 12, 2, 20);
    px(ctx, '8', wx, 12, 4, 20); px(ctx, '8', wx + 20, 12, 4, 20); // カーテン
    px(ctx, '5', wx - 3, 34, 30, 2);
  }
  // 窓辺の 花箱
  px(ctx, '3', 170, 36, 28, 4);
  for (let i = 0; i < 9; i++) { px(ctx, 'e', 171 + i * 3, 33, 2, 3); px(ctx, i % 2 ? 'h' : 'i', 171 + i * 3, 32, 2, 1); }

  // 日よけ：葡萄酒色と 生成りの しま。下は 波形
  const ay = 62;
  for (let x = 26; x < 294; x++) {
    const stripe = Math.floor((x - 26) / 8) % 2 ? '8' : 'g';
    px(ctx, stripe, x, ay, 1, 9);
    const scallop = 9 + (((x - 26) % 8) < 6 ? 2 : 0);
    px(ctx, stripe, x, ay + 9, 1, scallop - 9);
  }
  px(ctx, '1', 24, ay - 1, 272, 1);
  px(ctx, '0', 26, ay + 1, 268, 1);

  // 一階：濃い 木の 壁
  px(ctx, '3', 18, 74, 284, GROUND - 74);
  for (let x = 22; x < 300; x += 6) px(ctx, '2', x, 74, 1, GROUND - 74);
  px(ctx, '1', 18, GROUND - 6, 284, 6);
  px(ctx, '4', 18, GROUND - 7, 284, 1);
}

function drawWindowFrame(ctx, w) {
  px(ctx, '1', w.x - 3, w.y - 3, w.w + 6, w.h + 6);
  px(ctx, '5', w.x - 3, w.y + w.h + 3, w.w + 6, 3);
  px(ctx, '6', w.x - 3, w.y + w.h + 3, w.w + 6, 1);
}

// 窓の 中の 色：夕方からは 灯りの 色、昼は 外より 暗い 店の 中
const INSIDE = {
  lit: { wall: 'j', glow: 'k', shelf: '5', dark: '4', top: '7', front: '5', floor: '6', bulb: 'k' },
  day: { wall: '3', glow: '4', shelf: '2', dark: '1', top: '5', front: '2', floor: '4', bulb: 'b' },
};

function drawPendant(ctx, x, y, c) {
  px(ctx, c.dark, x, y, 1, 6);
  px(ctx, 'h', x - 3, y + 6, 7, 2);
  px(ctx, 'g', x - 4, y + 8, 9, 1);
  px(ctx, c.bulb, x - 1, y + 9, 3, 1);
}

// 左の 窓：カウンターと おくのさん
function drawCounterSide(ctx, w, c) {
  px(ctx, c.glow, w.x + 20, w.y + 2, w.w - 40, 20);
  for (const sy of [w.y + 12, w.y + 22]) {
    for (let i = 0; i < 7; i++) px(ctx, i % 3 ? c.dark : 'c', w.x + 6 + i * 11, sy - 5, 4, 5); // 瓶と カップ
    px(ctx, c.shelf, w.x, sy, w.w, 2);
  }
  drawPendant(ctx, w.x + 24, w.y, c);
  // おくのさん
  const ox = w.x + 52, oy = w.y + 24;
  px(ctx, 'c', ox, oy, 6, 2);
  px(ctx, 'q', ox + 1, oy + 2, 4, 3);
  px(ctx, 'c', ox + 1, oy + 4, 4, 1);
  px(ctx, '9', ox - 1, oy + 5, 8, 2);
  px(ctx, '3', ox, oy + 6, 6, 6);
  px(ctx, '9', ox + 2, oy + 6, 2, 3);
  // カウンター
  px(ctx, c.top, w.x, w.y + 36, w.w, 2);
  px(ctx, c.front, w.x, w.y + 38, w.w, w.h - 38);
  for (let x = w.x + 4; x < w.x + w.w - 10; x += 20) px(ctx, c.dark, x, w.y + 41, 14, 1);
  px(ctx, 'c', w.x + 16, w.y + 33, 4, 3); // カウンターの カップ
}

// 右の 窓：テーブル、本棚、鉢
function drawTableSide(ctx, w, c) {
  px(ctx, c.glow, w.x + 10, w.y + 4, 40, 24);
  drawPendant(ctx, w.x + 32, w.y, c);
  // 本棚
  const bx = w.x + w.w - 22;
  px(ctx, c.dark, bx, w.y + 2, 20, w.h - 2);
  const colors = ['g', 'm', 'e', 'h', '7', 'n', '5'];
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 6; i++) px(ctx, colors[(r * 3 + i) % colors.length], bx + 2 + i * 3, w.y + 5 + r * 12, 2, 8);
    px(ctx, c.shelf, bx, w.y + 13 + r * 12, 20, 1);
  }
  // 丸テーブルと 椅子
  px(ctx, c.floor, w.x, w.y + w.h - 8, w.w - 22, 8);
  px(ctx, c.top, w.x + 22, w.y + 38, 22, 2);
  px(ctx, c.dark, w.x + 32, w.y + 40, 2, 12);
  px(ctx, c.dark, w.x + 28, w.y + 51, 10, 1);
  for (const cx of [w.x + 14, w.x + 48]) {
    px(ctx, c.dark, cx, w.y + 32, 2, 20);
    px(ctx, c.dark, cx - 2, w.y + 42, 6, 2);
  }
  px(ctx, 'c', w.x + 30, w.y + 35, 4, 3); // テーブルの カップ
  // 鉢植え
  px(ctx, 'h', w.x + 3, w.y + w.h - 10, 7, 8);
  for (const [lx, ly] of [[1, 30], [5, 26], [8, 31], [3, 36], [7, 37]]) { px(ctx, 'e', w.x + lx, w.y + ly, 3, 2); px(ctx, 'f', w.x + lx, w.y + ly, 2, 1); }
}

// 窓の 中：昼は 空が 映りこみ、夕方からは 店の 灯りが もれる
function drawWindowGlass(ctx, w, t, lit, index) {
  const c = lit ? INSIDE.lit : INSIDE.day;
  px(ctx, c.wall, w.x, w.y, w.w, w.h);
  if (index === 0) drawCounterSide(ctx, w, c);
  else drawTableSide(ctx, w, c);
  if (!lit) {
    // ガラスの 映りこみ：上に 空、ななめの 光
    px(ctx, 'o', w.x, w.y, w.w, 3);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) px(ctx, 'p', w.x + 10 + k * 26 + i, w.y + 4 + i, 2, 1);
  }
  // 格子
  px(ctx, '1', w.x + w.w / 2 - 1, w.y, 2, w.h);
  px(ctx, '1', w.x, w.y + 22, w.w, 2);
}

function drawDoor(ctx, open, lit) {
  const { x, y, w, h } = DOOR;
  px(ctx, '1', x - 3, y - 3, w + 6, h + 3);
  // 開いた ところから 店の 灯り
  px(ctx, 'k', x, y, w, h);
  px(ctx, 'j', x, y + h - 20, w, 20);
  const dw = Math.round(w * (1 - open));
  if (dw > 0) {
    px(ctx, '4', x, y, dw, h);
    px(ctx, '5', x, y, Math.max(1, dw - 2), 1);
    if (dw > 12) {
      px(ctx, lit ? 'k' : 'n', x + 6 * (dw / w), y + 6, dw - 12 * (dw / w), 28); // ガラス
      if (!lit) px(ctx, 'p', x + 8 * (dw / w), y + 9, 3, 8);
      px(ctx, '3', x + 5 * (dw / w), y + 40, dw - 10 * (dw / w), 1);
      px(ctx, '3', x + 5 * (dw / w), y + 40, 1, 28);
      px(ctx, 'k', x + dw - 6 * (dw / w), y + 44, 2, 2); // ドアノブ
    }
    px(ctx, '1', x + dw - 1, y, 1, h);
  }
  // 鈴
  px(ctx, '0', x + w / 2, y - 3, 1, 2);
  px(ctx, 'k', x + w / 2 - 1, y - 1, 3, 2);
  // 石段
  px(ctx, '6', x - 6, GROUND - 2, w + 12, 2);
  px(ctx, '5', x - 6, GROUND, w + 12, 2);
  px(ctx, '6', x - 10, GROUND + 2, w + 20, 2);
  px(ctx, '4', x - 10, GROUND + 4, w + 20, 2);
}

function drawSignAndPlants(ctx) {
  // 吊り看板：カップと 湯気
  px(ctx, '0', 182, 72, 18, 1);
  px(ctx, '0', 184, 73, 1, 4); px(ctx, '0', 197, 73, 1, 4);
  px(ctx, '1', 182, 77, 18, 15);
  px(ctx, '4', 183, 78, 16, 13);
  px(ctx, 'c', 187, 84, 7, 4); px(ctx, 'c', 194, 85, 1, 2); px(ctx, 'c', 186, 88, 9, 1);
  px(ctx, 'c', 189, 81, 1, 2); px(ctx, 'c', 191, 80, 1, 2);

  // ドアの 左：大きな シダの 鉢
  px(ctx, 'h', 122, GROUND - 14, 14, 14); px(ctx, 'i', 122, GROUND - 14, 14, 2); px(ctx, 'g', 131, GROUND - 12, 5, 12);
  for (let a = -4; a <= 4; a++) {
    for (let s = 0; s < 14; s++) {
      px(ctx, s % 2 ? 'e' : 'f', 129 + Math.round(a * s * 0.55), GROUND - 15 - Math.round(s * (1.3 - Math.abs(a) * 0.18)));
    }
  }
  // ドアの 右：小さな 花の 鉢
  px(ctx, 'h', 184, GROUND - 8, 10, 8); px(ctx, 'i', 184, GROUND - 8, 10, 1);
  [[185, 13], [188, 15], [191, 12]].forEach(([fx, fh]) => { px(ctx, 'e', fx + 1, GROUND - fh, 1, fh - 8); px(ctx, 'k', fx, GROUND - fh - 1, 3, 2); });

  // 街灯
  px(ctx, '0', 306, 60, 2, GROUND - 60 + 6);
  px(ctx, '0', 302, GROUND + 4, 10, 2);
  px(ctx, '0', 301, 56, 12, 2);
  px(ctx, '1', 302, 58, 10, 8);
}

// 傘立て（雨の 日だけ、傘が 一本 さしてある）
function drawUmbrellaStand(ctx) {
  px(ctx, '1', 108, GROUND - 10, 8, 10);
  px(ctx, 'a', 109, GROUND - 9, 6, 9);
  px(ctx, 'm', 110, GROUND - 24, 3, 15);
  px(ctx, 'n', 110, GROUND - 24, 1, 15);
  px(ctx, '0', 111, GROUND - 27, 1, 3);
  px(ctx, 'h', 112, GROUND - 28, 2, 1);
  px(ctx, 'h', 113, GROUND - 27, 1, 2);
}

export function drawFacade(ctx, timeKey, { open = 0, cat = false, s = 0, weather = 'hare' } = {}) {
  const t = lookOf(timeKey, weather);
  const lit = t.lit === true;
  drawSkyAndGround(ctx, t);
  drawBuilding(ctx);
  WINDOWS.forEach((w, i) => { drawWindowFrame(ctx, w); drawWindowGlass(ctx, w, t, lit, i); });
  // 窓辺に ゆかし（中から 外を 見ている）
  if (cat) drawSprite(ctx, yukashiFront, WINDOWS[1].x + 50, WINDOWS[1].y + WINDOWS[1].h - 18);
  drawDoor(ctx, open, lit);
  drawSignAndPlants(ctx);
  if (weather === 'ame') drawUmbrellaStand(ctx);

  const base = FACADE_LIGHT[timeKey];
  const dim = weather === 'ame' ? [0.78, 0.8, 0.9] : weather === 'kiri' ? [0.92, 0.92, 0.96] : [1, 1, 1];
  const L = { ...base, ambient: base.ambient.map((v, i) => v * dim[i]) };
  const key = `facade-${timeKey}-${weather}`;
  drawFacade.maps ??= {};
  drawFacade.maps[key] ??= makeLightMap(FACADE_W, FACADE_H, L);
  const skip = new Uint8Array(FACADE_W * FACADE_H);
  // 空と、灯りの もれる 窓・ドアは 暗くしない（窓の 中の ゆかしも 店の 灯りの 色の まま）
  const mark = r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) skip[y * FACADE_W + x] = 1; };
  mark({ x: 0, y: 0, w: 14, h: GROUND });
  mark({ x: 306, y: 0, w: 14, h: 56 });
  if (lit) WINDOWS.forEach(mark);
  if (lit || open > 0) mark(DOOR);
  applyLightMap(ctx, FACADE_W, FACADE_H, drawFacade.maps[key], skip);
  if (timeKey === 'yoru') { px(ctx, 'k', 303, 64, 8, 2); }
  // 星（晴れた 夜）
  if (timeKey === 'yoru' && weather === 'hare') [[30, 3], [90, 6], [260, 2], [310, 8], [6, 10]].forEach(([x, y], i) => { if (Math.floor(s + i) % 5) px(ctx, 'p', x, y); });

  if (weather === 'ame') {
    // ぬれた 石畳に、窓の 灯りが 映る
    for (const w of WINDOWS) {
      for (let k = 0; k < 5; k++) px(ctx, lit ? 'j' : 'b', w.x + 8 + k * 15, GROUND + 6 + (k % 3) * 5, 8 - (k % 3) * 2, 1);
    }
    drawRain(ctx, { x: 0, y: 0, w: FACADE_W, h: FACADE_H }, s, timeKey === 'yoru' ? 'n' : 'p', 140);
  }
  if (weather === 'kiri') {
    // 上ほど 濃い 霧（坂の 上へ 行くほど 白く かすむ）
    drawFog(ctx, { x: 0, y: 0, w: FACADE_W, h: FACADE_H }, 'c', s, 0.22, false);
    drawFog(ctx, { x: 0, y: 0, w: FACADE_W, h: 62 }, 'c', s, 0.2, false);
  }
}
