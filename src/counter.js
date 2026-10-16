// カウンター席から 見た 景色（320×180）。おくのさんの 目の前。
// 角の 席が 店全体を 見わたす 引きの 絵なら、こちらは 寄りの 絵。
//
// 重ね順：奥（壁、棚、後ろの 台）→ おくのさん → 手前（カウンター、小物）→ 光 → 灯りと 湯気
import { drawSprite, px, seeded, makeLightMap, applyLightMap } from './pixel.js';
import { COLOR } from './palette.js';
import { cup, clock, yukashiLoaf, yukashiFront, yukashiFrontBlink, plate } from './sprites.js';
import {
  lookOf, timeKeyOf, okunoActivity, yukashiPlace, yukashiVisit, happening, drawClockHands,
  DRINKS, SWEETS, SCENE_W as W, SCENE_H as H,
} from './scene.js';
import { seasonOf } from './koyomi.js';

const EDGE = 118; // カウンターの 向こう側の ふち
const OK = { x: 140, y: 49 }; // おくのさんの 顔の まんなか
const PENDANTS = [64, 236];

export const COUNTER_SPOTS = {
  okuno: { x: 112, y: 34, w: 56, h: 84 },
  cup: { x: 154, y: 146, w: 16, h: 15 },
  notebook: { x: 262, y: 138, w: 20, h: 18 },
  cat: { x: 206, y: 132, w: 20, h: 18 },
  yukashi: { x: 280, y: 110, w: 14, h: 8 },
};

function ellipse(ctx, key, cx, cy, rx, ry, clip) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    if (clip && !clip(y)) continue;
    const t = (y - cy) / ry;
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    px(ctx, key, cx - hw, y, hw * 2 + 1, 1);
  }
}

// ---- 奥：壁、棚、後ろの 台 ----

function drawBack(ctx) {
  px(ctx, '1', 0, 0, W, 8);
  px(ctx, '2', 0, 6, W, 3);
  px(ctx, '3', 0, 9, W, EDGE - 9);
  for (let x = 4; x < W; x += 10) for (let y = 10; y < 96; y += 2) px(ctx, '2', x, y);

  const rnd = seeded(31);
  for (const sy of [32, 60]) {
    for (let x = 12; x < 300; ) {
      const k = rnd();
      if (k < 0.35) { // カップ
        px(ctx, 'c', x, sy - 6, 7, 6); px(ctx, '9', x, sy - 6, 7, 1); px(ctx, 'c', x + 7, sy - 5, 2, 3); px(ctx, 'b', x + 5, sy - 5, 2, 5);
        x += 12;
      } else if (k < 0.7) { // 豆の 瓶
        px(ctx, 'a', x, sy - 14, 9, 14); px(ctx, rnd() < 0.5 ? '1' : '2', x + 1, sy - 10, 7, 10); px(ctx, 'p', x + 1, sy - 13, 1, 9); px(ctx, '5', x + 1, sy - 16, 7, 2);
        x += 13;
      } else if (k < 0.85) { // 瓶
        const key = rnd() < 0.5 ? 'e' : 'g';
        px(ctx, key, x + 2, sy - 18, 3, 5); px(ctx, key, x, sy - 13, 7, 13); px(ctx, '8', x + 1, sy - 9, 5, 4);
        x += 11;
      } else { // 小さな 本の 束
        for (let i = 0; i < 4; i++) px(ctx, ['g', 'm', 'h', '7'][i], x + i * 3, sy - 11 + (i % 2), 3, 11 - (i % 2));
        x += 15;
      }
    }
    px(ctx, '6', 8, sy, 304, 1);
    px(ctx, '5', 8, sy + 1, 304, 2);
    px(ctx, '1', 8, sy + 3, 304, 1);
  }

  // 黒板の メニュー
  px(ctx, '1', 196, 64, 56, 28);
  px(ctx, 'd', 198, 66, 52, 24);
  [[202, 70, 20], [202, 75, 28], [202, 80, 16], [202, 85, 24], [232, 70, 12], [236, 80, 10]].forEach(([x, y, w]) => {
    for (let i = 0; i < w; i += 2) px(ctx, 'c', x + i, y);
  });

  // 後ろの 台（引き出し）
  px(ctx, '6', 0, 96, W, 1);
  px(ctx, '4', 0, 97, W, 2);
  px(ctx, '2', 0, 99, W, EDGE - 99);
  for (let x = 6; x < W; x += 34) { px(ctx, '1', x, 102, 28, 10); px(ctx, '3', x + 1, 103, 26, 8); px(ctx, '6', x + 12, 106, 4, 1); }

  // 台の 上：やかん、サイフォン、ミル
  ellipse(ctx, 'a', 46, 90, 8, 6); px(ctx, 'b', 40, 86, 4, 2); px(ctx, '0', 44, 82, 4, 2); px(ctx, 'a', 54, 86, 6, 2); px(ctx, '0', 38, 95, 16, 1);
  px(ctx, '0', 70, 95, 14, 1); px(ctx, 'p', 72, 82, 10, 10); px(ctx, '2', 72, 87, 10, 5); px(ctx, 'p', 75, 70, 4, 12); px(ctx, '0', 74, 92, 6, 3); px(ctx, '9', 73, 83, 1, 6);
  px(ctx, '2', 96, 84, 12, 12); px(ctx, '5', 98, 78, 8, 6); px(ctx, '0', 106, 79, 7, 1); px(ctx, '0', 112, 79, 1, 4);

  // 壁の 時計
  drawSprite(ctx, clock, 272, 70);

  // ペンダントランプ
  for (const x of PENDANTS) {
    px(ctx, '0', x, 0, 1, 16);
    px(ctx, 'h', x - 5, 16, 11, 2);
    px(ctx, 'h', x - 8, 18, 17, 3);
    px(ctx, 'g', x - 8, 21, 17, 1);
    px(ctx, 'b', x - 3, 22, 7, 1);
  }
}

