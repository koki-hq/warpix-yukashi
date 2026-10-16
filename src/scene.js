// 店の 景色。角の テーブル席から 店全体を 見わたした 引きの 絵（320×180）。
// 配置は docs/shop.md を 見てね。
//
// 1コマの 描き方：
//   1. 窓の 外（雲や 鳥が 動く）
//   2. 店の 中（動かない 部分。時間帯ごとに 一度だけ 描いて とっておく）
//   3. 住人と 時計の 針（動く）
//   4. 光を あてる（明るさの 表も 時間帯ごとに とっておく）
//   5. 灯り そのものと 湯気（光の 影響を 受けない）
import { drawSprite, px, line, seeded, makeLightMap, applyLightMap } from './pixel.js';
import { COLOR } from './palette.js';
import { seasonOf, moonPhase } from './koyomi.js';
import {
  cup, clock, okuno, okunoLook, okunoDown, monsteraLeaf,
  yukashi, yukashiEar, yukashiLoaf, yukashiFront, yukashiFrontBlink,
  plate, pudding, toast, lemonCake,
} from './sprites.js';

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
  jukebox: { x: 252, y: 74, w: 18, h: 48 },
  // 本棚に まぎれた、リボンの はみ出た 帳面。開くと スケッチ帳
  notebook: { x: SHELF.x + 26, y: SHELF.y + 2 + 17 * 2 - 13, w: 5, h: 17 },
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

// 天気で 変わる 見た目。雨の 日は 昼でも 店の 灯りを つける。霧と 雨は 日が 差さない
const WEATHER_SKY = {
  ame: { asa: ['a', 'b', 'b'], hiru: ['a', 'b', 'b'], yu: ['2', 'g', 'a'], yoru: ['l', 'l', 'l'] },
  kiri: { asa: ['c', 'c', 'p'], hiru: ['c', 'c', 'p'], yu: ['b', 'c', 'c'], yoru: ['m', 'm', 'n'] },
  yuki: { asa: ['b', 'c', 'c'], hiru: ['b', 'c', 'c'], yu: ['a', 'b', 'b'], yoru: ['m', 'm', 'l'] },
};
const WEATHER_DIM = { ame: [0.8, 0.82, 0.9], kiri: [0.92, 0.92, 0.96], yuki: [0.9, 0.9, 0.98] };
export function lookOf(timeKey, weather = 'hare') {
  const t = TIMES[timeKey];
  if (weather === 'hare') return t;
  const dim = WEATHER_DIM[weather];
  const lamps = t.lamps.map(L => (L.x === 60 && L.y === 56 ? { ...L, color: L.color.map(c => c * 0.45) } : L));
  const daytime = timeKey === 'asa' || timeKey === 'hiru';
  const gloomy = weather === 'ame' || weather === 'yuki';
  if (gloomy && daytime) {
    lamps.push(...pendantLights(60, [0.45, 0.32, 0.16]), { ...TABLE_LAMP, r: 55, color: [0.4, 0.28, 0.13] });
  }
  return {
    ...t,
    sky: WEATHER_SKY[weather][timeKey],
    stars: false,
    ambient: t.ambient.map((v, i) => v * dim[i]),
    lamps,
    beams: [],
    lit: t.lit || (gloomy && daytime),
    weather,
  };
}

// 季節の 木の 色：[影, 明るい ところ]。冬は 葉が ない（null）
const SEASON_TREE = {
  haru: { day: ['r', 'q'], yu: ['h', 'r'] },
  natsu: { day: ['d', 'e'], yu: ['1', 'g'] },
  aki: { day: ['h', 'i'], yu: ['g', 'h'] },
  fuyu: null,
};
// 舞う もの：春は 花びら、秋は 落ち葉
const FALLING = { haru: 'q', aki: 'i' };

