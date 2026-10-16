// 店の 景色。角の テーブル席から 店全体を 見わたした 引きの 絵（320×180）。
// 配置は docs/shop.md を 見てね。
import { drawSprite, px, line, light, seeded } from './pixel.js';
import { cup, clock, okuno, yukashi, monsteraLeaf } from './sprites.js';

export const SCENE_W = 320;
export const SCENE_H = 180;

const FLOOR = 118;
const WIN = { x: 16, y: 30, w: 88, h: 54 };
const COUNTER = { x: 148, y: 96, w: 100 };
const SHELF = { x: 272, y: 18, w: 44 };
const PENDANTS = [
  { x: 58, len: 12 },
  { x: 178, len: 18 },
  { x: 222, len: 18 },
];

// 住人の 居場所（クリックの 当たり判定にも 使う）
export const SPOTS = {
  okuno: { x: 192, y: 78, w: okuno.w, h: 18 },
  yukashi: { x: 62, y: WIN.y + WIN.h + 3 - 11, w: yukashi.w, h: yukashi.h },
  cup: { x: 168, y: 150, w: cup.w, h: cup.h },
  clock: { x: 120, y: 26, w: 16, h: 16 },
};

const TOWN_BEAM = [
  [WIN.x + 4, FLOOR], [WIN.x + WIN.w + 6, FLOOR],
  [WIN.x + WIN.w + 70, 162], [WIN.x + 50, 162],
];

const TABLE_LAMP = { x: 244, y: 150 };
const pendantLights = (r, color) => PENDANTS.map(p => ({ x: p.x, y: 14 + p.len + 5, r, color, squash: 0.8 }));

export const TIMES = {
  asa: {
    label: '朝',
    sky: ['p', 'p', 'o'], town: '7', townDark: 'b', roof: 'h', tree: ['e', 'f'],
    ambient: [0.7, 0.72, 0.8],
    lamps: [{ x: 60, y: 56, r: 130, color: [0.38, 0.37, 0.32] }],
    beams: [{ poly: TOWN_BEAM, color: [0.22, 0.21, 0.16] }],
  },
  hiru: {
    label: '昼',
    sky: ['o', 'o', 'p'], town: '8', townDark: 'b', roof: 'h', tree: ['e', 'f'],
    ambient: [0.84, 0.82, 0.78],
    lamps: [{ x: 60, y: 56, r: 140, color: [0.3, 0.3, 0.26] }],
    beams: [{ poly: TOWN_BEAM, color: [0.26, 0.24, 0.16] }],
  },
  yu: {
    label: '夕',
    sky: ['h', 'i', 'j'], town: '2', townDark: 'g', roof: '1', tree: ['1', 'g'],
    ambient: [0.5, 0.4, 0.4],
    lamps: [
      { x: 60, y: 56, r: 130, color: [0.6, 0.32, 0.12] },
      ...pendantLights(50, [0.32, 0.22, 0.1]),
      { ...TABLE_LAMP, r: 50, color: [0.4, 0.28, 0.12] },
    ],
    beams: [{ poly: TOWN_BEAM, color: [0.45, 0.24, 0.08] }],
    lit: true,
  },
  yoru: {
    label: '夜',
    sky: ['l', 'l', 'm'], town: '0', townDark: '0', roof: '0', tree: ['0', '1'],
    stars: true, windowsLit: true,
    ambient: [0.27, 0.27, 0.4],
    lamps: [
      ...pendantLights(84, [1.0, 0.72, 0.38]),
      { ...TABLE_LAMP, r: 90, color: [0.95, 0.68, 0.34], squash: 1.2 },
    ],
    lit: true,
  },
};

export function timeKeyOf(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 10) return 'asa';
  if (h >= 10 && h < 16) return 'hiru';
  if (h >= 16 && h < 19) return 'yu';
  return 'yoru';
}