// ---- 手前：カウンターと 小物 ----

function drawFront(ctx) {
  px(ctx, '7', 0, EDGE, W, 1);
  px(ctx, '6', 0, EDGE + 1, W, 3);
  px(ctx, '5', 0, EDGE + 4, W, H - EDGE - 4);
  // 手前ほど 太く 見える 板
  for (const y of [126, 135, 146, 160, 177]) px(ctx, '4', 0, y, W, 1);
  const rnd = seeded(41);
  for (let k = 0; k < 40; k++) px(ctx, k % 3 ? '4' : '6', Math.floor(rnd() * W), 122 + Math.floor(rnd() * 56), 4 + Math.floor(rnd() * 12), 1);

  // 砂糖つぼ
  ellipse(ctx, '0', 117, 140, 7, 6); ellipse(ctx, 'c', 117, 140, 6, 5); px(ctx, '9', 112, 136, 10, 2); px(ctx, '0', 115, 132, 4, 2); px(ctx, 'b', 120, 140, 3, 4);
  // 本棚から まぎれてきた 帳面（スケッチ帳）
  const n = COUNTER_SPOTS.notebook;
  px(ctx, '0', n.x - 1, n.y - 1, 20, 13);
  px(ctx, '8', n.x, n.y, 18, 11);
  px(ctx, '7', n.x, n.y, 2, 11);
  px(ctx, '6', n.x + 4, n.y + 3, 10, 1);
  px(ctx, 'h', n.x + 12, n.y + 11, 2, 6);
}

// 一輪挿し：季節の 花
const VASE_FLOWER = { haru: 'q', natsu: 'k', aki: 'i', fuyu: 'h' };
function drawVase(ctx, season) {
  px(ctx, 'p', 222, 124, 5, 9); px(ctx, '9', 223, 125, 1, 6); px(ctx, '0', 222, 133, 5, 1);
  px(ctx, 'e', 224, 112, 1, 12); px(ctx, 'f', 225, 117, 2, 1);
  px(ctx, VASE_FLOWER[season], 222, 109, 5, 3); px(ctx, VASE_FLOWER[season], 223, 108, 3, 5); px(ctx, 'k', 224, 110);
}