// 月：満ち欠けは 本当の 月と 同じ。夜の あいだ、窓の 左から 右へ 渡っていく
function drawMoon(ctx, date) {
  const phase = moonPhase(date);
  const h = date.getHours() + date.getMinutes() / 60;
  const p = (((h - 19 + 24) % 24) / 10);
  if (p > 1) return;
  const cx = WIN.x + 8 + p * (WIN.w - 16), cy = WIN.y + 12 - Math.sin(p * Math.PI) * 7;
  const R = 3.6;
  const c = Math.cos(phase * Math.PI * 2);
  for (let j = -4; j <= 4; j++) {
    for (let i = -4; i <= 4; i++) {
      const nx = i / R, ny = j / R;
      if (nx * nx + ny * ny > 1) continue;
      const hw = Math.sqrt(1 - ny * ny);
      const lit = phase < 0.5 ? nx > hw * c : nx < -hw * c;
      px(ctx, lit ? (nx * nx + ny * ny < 0.3 ? '9' : '8') : 'm', Math.round(cx + i), Math.round(cy + j));
    }
  }
}

function drawBareTree(ctx, cx, cy, key, snow) {
  line(ctx, key, cx, cy + 16, cx, cy - 8);
  line(ctx, key, cx + 1, cy + 16, cx + 1, cy - 4);
  const branches = [[-14, -12], [12, -14], [-10, 0], [14, -2], [-17, -4], [6, -18], [-5, -16]];
  for (const [bx, by] of branches) {
    line(ctx, key, cx, cy + by / 3, cx + bx, cy + by);
    if (snow) px(ctx, 'c', cx + bx, cy + by - 1, 2, 1);
  }
}

// 雪：ふわふわ ゆれながら ゆっくり 降る
export function drawSnow(ctx, r, s, count) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  for (let k = 0; k < count; k++) {
    const fall = (hash(k + 30) * r.h + s * 9 * (0.6 + hash(k + 3) * 0.7)) % (r.h + 4);
    const x = r.x + hash(k) * r.w + Math.sin(s * 0.9 + k) * 2.5;
    const big = hash(k + 11) < 0.25;
    px(ctx, '9', Math.round(x), r.y - 2 + Math.floor(fall), big ? 2 : 1, big ? 2 : 1);
  }
  ctx.restore();
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

// 雲：ゆっくり 右へ 流れる。本当の 時刻から 位置が 決まるので、いつ 開いても 続きから
const CLOUDS = [
  { y: 4, speed: 1 / 9, offset: 10, parts: [[3, 0, 8, 1], [0, 1, 16, 2], [5, 3, 12, 1]] },
  { y: 12, speed: 1 / 14, offset: 70, parts: [[2, 0, 6, 1], [0, 1, 11, 1], [4, 2, 9, 1]] },
  { y: 2, speed: 1 / 20, offset: 120, parts: [[4, 0, 10, 1], [0, 1, 20, 2], [3, 3, 8, 1]] },
];
const CLOUD_COLOR = { asa: ['c', '9'], hiru: ['c', '9'], yu: ['j', 'k'], yoru: ['m', 'm'] };