export function drawClockHands(ctx, x, y, date) {
  const cx = x + 7.5, cy = y + 7.5;
  const m = date.getMinutes() + date.getSeconds() / 60;
  const h = (date.getHours() % 12) + m / 60;
  const hand = (turn, len, key) => {
    const a = turn * Math.PI * 2 - Math.PI / 2;
    line(ctx, key, cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
  };
  hand(h / 12, 3, '0');
  hand(m / 60, 5, '1');
}

// ---- 部屋の 骨組み ----

function drawRoom(ctx) {
  // 天井と 梁
  px(ctx, '1', 0, 0, SCENE_W, 16);
  for (let x = 6; x < SCENE_W; x += 44) px(ctx, '0', x, 0, 2, 10);
  px(ctx, '2', 0, 10, SCENE_W, 4);
  px(ctx, '3', 0, 10, SCENE_W, 1);
  px(ctx, '0', 0, 14, SCENE_W, 2);

  // 壁（細い 縦じまの 壁紙）
  px(ctx, '3', 0, 16, SCENE_W, FLOOR - 16);
  for (let x = 3; x < SCENE_W; x += 8) {
    for (let y = 17; y < 88; y += 2) px(ctx, '2', x, y);
  }

  // 腰板
  px(ctx, '6', 0, 88, SCENE_W, 1);
  px(ctx, '5', 0, 89, SCENE_W, 2);
  px(ctx, '1', 0, 91, SCENE_W, 1);
  px(ctx, '2', 0, 92, SCENE_W, FLOOR - 92);
  for (let x = 4; x < SCENE_W; x += 26) {
    px(ctx, '1', x, 95, 20, 1);
    px(ctx, '1', x, 95, 1, 17);
    px(ctx, '3', x + 1, 111, 19, 1);
    px(ctx, '3', x + 19, 96, 1, 15);
  }
  px(ctx, '1', 0, FLOOR - 4, SCENE_W, 4);

  // 床：手前ほど 板が 太く 見える
  px(ctx, '4', 0, FLOOR, SCENE_W, SCENE_H - FLOOR);
  const rnd = seeded(7);
  const rows = [FLOOR, 121, 125, 130, 136, 143, 151, 160, 170, 181];
  for (let i = 0; i < rows.length - 1; i++) {
    px(ctx, '3', 0, rows[i], SCENE_W, 1);
    const gap = 30 + i * 8;
    for (let x = Math.floor(rnd() * gap); x < SCENE_W; x += gap) px(ctx, '3', x, rows[i], 1, rows[i + 1] - rows[i]);
    // 木目
    for (let k = 0; k < 6; k++) px(ctx, '5', Math.floor(rnd() * SCENE_W), rows[i] + 1 + Math.floor(rnd() * (rows[i + 1] - rows[i] - 1)), 3 + Math.floor(rnd() * 5), 1);
  }
}

// ---- 窓と 外の 景色 ----

function windowPanes() {
  // 外が 見える ガラスの 部分（わくを 除いた 長方形）
  const panes = [];
  const cols = 3, colW = (WIN.w - 2 * (cols - 1)) / cols;
  const rowsY = [[WIN.y, 14], [WIN.y + 16, WIN.h - 16]];
  for (const [py, ph] of rowsY) {
    for (let c = 0; c < cols; c++) panes.push({ x: Math.round(WIN.x + c * (colW + 2)), y: py, w: Math.floor(colW), h: ph });
  }
  return panes;
}

function drawOutside(ctx, t) {
  const { x, y, w, h } = WIN;
  const band = Math.ceil(h / 3);
  t.sky.forEach((key, i) => px(ctx, key, x, y + i * band, w, Math.min(band, h - i * band)));
  if (t.stars) [[6, 4], [22, 9], [40, 3], [57, 7], [75, 2], [83, 11], [31, 15]].forEach(([sx, sy]) => px(ctx, 'p', x + sx, y + sy));

  // 坂の 町：下へ 行くほど 手前の 家
  const rnd = seeded(21);
  for (let layer = 0; layer < 2; layer++) {
    const key = layer === 0 ? t.townDark : t.town;
    const base = y + h - (layer === 0 ? 14 : 4);
    for (let bx = x - 4; bx < x + w; ) {
      const bw = 7 + Math.floor(rnd() * 8);
      const bh = Math.max(3, 4 + Math.floor(rnd() * (layer === 0 ? 7 : 5)) - (bx - x) / 14);
      px(ctx, key, bx, base - bh, bw, y + h - (base - bh));
      px(ctx, layer === 0 ? key : t.roof, bx - 1, base - bh - 2, bw + 2, 2); // 屋根
      px(ctx, layer === 0 ? key : t.roof, bx + 1, base - bh - 3, bw - 2, 1);
      if (t.windowsLit) {
        for (let k = 0; k < 2; k++) if (rnd() < 0.6) px(ctx, 'k', bx + 2 + Math.floor(rnd() * (bw - 3)), base - bh + 3 + Math.floor(rnd() * 4));
      }
      bx += bw + Math.floor(rnd() * 3);
    }
  }
  // 坂の 上の 天文台
  px(ctx, t.townDark, x + 8, y + 24, 8, 6);
  px(ctx, t.townDark, x + 9, y + 22, 6, 2);
  px(ctx, t.townDark, x + 10, y + 21, 4, 1);

  // 通りの 向かいの 木
  const [dark, lightKey] = t.tree;
  const cx = x + 72, cy = y + 30;
  for (let j = -18; j <= 18; j++) {
    for (let i = -18; i <= 18; i++) {
      const r = Math.hypot(i, j * 1.15) + Math.sin(i * 1.7 + j) * 1.5;
      if (r < 17) px(ctx, (i + j < -8 && r < 14) ? lightKey : dark, cx + i, cy + j);
    }
  }
  px(ctx, dark, cx - 1, cy + 14, 3, y + h - (cy + 14));
}

function drawWindow(ctx, t, mask) {
  drawOutside(ctx, t);
  const { x, y, w, h } = WIN;
  // わく
  px(ctx, '1', x - 3, y - 3, w + 6, 3);
  px(ctx, '1', x - 3, y + h, w + 6, 2);
  px(ctx, '1', x - 3, y, 3, h);
  px(ctx, '1', x + w, y, 3, h);
  px(ctx, '1', x, y + 14, w, 2);
  const colW = (w - 4) / 3;
  px(ctx, '1', Math.round(x + colW), y, 2, h);
  px(ctx, '1', Math.round(x + 2 * colW + 2), y, 2, h);
  px(ctx, '2', x - 3, y - 3, w + 6, 1);
  for (const p of windowPanes()) markRect(mask, p);

  // 窓台
  const sy = y + h + 2;
  px(ctx, '7', x - 6, sy, w + 12, 1);
  px(ctx, '5', x - 6, sy + 1, w + 12, 2);
  px(ctx, '1', x - 4, sy + 3, w + 8, 1);

  // カーテン（左右に まとめてある）
  px(ctx, '0', x - 10, y - 7, w + 20, 1);
  for (const [cx0, dir] of [[x - 10, 1], [x + w + 1, -1]]) {
    for (let i = 0; i < 9; i++) {
      const cy0 = y - 6, ch = 50 + Math.round(Math.sin(i * 0.7) * 2) + (dir > 0 ? i : 8 - i);
      px(ctx, i % 3 === 0 ? '7' : '8', cx0 + i, cy0, 1, ch);
    }
    px(ctx, 'h', cx0 + (dir > 0 ? 3 : 2), y + 26, 4, 2); // タッセル
  }
}

function drawWindowsill(ctx) {
  const sy = WIN.y + WIN.h + 2;
  // サボテン 三つ
  [[26, 6], [36, 8], [46, 5]].forEach(([cx, ch], i) => {
    px(ctx, 'e', cx + 1, sy - 3 - ch, 3, ch);
    px(ctx, 'f', cx + 1, sy - 3 - ch, 1, ch);
    if (i === 1) { px(ctx, 'e', cx + 4, sy - 3 - 6, 2, 1); px(ctx, 'e', cx + 5, sy - 3 - 8, 1, 3); }
    px(ctx, 'h', cx, sy - 3, 5, 3);
    px(ctx, 'i', cx, sy - 3, 5, 1);
  });
  drawSprite(ctx, yukashi, SPOTS.yukashi.x, SPOTS.yukashi.y);
}

// ---- 窓ぎわの テーブル ----

function drawChair(ctx, x, facing) {
  const seatY = 134;
  const backX = facing > 0 ? x : x + 10;
  px(ctx, '1', backX, seatY - 18, 2, 34);
  px(ctx, '2', backX, seatY - 18, 1, 18);
  px(ctx, '1', backX - (facing > 0 ? 0 : 3), seatY - 18, 5, 2);
  px(ctx, '1', backX - (facing > 0 ? 0 : 3), seatY - 11, 5, 1);
  px(ctx, '4', x, seatY, 12, 2);
  px(ctx, '1', x, seatY + 2, 12, 1);
  px(ctx, '1', facing > 0 ? x + 10 : x, seatY + 2, 2, 14);
}

function drawWindowTable(ctx) {
  // 色あせた 絨毯
  px(ctx, 'g', 12, 145, 94, 12);
  px(ctx, 'h', 14, 146, 90, 1);
  px(ctx, 'h', 14, 155, 90, 1);
  for (let x = 18; x < 102; x += 6) px(ctx, 'i', x, 150, 2, 2);

  drawChair(ctx, 18, 1);
  drawChair(ctx, 86, -1);
  px(ctx, '5', 32, 124, 46, 2);
  px(ctx, '6', 32, 124, 46, 1);
  px(ctx, '2', 32, 126, 46, 2);
  px(ctx, '1', 53, 128, 4, 20);
  px(ctx, '1', 46, 147, 18, 2);
  // 一輪挿し
  px(ctx, 'p', 54, 119, 2, 5);
  px(ctx, 'e', 55, 114, 1, 5);
  px(ctx, 'j', 54, 112, 3, 2);
}

// ---- 中央の 壁 ----

function drawWallThings(ctx, date) {
  drawSprite(ctx, clock, SPOTS.clock.x, SPOTS.clock.y);
  drawClockHands(ctx, SPOTS.clock.x, SPOTS.clock.y, date);

  // おくのさんの 空想地図
  const mx = 112, my = 50, mw = 30, mh = 24;
  px(ctx, '1', mx - 2, my - 2, mw + 4, mh + 4);
  px(ctx, '8', mx, my, mw, mh);
  px(ctx, 'p', mx + 18, my + 2, 10, 7); // 湖
  const rnd = seeded(3);
  for (let k = 0; k < 5; k++) {
    let ax = mx + 2 + Math.floor(rnd() * (mw - 4)), ay = my + 2 + Math.floor(rnd() * (mh - 4));
    for (let s = 0; s < 8; s++) {
      px(ctx, '6', ax, ay);
      ax = Math.min(mx + mw - 2, Math.max(mx + 1, ax + Math.round(rnd() * 4 - 2)));
      ay = Math.min(my + mh - 2, Math.max(my + 1, ay + Math.round(rnd() * 2 - 1)));
    }
  }
  [[6, 6], [14, 15], [24, 18], [8, 19]].forEach(([dx, dy]) => px(ctx, 'h', mx + dx, my + dy));
}

// ---- カウンター ----

function drawBackBar(ctx) {
  const x0 = COUNTER.x + 4, x1 = COUNTER.x + COUNTER.w - 4;
  // 黒板の メニュー
  px(ctx, '1', 194, 22, 42, 18);
  px(ctx, 'd', 196, 24, 38, 14);
  [[199, 27, 14], [199, 31, 20], [199, 35, 11], [222, 27, 8], [222, 31, 9]].forEach(([x, y, w]) => {
    for (let i = 0; i < w; i += 2) px(ctx, 'c', x + i, y);
  });

  const rnd = seeded(11);
  for (const sy of [48, 68]) {
    // 棚に 並ぶ もの
    for (let x = x0 + 2; x < x1 - 6; ) {
      const kind = rnd();
      if (kind < 0.4) { // カップ
        px(ctx, 'c', x, sy - 4, 4, 4); px(ctx, '9', x, sy - 4, 4, 1); px(ctx, 'c', x + 4, sy - 3, 1, 2);
        x += 7;
      } else if (kind < 0.75) { // 豆の 瓶
        px(ctx, 'a', x, sy - 9, 6, 9); px(ctx, rnd() < 0.5 ? '2' : '1', x + 1, sy - 6, 4, 6); px(ctx, 'p', x + 1, sy - 8, 1, 2); px(ctx, '5', x + 1, sy - 10, 4, 1);
        x += 8;
      } else { // 瓶
        px(ctx, 'e', x + 1, sy - 11, 2, 3); px(ctx, rnd() < 0.5 ? 'e' : 'g', x, sy - 8, 4, 8);
        x += 6;
      }
    }
    px(ctx, '6', x0, sy, x1 - x0, 1);
    px(ctx, '5', x0, sy + 1, x1 - x0, 1);
    px(ctx, '1', x0, sy + 2, x1 - x0, 1);
  }
}

function drawCounter(ctx, t) {
  drawSprite(ctx, okuno, SPOTS.okuno.x, SPOTS.okuno.y);

  const { x, y, w } = COUNTER;
  const bottom = 122;
  px(ctx, '7', x - 2, y, w + 4, 1);
  px(ctx, '6', x - 2, y + 1, w + 4, 2);
  px(ctx, '1', x - 2, y + 3, w + 4, 1);
  px(ctx, '3', x, y + 4, w, bottom - y - 4);
  for (let px0 = x + 4; px0 < x + w - 8; px0 += 24) {
    px(ctx, '2', px0, y + 8, 20, 1);
    px(ctx, '2', px0, y + 8, 1, 12);
    px(ctx, '4', px0 + 1, y + 20, 19, 1);
  }
  px(ctx, '1', x, bottom - 3, w, 3);

  // カウンターの 上：ミル、サイフォン、ミント
  px(ctx, '2', 160, 88, 7, 8); px(ctx, '5', 161, 84, 5, 4); px(ctx, '0', 166, 85, 4, 1); px(ctx, '0', 169, 85, 1, 3);
  px(ctx, '0', 214, 95, 8, 1); px(ctx, 'p', 216, 86, 4, 6); px(ctx, '2', 216, 89, 4, 3); px(ctx, 'p', 217, 80, 2, 6); px(ctx, '0', 215, 92, 6, 3);
  px(ctx, 'h', 236, 91, 7, 5); px(ctx, 'i', 236, 91, 7, 1);
  [[235, 88], [238, 86], [241, 88], [237, 89], [240, 89]].forEach(([lx, ly]) => { px(ctx, 'f', lx, ly, 2, 2); px(ctx, 'e', lx + 1, ly + 1); });

  // ジュークボックス
  const jx = 252, jy = 80, jw = 18;
  for (let i = 0; i < 6; i++) px(ctx, '5', jx + Math.max(0, 5 - i * 2), jy + i, jw - 2 * Math.max(0, 5 - i * 2), 1);
  px(ctx, '5', jx, jy + 6, jw, 122 - jy - 6);
  px(ctx, '4', jx + jw - 3, jy + 6, 3, 122 - jy - 6);
  px(ctx, '1', jx + 3, jy + 8, jw - 6, 10);
  for (let i = 0; i < 4; i++) px(ctx, t.lit ? 'k' : '7', jx + 4 + i * 3, jy + 10, 2, 6);
  px(ctx, t.lit ? 'j' : '6', jx + 2, jy + 20, jw - 4, 1);
  px(ctx, '1', jx + 3, jy + 24, jw - 6, 12);
  for (let yy = jy + 26; yy < jy + 36; yy += 2) px(ctx, '3', jx + 4, yy, jw - 8, 1);
  return { lights: { x: jx + 2, y: jy + 8, w: jw - 4, h: 13 } };
}

// ---- 右：本棚と モンステラ ----

function drawBookshelf(ctx) {
  const { x, y, w } = SHELF;
  const bottom = 122;
  px(ctx, '1', x, y, w, bottom - y);
  px(ctx, '2', x + 2, y + 2, w - 4, bottom - y - 4);
  const rnd = seeded(5);
  const bookColors = ['g', 'h', 'e', 'd', 'm', 'n', '5', '7', 'a', '4', '8', 'i'];
  const shelfH = 17;
  for (let sy = y + 2 + shelfH; sy <= bottom - 4; sy += shelfH) {
    const isBottom = sy + shelfH > bottom - 4;
    if (isBottom) { // 麻袋
      for (const bx of [x + 4, x + 20]) {
        px(ctx, '6', bx, sy - 12, 16, 12); px(ctx, '7', bx + 1, sy - 12, 14, 1); px(ctx, '5', bx + 2, sy - 6, 12, 1); px(ctx, '6', bx + 5, sy - 14, 6, 2);
      }
    } else {
      for (let bx = x + 3; bx < x + w - 4; ) {
        const bw = 2 + Math.floor(rnd() * 3);
        if (bx + bw > x + w - 3) break;
        const bh = 9 + Math.floor(rnd() * 6);
        const key = bookColors[Math.floor(rnd() * bookColors.length)];
        if (rnd() < 0.08 && bx + 10 < x + w - 3) { // 寝かせた 本
          px(ctx, key, bx, sy - 3, 10, 3); px(ctx, '8', bx + 1, sy - 2, 8, 1);
          bx += 11; continue;
        }
        px(ctx, key, bx, sy - bh, bw, bh);
        px(ctx, '0', bx + bw - 1, sy - bh, 1, bh);
        if (rnd() < 0.4) px(ctx, 'k', bx, sy - bh + 2, bw - 1, 1);
        bx += bw;
      }
    }
    px(ctx, '5', x + 2, sy, w - 4, 2);
    px(ctx, '1', x + 2, sy + 2, w - 4, 1);
  }
  // 棚の 上の シダ
  const fx = x + 22, fy = y - 1;
  px(ctx, 'h', fx - 4, fy - 4, 9, 5); px(ctx, 'i', fx - 4, fy - 4, 9, 1);
  for (let a = -3; a <= 3; a++) {
    for (let s = 0; s < 11; s++) {
      const lx = fx + Math.round(a * s * 0.9), ly = fy - 5 - Math.round(s * (1.4 - Math.abs(a) * 0.35) - (Math.abs(a) * s * s) * -0.06);
      px(ctx, s % 2 ? 'e' : 'f', lx, ly);
      if (s % 2 === 0 && s > 2) px(ctx, 'e', lx + (a < 0 ? -1 : 1), ly + 1);
    }
  }
}

function drawPothos(ctx) {
  // 窓の 右上、梁から 吊るした ポトス
  const hx = 110;
  px(ctx, '0', hx, 14, 1, 8);
  px(ctx, 'h', hx - 4, 22, 9, 5); px(ctx, 'i', hx - 4, 22, 9, 1); px(ctx, 'g', hx - 3, 26, 7, 1);
  const rnd = seeded(9);
  [[-5, 40], [-2, 26], [2, 48], [5, 32]].forEach(([dx, len]) => {
    let vx = hx + dx;
    for (let s = 0; s < len; s++) {
      const vy = 25 + s;
      if (s % 3 === 0) vx += Math.round(rnd() * 2 - 1);
      px(ctx, 'e', vx, vy);
      if (s % 4 === 1) { px(ctx, 'f', vx + 1, vy, 2, 2); px(ctx, 'e', vx + 2, vy + 1); }
      if (s % 4 === 3) { px(ctx, 'f', vx - 2, vy, 2, 2); px(ctx, 'e', vx - 2, vy + 1); }
    }
  });
}

function drawMonstera(ctx) {
  const px0 = 288, py0 = 148;
  // 葉（奥から 手前へ）。奥の 葉は 影の 色で
  const leaves = [
    [274, 92, true], [296, 84, true], [262, 110, false],
    [300, 104, false], [282, 100, false], [276, 122, false],
  ];
  for (const [lx, ly, shade] of leaves) {
    line(ctx, shade ? '3' : '4', px0 + 11, py0, lx + 10, ly + 14);
    drawSprite(ctx, monsteraLeaf, lx, ly, { swap: shade ? { f: 'e', e: 'd' } : undefined });
  }
  // 鉢
  px(ctx, 'h', px0, py0, 22, 4); px(ctx, 'i', px0, py0, 22, 1);
  px(ctx, 'h', px0 + 2, py0 + 4, 18, 16); px(ctx, 'g', px0 + 14, py0 + 4, 6, 16);
  px(ctx, '1', px0 + 1, py0 + 20, 20, 2);
}

// ---- 手前：自分の テーブル ----

function drawMyTable(ctx) {
  const y = 162;
  px(ctx, '1', 36, y - 1, 250, 1);
  px(ctx, '6', 36, y, 250, 1);
  px(ctx, '5', 36, y + 1, 250, SCENE_H - y);
  const rnd = seeded(13);
  for (let k = 0; k < 30; k++) px(ctx, '4', 40 + Math.floor(rnd() * 240), y + 3 + Math.floor(rnd() * 15), 6 + Math.floor(rnd() * 14), 1);
  // 開いた 本
  const bx = 108, by = 166;
  px(ctx, '0', bx - 1, by - 1, 38, 13);
  px(ctx, '9', bx, by, 17, 11); px(ctx, '8', bx + 19, by, 17, 11); px(ctx, '7', bx + 17, by, 2, 11);
  for (let l = 0; l < 4; l++) { px(ctx, 'b', bx + 2, by + 2 + l * 2, 13 - (l === 3 ? 6 : 0), 1); px(ctx, 'b', bx + 21, by + 2 + l * 2, 13, 1); }
  drawSprite(ctx, cup, SPOTS.cup.x, SPOTS.cup.y);
}

// 自分の テーブルの 小さな ランプ。夕方から 灯る。
function drawTableLamp(ctx, t, mask) {
  const { x } = TABLE_LAMP;
  px(ctx, '1', x - 4, 160, 9, 2);
  px(ctx, '0', x, 146, 1, 14);
  px(ctx, 'h', x - 3, 138, 7, 1);
  px(ctx, 'h', x - 4, 139, 9, 3);
  px(ctx, 'h', x - 5, 142, 11, 3);
  px(ctx, 'g', x - 5, 144, 11, 1);
  px(ctx, t.lit ? 'k' : 'b', x - 3, 145, 7, 1);
  if (t.lit) markRect(mask, { x: x - 3, y: 145, w: 7, h: 1 });
}

// ---- ランプ ----

function drawPendants(ctx, t, mask) {
  for (const p of PENDANTS) {
    const sy = 14 + p.len;
    px(ctx, '0', p.x, 14, 1, p.len);
    px(ctx, 'h', p.x - 3, sy, 7, 1);
    px(ctx, 'h', p.x - 5, sy + 1, 11, 2);
    px(ctx, 'g', p.x - 5, sy + 3, 11, 1);
    px(ctx, t.lit ? 'k' : 'b', p.x - 2, sy + 4, 5, 1);
    if (t.lit) markRect(mask, { x: p.x - 2, y: sy + 4, w: 5, h: 1 });
  }
}

function markRect(mask, r) {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) mask[y * SCENE_W + x] = 1;
}