// ---- おくのさん（大きく） ----

function drawHead(ctx, { dx = 0, dy = 0, look = 0, eyes = 'open', glasses = false }) {
  const cx = OK.x + dx, cy = OK.y + dy;
  ellipse(ctx, '0', cx, cy, 12, 13);
  ellipse(ctx, 'r', cx, cy, 11, 12);
  ellipse(ctx, 'q', cx - 1, cy, 10, 12);
  // 耳
  px(ctx, 'r', cx - 13, cy, 2, 5); px(ctx, 'r', cx + 12, cy, 2, 5);
  // 白い 髪：頭の 上と、横
  ellipse(ctx, 'c', cx, cy - 6, 12, 8, y => y <= cy - 5);
  ellipse(ctx, 'b', cx + 3, cy - 7, 8, 5, y => y <= cy - 8);
  ellipse(ctx, 'c', cx - 1, cy - 8, 8, 4, y => y <= cy - 8);
  px(ctx, 'c', cx - 12, cy - 6, 3, 9); px(ctx, 'b', cx + 10, cy - 6, 3, 9);
  // 顔
  const fx = cx + look;
  px(ctx, 'b', fx - 7, cy - 2, 4, 1); px(ctx, 'b', fx + 3, cy - 2, 4, 1); // 眉
  if (eyes === 'open') {
    px(ctx, '1', fx - 6, cy + 1, 3, 1); px(ctx, '1', fx + 3, cy + 1, 3, 1);
    px(ctx, '1', fx - 5, cy + 2); px(ctx, '1', fx + 4, cy + 2);
  } else {
    px(ctx, 's', fx - 6, cy + 2, 3, 1); px(ctx, 's', fx + 3, cy + 2, 3, 1);
  }
  px(ctx, 'r', fx, cy + 2, 1, 4); px(ctx, 's', fx + 1, cy + 5);
  px(ctx, 'r', fx - 8, cy + 5, 2, 1); px(ctx, 'r', fx + 6, cy + 5, 2, 1);
  px(ctx, 'c', fx - 5, cy + 7, 11, 2); px(ctx, 'b', fx - 4, cy + 9, 9, 1); // 口ひげ
  if (glasses) {
    for (const gx of [fx - 8, fx + 2]) { px(ctx, 'a', gx, cy - 1, 7, 1); px(ctx, 'a', gx, cy + 4, 7, 1); px(ctx, 'a', gx, cy - 1, 1, 6); px(ctx, 'a', gx + 6, cy - 1, 1, 6); }
    px(ctx, 'a', fx - 1, cy, 3, 1);
  }
}

function drawBody(ctx) {
  const cx = OK.x;
  // 首
  px(ctx, 's', cx - 5, 60, 10, 8); px(ctx, 'r', cx - 4, 60, 7, 7);
  // 白シャツ：なで肩で、下へ 少し 広がる
  ellipse(ctx, '0', cx, 78, 27, 12, y => y <= 78);
  ellipse(ctx, '9', cx, 78, 26, 11, y => y <= 78);
  for (let y = 78; y < EDGE; y++) {
    const hw = 26 + Math.floor((y - 78) / 14);
    px(ctx, '0', cx - hw - 1, y, hw * 2 + 3, 1);
    px(ctx, '9', cx - hw, y, hw * 2 + 1, 1);
    px(ctx, 'c', cx + hw - 6, y, 6, 1); // 右の 影
  }
  ellipse(ctx, 'c', cx + 21, 74, 5, 4, y => y <= 74);
  // 襟と 蝶ネクタイ
  px(ctx, '9', cx - 7, 64, 5, 5); px(ctx, '9', cx + 3, 64, 5, 5); px(ctx, 'c', cx + 5, 66, 3, 3);
  px(ctx, 'g', cx - 5, 67, 11, 4); px(ctx, 'h', cx - 1, 67, 3, 4);
  // ベスト：V字に シャツが のぞく。肩の 線は 少し 内側
  for (let y = 71; y < EDGE; y++) {
    const open = Math.max(0, Math.round((95 - y) / 3));
    const half = 16 + Math.floor((y - 71) / 16);
    px(ctx, '3', cx - half, y, half - open, 1);
    px(ctx, '3', cx + 1 + open, y, half - open, 1);
    px(ctx, '1', cx - half, y, 1, 1); px(ctx, '1', cx + half, y, 1, 1);
    if (open) { px(ctx, '1', cx - open, y, 1, 1); px(ctx, '1', cx + open, y, 1, 1); }
  }
  px(ctx, '4', cx - 14, 76, 3, EDGE - 76);
  px(ctx, '2', cx + 10, 80, 3, EDGE - 80);
  for (const y of [99, 107, 115]) px(ctx, '6', cx, y, 2, 2);
  // 袖の しわ
  px(ctx, 'c', cx - 22, 86, 1, 10); px(ctx, 'c', cx + 22, 84, 1, 12);
}

