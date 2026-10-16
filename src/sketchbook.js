import { PALETTE } from './palette.js';
import { drawSprite } from './pixel.js';
import {
  cup, okuno, okunoLook, okunoDown, yukashi, yukashiLoaf, yukashiFront, yukashiFrontBlink, clock, monsteraLeaf,
} from './sprites.js';
import {
  Shop, TIMES, timeKeyOf, okunoActivity, ACTIVITIES, yukashiPlace, yukashiVisit, PLACES, SCENE_W, SCENE_H, SPOTS,
} from './scene.js';
import { nextHitorigoto } from './hitorigoto.js';
import { Jukebox } from './music.js';
import { VERSION } from './version.js';

const params = new URLSearchParams(location.search);
// 確認用：?time=18:30 で その時刻から、?speed=60 で 60倍速
const startReal = Date.now();
const startShop = (() => {
  const d = new Date();
  const t = params.get('time');
  if (t) {
    const [h, m] = t.split(':').map(Number);
    d.setHours(h, m || 0, 0);
  }
  return d.getTime();
})();
const speed = Number(params.get('speed')) || 1;
const now = () => new Date(startShop + (Date.now() - startReal) * speed);
// ?stay=900 で「もう 15分 いる」ことに できる
const stay = () => ((Date.now() - startReal) / 1000) * speed + (Number(params.get('stay')) || 0);

function makeCanvas(w, h, el = document.createElement('canvas')) {
  el.width = w; el.height = h;
  const ctx = el.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  return [el, ctx];
}

document.getElementById('version').textContent = VERSION;
const bubble = document.getElementById('bubble');
const status = document.getElementById('status');

// ---- 角の 席から ----
const [sceneEl, sceneCtx] = makeCanvas(SCENE_W, SCENE_H, document.getElementById('scene'));
const shop = new Shop(sceneCtx);
let chosen = params.get('view') ?? 'now'; // now か 時間帯の キー

const tabs = document.getElementById('tabs');
const buttons = ['now', ...Object.keys(TIMES)].map(key => {
  const b = document.createElement('button');
  b.textContent = key === 'now' ? 'いま' : TIMES[key].label;
  b.addEventListener('click', () => { chosen = key; draw(); });
  tabs.append(b);
  return [key, b];
});

// ---- ジュークボックス ----
// 音は クリックした あとに だけ 鳴らせる（ブラウザの 決まり）。曲は 時間帯で 変わる
let jukebox = null;
const musicButton = document.getElementById('music');
const songLabel = document.getElementById('song');
async function toggleMusic() {
  jukebox ??= new Jukebox();
  if (jukebox.playing) jukebox.stop();
  else await jukebox.start(currentKey());
  musicButton.setAttribute('aria-pressed', String(jukebox.playing));
}
musicButton.addEventListener('click', toggleMusic);

const currentKey = () => (chosen === 'now' ? timeKeyOf(now()) : chosen);

function draw() {
  const d = now();
  const key = currentKey();
  const music = !!jukebox?.playing;
  if (music) jukebox.setSong(key);
  songLabel.textContent = music ? `いま流れている曲：「${jukebox.title}」` : '';
  shop.render(d, key, { music, stay: stay() });
  for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(k === chosen));
  const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
  const cat = yukashiVisit(stay()) !== false ? 'あなたのテーブルに来ている' : PLACES[yukashiPlace(d)].label;
  status.textContent = `${hh}:${mm}　おくのさん：${ACTIVITIES[okunoActivity(d)]}　ゆかし：${cat}　滞在 ${Math.floor(stay() / 60)}分`;
}

const inside = (spot, x, y, pad = 2) => x >= spot.x - pad && x < spot.x + spot.w + pad && y >= spot.y - pad && y < spot.y + spot.h + pad;

sceneEl.addEventListener('click', async e => {
  const r = sceneEl.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * SCENE_W;
  const y = ((e.clientY - r.top) / r.height) * SCENE_H;
  if (inside(SPOTS.okuno, x, y)) bubble.textContent = await nextHitorigoto();
  else if (inside(SPOTS.notebook, x, y, 1)) bubble.textContent = '「スケッチ帳」と書かれた帳面。……いま開いているのが、これだ。';
  else if (inside(SPOTS.jukebox, x, y, 0)) await toggleMusic();
});

// ---- 時間帯の 光 ----
const thumbs = Object.keys(TIMES).map(key => {
  const fig = document.createElement('figure');
  const [c, ctx] = makeCanvas(SCENE_W, SCENE_H);
  const cap = document.createElement('figcaption');
  cap.textContent = TIMES[key].label;
  fig.append(c, cap);
  document.getElementById('thumbs').append(fig);
  return { key, shop: new Shop(ctx) };
});
const drawThumbs = () => thumbs.forEach(th => th.shop.render(now(), th.key));

// ---- 小物 ----
const castItems = [
  ['おくのさん', okuno, 8], ['窓を見る', okunoLook, 8], ['うつむく', okunoDown, 8],
  ['ゆかし', yukashi, 8], ['丸くなる', yukashiLoaf, 8], ['テーブルに来た', yukashiFront, 6], ['まばたき', yukashiFrontBlink, 6],
  ['いつもの一杯', cup, 6], ['壁の時計', clock, 6], ['モンステラの葉', monsteraLeaf, 6],
];
for (const [label, sp, scale] of castItems) {
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

// ---- 動かす：1秒に 8コマ ----
let lastFrame = -1, lastThumbs = -1;
function frame(ms) {
  const f = Math.floor(ms / 125);
  if (f !== lastFrame) {
    lastFrame = f;
    draw();
    const th = Math.floor(ms / 30000);
    if (th !== lastThumbs) { lastThumbs = th; drawThumbs(); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