function drawOutside(ctx, t, timeKey, s) {
  const { x, y, w, h } = WIN;
  const band = Math.ceil(h / 3);
  t.sky.forEach((key, i) => px(ctx, key, x, y + i * band, w, Math.min(band, h - i * band)));
  if (t.stars) {
    [[6, 4], [22, 9], [40, 3], [57, 7], [75, 2], [83, 11], [31, 15]].forEach(([sx, sy], i) => {
      if (!happening(s, 7, 0.6, 0.5, i)) px(ctx, 'p', x + sx, y + sy); // ときどき またたく
    });
  }
  if (timeKey === 'yoru' && (t.weather === undefined || t.weather === 'kiri')) drawMoon(ctx, new Date(s * 1000));

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const [shade, lit] = t.weather === 'ame' ? ['a', 'a'] : CLOUD_COLOR[timeKey];
  for (const c of CLOUDS) {
    const span = w + 40;
    const cx = x - 20 + (((c.offset + s * c.speed) % span) + span) % span;
    c.parts.forEach(([dx, dy, cw, ch], i) => px(ctx, i === c.parts.length - 1 ? shade : lit, Math.floor(cx + dx), y + c.y + dy, cw, ch));
  }
  // 鳥：昼の あいだ、ときどき 横切る
  if ((timeKey === 'asa' || timeKey === 'hiru') && !t.weather) {
    const p = happening(s, 80, 7, 0.7, 3);
    if (p !== false) {
      const bx = Math.floor(x - 4 + p * (w + 8)), by = Math.floor(y + 14 + Math.sin(p * 9) * 3);
      const up = Math.floor(s * 6) % 2 === 0;
      px(ctx, '1', bx, by + (up ? 0 : 1)); px(ctx, '1', bx + 1, by + 1); px(ctx, '1', bx + 2, by + (up ? 0 : 1));
    }
  }
  ctx.restore();

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
      if (t.weather === 'yuki') px(ctx, 'c', bx - 1, base - bh - 3, bw + 2, 1); // 屋根の 雪
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

  // 通りの 向かいの 木：季節で 色が 変わる。冬は 葉が 落ちて 枝だけ
  const date = new Date(s * 1000);
  const season = seasonOf(date);
  const leaves = SEASON_TREE[season];
  const cx = x + 72, cy = y + 30;
  if (!leaves) {
    drawBareTree(ctx, cx, cy, timeKey === 'yoru' ? '0' : timeKey === 'yu' ? '1' : '2', t.weather === 'yuki');
  } else {
    const [dark, lightKey] = timeKey === 'yoru' ? t.tree : timeKey === 'yu' ? leaves.yu : leaves.day;
    for (let j = -18; j <= 18; j++) {
      for (let i = -18; i <= 18; i++) {
        const r = Math.hypot(i, j * 1.15) + Math.sin(i * 1.7 + j) * 1.5;
        if (r < 17) px(ctx, (i + j < -8 && r < 14) ? lightKey : dark, cx + i, cy + j);
      }
    }
    px(ctx, timeKey === 'yoru' ? '0' : '2', cx - 1, cy + 14, 3, y + h - (cy + 14));
    // 花びらや 落ち葉が、ときどき 舞う（晴れた 昼間）
    const fallKey = FALLING[season];
    if (fallKey && t.weather === undefined && timeKey !== 'yoru') {
      for (let k = 0; k < 5; k++) {
        const fall = (hash(k + 70) * h + s * (3 + k)) % (h + 10);
        const fx = cx - 20 + hash(k + 71) * 40 - fall * 0.6 + Math.sin(s + k * 2) * 3;
        if (fx > x && fx < x + w) px(ctx, fallKey, Math.round(fx), y + Math.floor(fall) - 5);
      }
    }
  }

  if (t.weather === 'kiri') drawFog(ctx, WIN, t.sky[0], s, 0.55);
  if (t.weather === 'yuki') drawSnow(ctx, WIN, s, 36);
  if (t.weather === 'ame') {
    drawRain(ctx, WIN, s, timeKey === 'yoru' ? 'n' : 'p', 40);
    // ガラスを つたう しずく
    for (let k = 0; k < 4; k++) {
      const dx = x + 6 + Math.floor(hash(k * 5 + 1) * (w - 12));
      const dy = y + Math.floor((s * (2 + k) + hash(k) * h) % h);
      px(ctx, 'c', dx, dy);
      px(ctx, 'b', dx, dy - 1, 1, 2);
    }
  }
}

// 雨：ななめに 降る 短い 線。本当の 時刻から 位置が 決まる
export function drawRain(ctx, r, s, key, count, speed = 110) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  for (let k = 0; k < count; k++) {
    const fall = (hash(k + 50) * (r.h + 8) + s * speed * (0.8 + hash(k + 9) * 0.4)) % (r.h + 8);
    const y = r.y - 4 + Math.floor(fall);
    const x = r.x + Math.floor(hash(k) * (r.w + 10)) - Math.floor(fall / 4);
    for (let i = 0; i < 3; i++) px(ctx, key, x - (i >> 1), y + i);
  }
  ctx.restore();
}

// 霧：うすい 層を かぶせて、その上を 霧の 帯が ゆっくり 流れていく
export function drawFog(ctx, r, key, s = 0, strength = 0.5, bands = true) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.fillStyle = COLOR[key];
  ctx.globalAlpha = strength;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = strength * 0.5;
  for (let k = 0; k < (bands ? 4 : 0); k++) {
    const by = r.y + Math.floor(r.h * (0.12 + k * 0.22));
    const bh = Math.max(2, Math.floor(r.h * 0.07));
    const off = ((s * (1.5 + k * 0.7)) % 50) - 50;
    for (let x = off; x < r.w + 50; x += 50) ctx.fillRect(Math.floor(r.x + x), by, 32, bh);
  }
  ctx.restore();
}