// 腕：袖まくりの 白い 袖から、手が 出る
function drawArms(ctx, pose) {
  const cx = OK.x;
  const cuff = x => { px(ctx, '0', x - 1, 96, 10, 5); px(ctx, '8', x, 97, 8, 3); px(ctx, '7', x, 99, 8, 1); };
  const hand = (x, y) => { px(ctx, '0', x - 1, y - 1, 10, 6); px(ctx, 'q', x, y, 8, 4); px(ctx, 'r', x, y + 3, 8, 1); px(ctx, 'r', x + 2, y, 1, 2); px(ctx, 'r', x + 5, y, 1, 2); };
  const forearm = (x0, x1, y0, y1) => {
    for (let y = y0; y < y1; y++) {
      const x = Math.round(x0 + (x1 - x0) * (y - y0) / (y1 - y0));
      px(ctx, '0', x - 1, y, 8, 1); px(ctx, 'q', x, y, 6, 1); px(ctx, 'r', x + 5, y, 1, 1);
    }
  };
  if (pose === 'folded') {
    // 腕を 組んで カウンターに 置く
    px(ctx, '0', cx - 30, 103, 60, 15); px(ctx, '9', cx - 29, 104, 58, 13);
    px(ctx, 'c', cx - 29, 110, 58, 1); px(ctx, 'c', cx + 18, 104, 11, 13);
    px(ctx, '8', cx - 29, 114, 12, 3); px(ctx, '8', cx + 17, 114, 12, 3);
    px(ctx, 'q', cx - 16, 106, 7, 4); px(ctx, 'q', cx + 9, 108, 7, 4); // 組んだ 手
    return;
  }
  cuff(cx - 26); cuff(cx + 19);
  if (pose === 'rest') {
    forearm(cx - 25, cx - 22, 101, 112); forearm(cx + 20, cx + 16, 101, 112);
    hand(cx - 23, 112); hand(cx + 14, 112);
  } else if (pose === 'center') {
    forearm(cx - 25, cx - 15, 101, 108); forearm(cx + 20, cx + 10, 101, 108);
  }
}

