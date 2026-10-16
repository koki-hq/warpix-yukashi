import { PALETTE, COLOR } from './palette.js';
import { drawSprite } from './pixel.js';
import { cup, yukashi, okuno, clock } from './sprites.js';
import { drawScene, drawClockHands, TIMES, timeKeyOf, SCENE_W, SCENE_H } from './scene.js';
import { nextHitorigoto } from './hitorigoto.js';

const params = new URLSearchParams(location.search);
// ?time=18:30 で 時刻を 決めうちに できる（確認用）
function now() {
  const d = new Date();
  const t = params.get('time');
  if (t) {
    const [h, m] = t.split(':').map(Number);
    d.setHours(h, m || 0, 0);
  }
  return d;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// パレット
document.getElementById('palette').append(...PALETTE.map(p => {
  const el = document.createElement('div');
  el.className = 'swatch';
  el.innerHTML = `<i style="background:${p.hex}"></i><b>${p.key}</b>${p.name}<br><b>${p.hex}</b>`;
  return el;
}));

// 時間帯の 光
const timesEl = document.getElementById('times');
const sceneCanvases = Object.keys(TIMES).map(key => {
  const fig = document.createElement('figure');
  const [c, ctx] = makeCanvas(SCENE_W, SCENE_H);
  const cap = document.createElement('figcaption');
  cap.textContent = TIMES[key].label;
  fig.append(c, cap);
  timesEl.append(fig);
  return { key, ctx, cap };
});

function drawTimes() {
  const d = now();
  const nowKey = timeKeyOf(d);
  for (const s of sceneCanvases) {
    drawScene(s.ctx, s.key, d);
    s.cap.classList.toggle('now', s.key === nowKey);
  }
}

// 住人と 小物：実寸と 拡大を 並べる
const castEl = document.getElementById('cast');
function castFigure(label, w, h, scale, id) {
  const fig = document.createElement('figure');
  if (id) fig.id = id;
  const row = document.createElement('div');
  row.className = 'row';
  const [small, sctx] = makeCanvas(w, h);
  const [big, bctx] = makeCanvas(w, h);
  big.style.width = `${w * scale}px`;
  big.style.height = `${h * scale}px`;
  row.append(small, big);
  const cap = document.createElement('figcaption');
  cap.textContent = label;
  fig.append(row, cap);
  castEl.append(fig);
  return [sctx, bctx];
}

const okunoCtx = castFigure('おくのさん', okuno.w, okuno.h, 6, 'okuno-fig');
const yukashiCtx = castFigure('ゆかし', yukashi.w, yukashi.h, 6);
const cupCtx = castFigure('いつもの 一杯', 16, 32, 6);
const clockCtx = castFigure('壁の 時計', 16, 16, 6);

for (const ctx of okunoCtx) drawSprite(ctx, okuno, 0, 0);
for (const ctx of yukashiCtx) drawSprite(ctx, yukashi, 0, 0);

// 湯気：3すじ、ゆらゆら 上って 薄れていく
function drawCup(ctx, t) {
  ctx.clearRect(0, 0, 16, 32);
  for (let s = 0; s < 3; s++) {
    const baseX = 4 + s * 2.5;
    for (let y = 0; y < 14; y++) {
      const life = ((y + t * 4 + s * 5) % 14) / 14; // 0=下 1=上
      const yy = 16 - life * 15;
      const xx = baseX + Math.sin(yy * 0.45 + t * 1.3 + s * 2) * 1.4;
      const alpha = life < 0.15 ? 0 : [0.55, 0.4, 0.25, 0.1][Math.floor(life * 4)];
      if (!alpha || y % 3) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLOR.c;
      ctx.fillRect(Math.round(xx), Math.round(yy), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  drawSprite(ctx, cup, 0, 17);
}

function drawClock(ctx) {
  ctx.clearRect(0, 0, 16, 16);
  drawSprite(ctx, clock, 0, 0);
  drawClockHands(ctx, 0, 0, now());
}

let lastSecond = -1;
function frame(ms) {
  const t = ms / 1000;
  // 湯気は カクカク（1秒に 8コマ）
  const step = Math.floor(t * 8) / 8;
  for (const ctx of cupCtx) drawCup(ctx, step);
  const sec = Math.floor(t);
  if (sec !== lastSecond) {
    lastSecond = sec;
    for (const ctx of clockCtx) drawClock(ctx);
    if (sec % 10 === 0) drawTimes();
  }
  requestAnimationFrame(frame);
}
drawTimes();
requestAnimationFrame(frame);

// ひとりごと
const bubble = document.getElementById('bubble');
document.getElementById('okuno-fig').addEventListener('click', async () => {
  bubble.textContent = await nextHitorigoto();
});