function drawWindow(ctx) {
  for (const p of windowPanes()) ctx.clearRect(p.x, p.y, p.w, p.h); // 外が 透けて 見えるように
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

function drawWallThings(ctx) {
  drawSprite(ctx, clock, SPOTS.clock.x, SPOTS.clock.y);

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

function drawCounter(ctx) {
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
  for (let i = 0; i < 4; i++) px(ctx, '7', jx + 4 + i * 3, jy + 10, 2, 6);
  px(ctx, '6', jx + 2, jy + 20, jw - 4, 1);
  px(ctx, '1', jx + 3, jy + 24, jw - 6, 12);
  for (let yy = jy + 26; yy < jy + 36; yy += 2) px(ctx, '3', jx + 4, yy, jw - 8, 1);
}

const JUKEBOX = { x: 252, y: 80, w: 18 };

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
}

// 甘いもの。left は 残りの 割合（1 → 0.5 → 0）
export const SWEETS = {
  toast: { name: 'シナモントースト', sprite: toast },
  pudding: { name: '固めのプリン', sprite: pudding },
  lemon: { name: 'レモンケーキ', sprite: lemonCake },
};
const PLATE = { x: 194, y: 158 };

function drawSweet(ctx, kind, left) {
  drawSprite(ctx, plate, PLATE.x, PLATE.y);
  px(ctx, 'b', PLATE.x + 15, PLATE.y + 1, 5, 1); // フォーク
  px(ctx, 'a', PLATE.x + 19, PLATE.y + 1, 1, 1);
  const sp = SWEETS[kind].sprite;
  const x = PLATE.x + 9 - Math.floor(sp.w / 2), y = PLATE.y + 2 - sp.h;
  if (left >= 1) { drawSprite(ctx, sp, x, y); return; }
  if (left > 0) {
    // 半分 食べた ところ：右半分だけ 残っている
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + Math.floor(sp.w / 2), y, sp.w, sp.h);
    ctx.clip();
    drawSprite(ctx, sp, x, y);
    ctx.restore();
    return;
  }
  // 食べおわり：くずが 少し
  for (const [dx, dy] of [[5, 1], [8, 2], [11, 1]]) px(ctx, sp.rows[3][2], PLATE.x + dx, PLATE.y + dy);
}

// 飲みもの。カップの 中の 色で 見分ける
export const DRINKS = {
  yukashi: { name: 'ゆかしブレンド' },
  tsukimi: { name: '月見ブレンド', swap: { 1: '2', 2: '3', 3: '4' } },
  milk: { name: '霧の朝のミルクコーヒー', swap: { 1: '5', 2: '6', 3: '7' } },
};


// 自分の テーブルの 小さな ランプ。夕方から 灯る。
function drawTableLamp(ctx) {
  const { x } = TABLE_LAMP;
  px(ctx, '1', x - 4, 160, 9, 2);
  px(ctx, '0', x, 146, 1, 14);
  px(ctx, 'h', x - 3, 138, 7, 1);
  px(ctx, 'h', x - 4, 139, 9, 3);
  px(ctx, 'h', x - 5, 142, 11, 3);
  px(ctx, 'g', x - 5, 144, 11, 1);
  px(ctx, 'b', x - 3, 145, 7, 1);
}

function drawPendants(ctx) {
  for (const p of PENDANTS) {
    const sy = 14 + p.len;
    px(ctx, '0', p.x, 14, 1, p.len);
    px(ctx, 'h', p.x - 3, sy, 7, 1);
    px(ctx, 'h', p.x - 5, sy + 1, 11, 2);
    px(ctx, 'g', p.x - 5, sy + 3, 11, 1);
    px(ctx, 'b', p.x - 2, sy + 4, 5, 1);
  }
}

// 本棚に まぎれた 帳面。リボンが 棚板の 下に はみ出ている。
function drawNotebook(ctx) {
  const { x, y } = SPOTS.notebook;
  px(ctx, '8', x, y + 1, 4, 12);
  px(ctx, '7', x, y + 1, 1, 12);
  px(ctx, '0', x + 4, y + 1, 1, 12);
  px(ctx, '6', x, y + 3, 4, 1);
  px(ctx, 'h', x + 2, y + 13, 1, 4);
}

