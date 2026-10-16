import { PALETTE, COLOR } from './palette.js';
import { drawSprite } from './pixel.js';
import { cup, okuno, yukashi, clock, monsteraLeaf } from './sprites.js';
import { drawScene, TIMES, timeKeyOf, SCENE_W, SCENE_H, SPOTS } from './scene.js';
import { nextHitorigoto } from './hitorigoto.js';
import { VERSION } from './version.js';

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

function makeCanvas(w, h, el = document.createElement('canvas')) {
  el.width = w; el.height = h;
  const ctx = el.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  return [el, ctx];
}

document.getElementById('version').textContent = VERSION;

// ---- 角の 席から ----
const [sceneEl, sceneCtx] = makeCanvas(SCENE_W, SCENE_H, document.getElementById('scene'));
const [baseEl, baseCtx] = makeCanvas(SCENE_W, SCENE_H); // 湯気を のせる前の 絵
let chosen = params.get('view') ?? 'now'; // now か 時間帯の キー

const tabs = document.getElementById('tabs');
const tabKeys = ['now', ...Object.keys(TIMES)];
const buttons = tabKeys.map(key => {
  const b = document.createElement('button');
  b.textContent = key === 'now' ? 'いま' : TIMES[key].label;
  b.addEventListener('click', () => { chosen = key; renderBase(); });
  tabs.append(b);
  return [key, b];
});

function renderBase() {
  const key = chosen === 'now' ? timeKeyOf(now()) : chosen;
  drawScene(baseCtx, key, now());
  for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(k === chosen));
}

// 湯気：3すじ、ゆらゆら 上って 薄れていく。1秒に 8コマ。
function drawSteam(ctx, x, y, t) {
  for (let s = 0; s < 3; s++) {
    for (let y0 = 0; y0 < 14; y0 += 3) {
      const life = ((y0 + t * 4 + s * 5) % 14) / 14;
      if (life < 0.15) continue;
      const yy = y - life * 15;
      const xx = x + s * 2.5 + Math.sin(yy * 0.45 + t * 1.3 + s * 2) * 1.4;
      ctx.globalAlpha = [0.5, 0.35, 0.2, 0.08][Math.floor(life * 4)];
      ctx.fillStyle = COLOR.c;
      ctx.fillRect(Math.round(xx), Math.round(yy), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

sceneEl.addEventListener('click', async e => {
  const r = sceneEl.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * SCENE_W;
  const y = ((e.clientY - r.top) / r.height) * SCENE_H;
  const o = SPOTS.okuno;
  if (x >= o.x - 2 && x < o.x + o.w + 2 && y >= o.y - 2 && y < o.y + o.h + 2) {
    document.getElementById('bubble').textContent = await nextHitorigoto();
  }
});

// ---- 時間帯の 光 ----
const thumbs = Object.keys(TIMES).map(key => {
  const fig = document.createElement('figure');
  const [c, ctx] = makeCanvas(SCENE_W, SCENE_H);
  const cap = document.createElement('figcaption');
  cap.textContent = TIMES[key].label;
  fig.append(c, cap);
  document.getElementById('thumbs').append(fig);
  return { key, ctx };
});
const drawThumbs = () => thumbs.forEach(th => drawScene(th.ctx, th.key, now()));

// ---- 小物 ----
for (const [label, sp, scale] of [['おくのさん', okuno, 8], ['ゆかし', yukashi, 8], ['いつもの一杯', cup, 6], ['壁の時計', clock, 6], ['モンステラの葉', monsteraLeaf, 6]]) {
  const fig = document.createElement('figure');
  const [c, ctx] = makeCanvas(sp.w, sp.h);
  c.style.width = `${sp.w * scale}px`;
  drawSprite(ctx, sp, 0, 0);
  const cap = document.createElement('figcaption');
  cap.textContent = label;
  fig.append(c, cap);
  document.getElementById('cast').append(fig);
}

// ---- パレット ----
document.getElementById('palette').append(...PALETTE.map(p => {
  const el = document.createElement('div');
  el.className = 'swatch';
  el.innerHTML = `<i style="background:${p.hex}"></i><b>${p.key}</b>${p.name}<br><b>${p.hex}</b>`;
  return el;
}));

// ---- 動かす ----
let lastSecond = -1;
function frame(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec !== lastSecond) {
    lastSecond = sec;
    renderBase(); // 時計の 針のために 毎秒 描きなおす
    if (sec % 30 === 0) drawThumbs();
  }
  sceneCtx.drawImage(baseEl, 0, 0);
  drawSteam(sceneCtx, SPOTS.cup.x + 4, SPOTS.cup.y + 1, Math.floor((ms / 1000) * 8) / 8);
  requestAnimationFrame(frame);
}
renderBase();
drawThumbs();
requestAnimationFrame(frame);