function drawOkunoBig(ctx, date, s, bow) {
  const act = bow ? 'bow' : okunoActivity(date);
  drawBody(ctx);
  if (act === 'migaku') {
    drawArms(ctx, 'center');
    drawHead(ctx, { dy: 1 });
    const sway = Math.round(Math.sin(s * 2.5) * 2);
    px(ctx, '0', 133 + sway, 99, 14, 11); px(ctx, 'c', 134 + sway, 100, 12, 9); px(ctx, '9', 134 + sway, 100, 12, 2); px(ctx, 'b', 143 + sway, 102, 3, 7);
    px(ctx, '8', 130 - sway, 103, 9, 6); px(ctx, '7', 130 - sway, 107, 9, 1);
  } else if (act === 'yomu') {
    drawArms(ctx, 'center');
    drawHead(ctx, { dy: 2, eyes: 'down', glasses: true });
    // 本：開いて、両手で 持っている
    px(ctx, '0', 121, 99, 39, 15); px(ctx, 'g', 122, 100, 37, 13);
    px(ctx, '9', 124, 100, 16, 11); px(ctx, '8', 141, 100, 16, 11); px(ctx, '7', 140, 100, 1, 11);
    for (let l = 0; l < 4; l++) { px(ctx, 'b', 126, 102 + l * 2, 12, 1); px(ctx, 'b', 143, 102 + l * 2, 12, 1); }
    const p = happening(s, 25, 0.75, 1, 1);
    if (p !== false) px(ctx, '9', 156 - Math.floor(p * 16), 99, 2, 12); // ページを めくる
  } else if (act === 'nagameru') {
    drawArms(ctx, 'rest');
    const back = happening(s, 40, 5, 0.5, 2) !== false;
    drawHead(ctx, { look: back ? 0 : -3, dx: back ? 0 : -1 });
  } else if (act === 'chizu') {
    drawArms(ctx, 'rest');
    drawHead(ctx, { dy: 3, eyes: 'down', glasses: true });
    const pen = Math.round(Math.sin(s * 1.7) * 6 + Math.sin(s * 4.1) * 2);
    px(ctx, '0', 145 + pen, 107, 2, 8); px(ctx, 'h', 145 + pen, 107, 1, 6);
  } else if (act === 'utatane') {
    drawArms(ctx, 'folded');
    drawHead(ctx, { dy: 6, eyes: 'down' });
    const p = (s % 5) / 5;
    if (p < 0.8) {
      const zx = OK.x + 16 + Math.floor(p * 5), zy = OK.y - 10 - Math.floor(p * 14);
      px(ctx, 'c', zx, zy, 4, 1); px(ctx, 'c', zx + 2, zy + 1); px(ctx, 'c', zx + 1, zy + 2); px(ctx, 'c', zx, zy + 3, 4, 1);
    }
  } else { // 会釈
    drawArms(ctx, 'rest');
    drawHead(ctx, { dy: 5, eyes: 'down' });
  }
}

// 地図の 紙は カウンターの 上に 広がる（手前の 層の あと）
function drawMapPaper(ctx, date) {
  if (okunoActivity(date) !== 'chizu') return;
  px(ctx, '9', 114, 119, 52, 4);
  px(ctx, '8', 114, 122, 52, 1);
  px(ctx, '6', 120, 120, 14, 1); px(ctx, '6', 138, 121, 18, 1); px(ctx, 'p', 150, 119, 8, 2);
}

// ---- ゆかし ----

function drawYukashiCounter(ctx, s, date, stay, weather) {
  const visit = yukashiVisit(stay);
  const v = COUNTER_SPOTS.cat;
  if (visit !== false) {
    if (visit < 0.08 || visit > 0.94) return;
    if (visit > 0.3 && visit < 0.36) { drawSprite(ctx, yukashiFrontBlink, v.x, v.y); return; }
    if (visit > 0.5 && visit < 0.78) { drawSprite(ctx, yukashiFrontBlink, v.x + (Math.floor(s * 3) % 2), v.y); return; }
    drawSprite(ctx, yukashiFront, v.x, v.y);
    return;
  }
  // 窓辺に いる ときは、ここからは 見えない。それ以外は カウンターの 端で 丸くなる
  if (yukashiPlace(date, weather) === 'mado') return;
  const { x, y } = COUNTER_SPOTS.yukashi;
  drawSprite(ctx, yukashiLoaf, x, y);
  if (Math.floor(s / 2) % 3 === 0) { px(ctx, '0', x + 4, y, 5, 1); px(ctx, '9', x + 4, y + 1, 5, 1); }
}

// ---- 光 ----