// 動かない 部分を まとめて 描く
function drawRoomLayer(ctx) {
  drawRoom(ctx);
  drawWindow(ctx);
  drawWindowsill(ctx);
  drawWallThings(ctx);
  drawBackBar(ctx);
  drawCounter(ctx);
  drawBookshelf(ctx);
  drawNotebook(ctx);
  drawWindowTable(ctx);
  drawPothos(ctx);
  drawPendants(ctx);
  drawMonstera(ctx);
  drawMyTable(ctx);
  drawTableLamp(ctx);
}

// ---- 時間で 起きる こと ----

function hash(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// period 秒ごとに chance の 確率で、duration 秒 続く できごと。
// 起きている 最中なら 進み具合（0〜1）、そうでなければ false。本当の 時刻から 決まるので、誰が いつ 見ても 同じ。
export function happening(s, period, duration, chance, salt = 0) {
  const slot = Math.floor(s / period);
  if (hash(slot * 13 + salt * 101) > chance) return false;
  const start = slot * period + hash(slot * 7 + salt * 31 + 1) * (period - duration);
  const p = (s - start) / duration;
  return p >= 0 && p < 1 ? p : false;
}

// おくのさんの 一日（docs/characters.md）
export const ACTIVITIES = {
  utatane: 'うたた寝',
  migaku: 'カップを磨く',
  yomu: '本を読む',
  nagameru: '窓の外を見る',
  chizu: '空想地図を描く',
};

export function okunoActivity(date) {
  const h = date.getHours();
  if (h < 5) return 'utatane';
  if (h < 10) return 'migaku';
  if (h < 16) return 'yomu';
  if (h < 19) return 'nagameru';
  return 'chizu';
}

function drawOkuno(ctx, date, s, bow) {
  const { x, y } = SPOTS.okuno;
  if (bow) { drawSprite(ctx, okunoDown, x, y + 1); return; } // 会釈
  const act = okunoActivity(date);
  if (act === 'migaku') {
    drawSprite(ctx, okuno, x, y);
    const sway = Math.round(Math.sin(s * 2.5) * 1.5);
    px(ctx, 'c', x + 4 + sway, y + 12, 4, 3);
    px(ctx, '9', x + 4 + sway, y + 12, 4, 1);
    px(ctx, '8', x + 3 - sway, y + 13, 3, 2); // ふきん
  } else if (act === 'yomu') {
    drawSprite(ctx, okunoDown, x, y);
    px(ctx, 'g', x + 2, y + 11, 8, 4);
    px(ctx, '9', x + 3, y + 11, 3, 3);
    px(ctx, '8', x + 6, y + 11, 3, 3);
    const p = happening(s, 25, 0.75, 1, 1);
    if (p !== false) px(ctx, '9', x + 6 - Math.floor(p * 3), y + 10, 1, 4); // ページを めくる
  } else if (act === 'nagameru') {
    // ゆかしと 同じ ほうを 見ている。ときどき 店の 中に 目を もどす
    drawSprite(ctx, happening(s, 40, 5, 0.5, 2) !== false ? okuno : okunoLook, x, y);
  } else if (act === 'chizu') {
    drawSprite(ctx, okunoDown, x, y);
    px(ctx, '9', x - 1, 96, 13, 2);
    const pen = Math.round(Math.sin(s * 1.7) * 3 + Math.sin(s * 4.1));
    px(ctx, 'q', x + 6 + pen, 94, 2, 1);
    px(ctx, '0', x + 7 + pen, 95, 1, 1);
  } else {
    drawSprite(ctx, okunoDown, x, y);
    const p = (s % 5) / 5;
    if (p < 0.8) {
      const zx = x + 11 + Math.floor(p * 3), zy = y - 1 - Math.floor(p * 8);
      px(ctx, 'c', zx, zy, 3, 1); px(ctx, 'c', zx + 1, zy + 1); px(ctx, 'c', zx, zy + 2, 3, 1);
    }
  }
}

// ゆかしの 一日（docs/characters.md）
export const PLACES = {
  isu: { label: '窓ぎわの椅子で丸くなる', x: 17, y: 127 },
  hinata: { label: '床の日だまりで眠る', x: 118, y: 143 },
  mado: { label: '窓辺で外を見る' },
  tana: { label: '本棚の三段目で眠る', x: SHELF.x + 15, y: SHELF.y + 2 + 17 * 3 - 8 },
};

// 雨や 霧で 日だまりが ない 日は、窓辺で 外を 見ている
export function yukashiPlace(date, weather = 'hare') {
  const h = date.getHours();
  if (h < 5) return 'tana';
  if (h < 10) return 'isu';
  if (h < 16) return weather === 'hare' ? 'hinata' : 'mado';
  if (h < 19) return 'mado';
  return 'tana';
}

// しばらく いると、ゆかしが 自分の テーブルに 来る。
// 15分 いたら はじめて 来て、そのあとは 20分ごとに 1分ずつ。
export const VISIT = { after: 15 * 60, every: 20 * 60, length: 60 };
export function yukashiVisit(stay) {
  if (stay < VISIT.after) return false;
  const p = ((stay - VISIT.after) % VISIT.every) / VISIT.length;
  return p < 1 ? p : false;
}

function drawVisit(ctx, p, s) {
  const x = 74, y = 146;
  if (p < 0.08 || p > 0.94) return; // 来る 途中・帰る 途中は 見えない（ふと 見ると いる）
  if (p > 0.3 && p < 0.36) { drawSprite(ctx, yukashiFrontBlink, x, y); return; } // ゆっくり まばたき
  if (p > 0.5 && p < 0.78) {
    // すりすり：目を 細めて、頭を 左右に
    drawSprite(ctx, yukashiFrontBlink, x + (Math.floor(s * 3) % 2), y);
    return;
  }
  drawSprite(ctx, yukashiFront, x, y);
}

function drawYukashi(ctx, s, date, stay, weather) {
  const visit = yukashiVisit(stay);
  if (visit !== false) { drawVisit(ctx, visit, s); return; }
  const place = yukashiPlace(date, weather);
  if (place !== 'mado') {
    const { x, y } = PLACES[place];
    drawSprite(ctx, yukashiLoaf, x, y);
    // 寝息：ときどき 背中が すこし 上がる
    if (Math.floor(s / 2) % 3 === 0) { px(ctx, '0', x + 4, y, 5, 1); px(ctx, '9', x + 4, y + 1, 5, 1); }
    return;
  }
  const { x, y } = SPOTS.yukashi;
  const ear = happening(s, 23, 0.4, 0.8, 7) !== false;
  drawSprite(ctx, ear ? yukashiEar : yukashi, x, y);
  // しっぽ：窓台から たれて、ときどき 先を ふる
  const flick = happening(s, 9, 1.6, 0.8, 5);
  const off = flick === false ? 0 : [1, 0, -1, 0][Math.floor(flick * 4)];
  px(ctx, 'i', x + 10, y + 11, 1, 3);
  px(ctx, '0', x + 11, y + 11, 1, 3);
  px(ctx, '0', x + 9, y + 12, 1, 2);
  px(ctx, '1', x + 10 + off, y + 14);
  px(ctx, '0', x + 9 + off, y + 14);
  px(ctx, '0', x + 11 + off, y + 14);
  px(ctx, '0', x + 10 + off, y + 15);
}

// 灯り そのもの（光の 計算の あとに 描く）
function drawGlows(ctx, t, s, music) {
  if (t.lit) {
    for (const p of PENDANTS) px(ctx, 'k', p.x - 2, 14 + p.len + 4, 5, 1);
    px(ctx, 'k', TABLE_LAMP.x - 3, 145, 7, 1);
  }
  // ジュークボックスは 鳴っている あいだ 灯る
  if (!music) return;
  const { x, y, w } = JUKEBOX;
  const beat = Math.floor(s) % 4;
  for (let i = 0; i < 4; i++) px(ctx, i === beat ? 'j' : 'k', x + 4 + i * 3, y + 10, 2, 6);
  px(ctx, 'j', x + 2, y + 20, w - 4, 1);
  // ときどき 音符が ふわりと 浮かぶ
  const p = happening(s, 6, 3, 0.6, 11);
  if (p !== false && p < 0.85) {
    const nx = x + 12 + Math.round(Math.sin(p * 6) * 2), ny = y - 2 - Math.floor(p * 14);
    ctx.globalAlpha = p < 0.6 ? 0.9 : 0.4;
    px(ctx, 'k', nx, ny, 1, 4); px(ctx, 'k', nx - 2, ny + 3, 2, 2); px(ctx, 'k', nx + 1, ny, 1, 1);
    ctx.globalAlpha = 1;
  }
}

// 湯気：ゆらゆら 上って 薄れていく。warmth は すじの 数（冷めると 減って、やがて 消える）
function drawSteam(ctx, x, y, t, warmth = 3) {
  for (let k = 0; k < warmth; k++) {
    for (let y0 = 0; y0 < 14; y0 += 3) {
      const life = ((y0 + t * 4 + k * 5) % 14) / 14;
      if (life < 0.15) continue;
      const yy = y - life * 15;
      const xx = x + k * 2.5 + Math.sin(yy * 0.45 + t * 1.3 + k * 2) * 1.4;
      ctx.globalAlpha = [0.5, 0.35, 0.2, 0.08][Math.floor(life * 4)];
      ctx.fillStyle = COLOR.c;
      ctx.fillRect(Math.round(xx), Math.round(yy), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

// ---- 店 ----

export class Shop {
  constructor(ctx) {
    this.ctx = ctx;
    this.room = null;
    this.lightMaps = {};
  }

  // stay：お客さんが 店に いる 秒数、drink：テーブルの 飲みもの（null なら まだ 来ていない）、
  // warmth：湯気の すじの 数、bow：おくのさんが 会釈している、weather：天気（hare・kiri・ame）
  // sweet：甘いもの（null なら なし）、sweetLeft：その 残り
  render(date, timeKey = timeKeyOf(date), { music = false, stay = 0, drink = 'yukashi', warmth = 3, bow = false, weather = 'hare', sweet = null, sweetLeft = 1 } = {}) {
    const ctx = this.ctx, t = lookOf(timeKey, weather);
    const s = date.getTime() / 1000;
    if (!this.room) {
      this.room = document.createElement('canvas');
      this.room.width = SCENE_W; this.room.height = SCENE_H;
      drawRoomLayer(this.room.getContext('2d'));
    }
    const mapKey = `${timeKey}-${weather}`;
    this.lightMaps[mapKey] ??= makeLightMap(SCENE_W, SCENE_H, t);

    ctx.clearRect(0, 0, SCENE_W, SCENE_H);
    drawOutside(ctx, t, timeKey, s);
    const outside = ctx.getImageData(WIN.x, WIN.y, WIN.w, WIN.h).data;
    ctx.drawImage(this.room, 0, 0);
    drawClockHands(ctx, SPOTS.clock.x, SPOTS.clock.y, date);
    drawOkuno(ctx, date, s, bow);
    drawYukashi(ctx, s, date, stay, weather);
    // 冬は、窓辺の まんなかの サボテンに 花が 咲く
    if (seasonOf(date) === 'fuyu') { px(ctx, 'h', 37, 73, 2, 2); px(ctx, 'q', 37, 73); }
    if (sweet) drawSweet(ctx, sweet, sweetLeft);
    if (drink) drawSprite(ctx, cup, SPOTS.cup.x, SPOTS.cup.y, { swap: DRINKS[drink].swap });

    // 窓の 外が そのまま 見えている ところには 光を あてない
    const skip = new Uint8Array(SCENE_W * SCENE_H);
    const now = ctx.getImageData(WIN.x, WIN.y, WIN.w, WIN.h).data;
    for (let j = 0; j < WIN.h; j++) {
      for (let i = 0; i < WIN.w; i++) {
        const o = (j * WIN.w + i) * 4;
        if (now[o] === outside[o] && now[o + 1] === outside[o + 1] && now[o + 2] === outside[o + 2]) {
          skip[(WIN.y + j) * SCENE_W + WIN.x + i] = 1;
        }
      }
    }
    applyLightMap(ctx, SCENE_W, SCENE_H, this.lightMaps[mapKey], skip);

    drawGlows(ctx, t, s, music);
    if (drink) drawSteam(ctx, SPOTS.cup.x + 4, SPOTS.cup.y + 1, Math.floor(s * 8) / 8, warmth);
  }
}