export function drawScene(ctx, timeKey, date = new Date()) {
  const t = TIMES[timeKey];
  const mask = new Uint8Array(SCENE_W * SCENE_H); // 1 = 光を あてない（外の 景色、灯り そのもの）

  drawRoom(ctx);
  drawWindow(ctx, t, mask);
  const outside = ctx.getImageData(WIN.x, WIN.y, WIN.w, WIN.h).data;
  drawWindowsill(ctx);
  drawWallThings(ctx, date);
  drawBackBar(ctx);
  const { lights } = drawCounter(ctx, t);
  if (t.lit) markRect(mask, lights);
  drawBookshelf(ctx);
  drawWindowTable(ctx);
  drawPothos(ctx);
  drawPendants(ctx, t, mask);
  drawMonstera(ctx);
  drawMyTable(ctx);
  drawTableLamp(ctx, t, mask);

  // 窓の 前に 描いた もの（ゆかし、サボテン、ポトス）には 光を あてる
  const now = ctx.getImageData(WIN.x, WIN.y, WIN.w, WIN.h).data;
  for (let j = 0; j < WIN.h; j++) {
    for (let i = 0; i < WIN.w; i++) {
      const o = (j * WIN.w + i) * 4;
      if (now[o] !== outside[o] || now[o + 1] !== outside[o + 1] || now[o + 2] !== outside[o + 2]) {
        mask[(WIN.y + j) * SCENE_W + WIN.x + i] = 0;
      }
    }
  }

  light(ctx, SCENE_W, SCENE_H, {
    ambient: t.ambient,
    lamps: t.lamps,
    beams: t.beams,
    skip: (x, y) => mask[y * SCENE_W + x] === 1,
  });
}