function counterLight(timeKey, weather) {
  const t = lookOf(timeKey, weather);
  const lamps = [];
  const sun = { asa: [0.32, 0.32, 0.28], hiru: [0.26, 0.26, 0.22], yu: [0.55, 0.3, 0.12] }[timeKey];
  if (sun && weather === 'hare') lamps.push({ x: -40, y: 70, r: 260, color: sun });
  if (sun && weather !== 'hare') lamps.push({ x: -40, y: 70, r: 220, color: sun.map(c => c * 0.4) });
  if (t.lit) {
    const strong = timeKey === 'yoru';
    for (const x of PENDANTS) {
      lamps.push({ x, y: 26, r: strong ? 90 : 70, color: strong ? [0.8, 0.55, 0.3] : [0.4, 0.28, 0.14], squash: 0.9 });
      // ランプの 光が、カウンターに 落ちる
      lamps.push({ x, y: 120, r: strong ? 150 : 110, color: strong ? [0.55, 0.4, 0.22] : [0.25, 0.18, 0.09], squash: 1.4 });
    }
    // 画面の 外、おくのさんの 真上にも ランプが ひとつ
    lamps.push({ x: OK.x, y: 30, r: 80, color: strong ? [0.6, 0.45, 0.25] : [0.3, 0.22, 0.12] });
  }
  return { ambient: t.ambient, lamps, lit: t.lit };
}

function drawSteam(ctx, x, y, t, warmth) {
  for (let k = 0; k < warmth; k++) {
    for (let y0 = 0; y0 < 18; y0 += 3) {
      const life = ((y0 + t * 4 + k * 6) % 18) / 18;
      if (life < 0.12) continue;
      const yy = y - life * 20;
      const xx = x + k * 3 + Math.sin(yy * 0.4 + t * 1.3 + k * 2) * 1.6;
      ctx.globalAlpha = [0.5, 0.35, 0.2, 0.08][Math.floor(life * 4)];
      ctx.fillStyle = COLOR.c;
      ctx.fillRect(Math.round(xx), Math.round(yy), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

export class CounterView {
  constructor(ctx) {
    this.ctx = ctx;
    this.back = null;
    this.front = null;
    this.lightMaps = {};
  }

  layer(draw) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    draw(c.getContext('2d'));
    return c;
  }

  render(date, timeKey = timeKeyOf(date), { stay = 0, drink = 'yukashi', warmth = 3, bow = false, weather = 'hare', sweet = null, sweetLeft = 1 } = {}) {
    const ctx = this.ctx;
    const s = date.getTime() / 1000;
    this.back ??= this.layer(drawBack);
    this.front ??= this.layer(drawFront);
    const L = counterLight(timeKey, weather);
    const key = `${timeKey}-${weather}`;
    this.lightMaps[key] ??= makeLightMap(W, H, L);

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.back, 0, 0);
    drawClockHands(ctx, 272, 70, date);
    drawOkunoBig(ctx, date, s, bow);
    ctx.drawImage(this.front, 0, 0);
    drawMapPaper(ctx, date);
    drawVase(ctx, seasonOf(date));
    drawYukashiCounter(ctx, s, date, stay, weather);
    if (sweet) {
      drawSprite(ctx, plate, 180, 156);
      const sp = SWEETS[sweet].sprite;
      const x = 189 - Math.floor(sp.w / 2), y = 158 - sp.h;
      if (sweetLeft >= 1) drawSprite(ctx, sp, x, y);
      else if (sweetLeft > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x + Math.floor(sp.w / 2), y, sp.w, sp.h); ctx.clip(); drawSprite(ctx, sp, x, y); ctx.restore(); }
      else for (const [dx, dy] of [[5, 1], [8, 2], [11, 1]]) px(ctx, sp.rows[3][2], 180 + dx, 156 + dy);
    }
    if (drink) drawSprite(ctx, cup, 154, 146, { swap: DRINKS[drink].swap });

    applyLightMap(ctx, W, H, this.lightMaps[key]);

    if (L.lit) for (const x of PENDANTS) px(ctx, 'k', x - 3, 22, 7, 1);
    if (drink) drawSteam(ctx, 158, 147, Math.floor(s * 8) / 8, warmth);
  }
}
