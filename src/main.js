// 喫茶ゆかし。ドアを 開けて、席に 着いて、あとは のんびり。
//
// 流れ：door（店の 表）→ opening（ドアが 開く）→ walk（席まで 歩く）→ sit（座る）→ stay（過ごす）
import { Shop, SPOTS, timeKeyOf, yukashiPlace, yukashiVisit, SCENE_W as W, SCENE_H as H } from './scene.js';
import { drawFacade, DOOR } from './facade.js';
import { Jukebox } from './music.js';
import { nextHitorigoto } from './hitorigoto.js';
import { checkIn } from './guest.js';
import { greeting, chooseDrink, orderLine, SERVED, WELCOME_BACK, PURR } from './lines.js';
import { drawFavicon } from './favicon.js';

const SCALE = 4; // 画面は 4倍の 細かさで 描く（寄るときに ドットが ゆがまないように）
const view = document.getElementById('view');
view.width = W * SCALE;
view.height = H * SCALE;
const ctx = view.getContext('2d');
ctx.imageSmoothingEnabled = false;

const layer = document.createElement('canvas');
layer.width = W;
layer.height = H;
const lctx = layer.getContext('2d', { willReadFrequently: true });
const shop = new Shop(lctx);

const bubble = document.getElementById('bubble');
const hint = document.getElementById('hint');
const songEl = document.getElementById('song');

const MIN = 60 * 1000;
const COFFEE = { drink: 25 * MIN, refillAfter: 27 * MIN }; // 25分で 飲みおわり、2分 たつと おかわり

const state = {
  phase: 'door',
  phaseAt: performance.now(),
  guest: null,
  drink: null,
  servedAt: 0,
  satAt: 0,
  bowUntil: 0,
  hiddenAt: 0,
  script: [], // [時刻, 動作] の 予定
};
let jukebox = null;

function go(phase) {
  state.phase = phase;
  state.phaseAt = performance.now();
}

// ---- ふきだし ----

let bubbleTimer = 0;
function say(text, spot = 'okuno') {
  const anchor = spot === 'door' ? { x: DOOR.x + DOOR.w / 2, y: DOOR.y - 8 }
    : spot === 'cat' ? { x: 84, y: 142 }
    : { x: SPOTS.okuno.x + 6, y: SPOTS.okuno.y - 3 };
  bubble.textContent = text;
  bubble.style.left = `${(anchor.x / W) * 100}%`;
  bubble.style.top = `${(anchor.y / H) * 100}%`;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 3500 + text.length * 120);
}

// ---- 音楽 ----

function updateSong() {
  if (!jukebox) return;
  songEl.textContent = jukebox.playing ? `♪ ${jukebox.title}` : '♪ ジュークボックスは休憩中';
  songEl.setAttribute('aria-pressed', String(jukebox.playing));
}
async function toggleMusic() {
  if (!jukebox) return;
  if (jukebox.playing) jukebox.stop();
  else await jukebox.start(timeKeyOf(new Date()));
  updateSong();
}
songEl.addEventListener('click', toggleMusic);

// ---- 入店 ----

async function openDoor() {
  if (state.phase !== 'door') return;
  jukebox = new Jukebox();
  jukebox.bell();
  state.guest = checkIn();
  go('opening');
  hint.classList.add('gone');
  setTimeout(() => say(greeting(state.guest, new Date()), 'door'), 300);
  setTimeout(async () => { await jukebox.start(timeKeyOf(new Date())); updateSong(); }, 1400);
}

function sitDown() {
  go('stay');
  state.satAt = Date.now();
  const now = performance.now();
  state.drink = chooseDrink(new Date());
  state.script = [
    [now + 1500, () => say(orderLine(state.guest, state.drink))],
    [now + 7000, serve],
  ];
}

function serve() {
  state.servedAt = Date.now();
  state.served = true;
  jukebox?.clink();
  say(SERVED);
  updateCoffee();
}

// ---- コーヒー：冷めて、減って、おかわり ----

function coffee() {
  if (!state.served) return { level: 1, warmth: 0 };
  let elapsed = Date.now() - state.servedAt;
  if (elapsed >= COFFEE.refillAfter) {
    // 黙って おかわりを 置いていく
    state.servedAt = Date.now();
    elapsed = 0;
    if (!document.hidden) jukebox?.clink();
  }
  const min = elapsed / MIN;
  return {
    level: Math.max(0, 1 - elapsed / COFFEE.drink),
    warmth: min < 6 ? 3 : min < 10 ? 2 : min < 14 ? 1 : 0,
  };
}

function updateCoffee() {
  if (state.served) drawFavicon(coffee().level, state.drink);
}
setInterval(updateCoffee, 20000); // タブが 裏でも、アイコンの コーヒーは 減っていく

// ---- タブに もどったら ----

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { state.hiddenAt = Date.now(); return; }
  if (state.phase === 'stay' && state.hiddenAt && Date.now() - state.hiddenAt > 30000) {
    state.bowUntil = performance.now() + 1400;
    setTimeout(() => say(WELCOME_BACK), 300);
  }
  updateCoffee();
});

// ---- 描く ----

const ease = p => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

function camera(zoom, cx, cy) {
  const sw = W / zoom, sh = H / zoom;
  const sx = Math.min(Math.max(cx - sw / 2, 0), W - sw);
  const sy = Math.min(Math.max(cy - sh / 2, 0), H - sh);
  ctx.drawImage(layer, sx, sy, sw, sh, 0, 0, view.width, view.height);
}

function fade(alpha) {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(13, 9, 9, ${Math.min(1, alpha)})`;
  ctx.fillRect(0, 0, view.width, view.height);
}

function draw(now) {
  const date = new Date();
  const key = timeKeyOf(date);
  const e = (now - state.phaseAt) / 1000;
  const music = !!jukebox?.playing;
  if (music) jukebox.setSong(key);

  if (state.phase === 'door' || state.phase === 'opening') {
    const open = state.phase === 'opening' ? Math.min(1, e / 0.8) : 0;
    drawFacade(lctx, key, { open, cat: yukashiPlace(date) === 'mado', s: date.getTime() / 1000 });
    ctx.drawImage(layer, 0, 0, view.width, view.height);
    if (state.phase === 'opening') {
      // ドアの 向こうへ 寄っていって、暗転
      const p = Math.max(0, (e - 0.9) / 1.1);
      if (p > 0) {
        const z = 1 + ease(Math.min(1, p)) * 1.5;
        camera(z, DOOR.x + DOOR.w / 2, DOOR.y + DOOR.h / 2);
        fade(p * 1.2);
      }
      if (e > 2.1) {
        bubble.classList.remove('show'); // ふきだしは ドアの 位置に あるので、中に 入ったら しまう
        go('walk');
      }
    }
    return;
  }

  const stay = state.satAt ? (Date.now() - state.satAt) / 1000 : 0;
  const { warmth } = coffee();
  shop.render(date, key, {
    music,
    stay,
    drink: state.served ? state.drink : null,
    warmth,
    bow: now < state.bowUntil,
  });

  if (state.phase === 'walk') {
    // カウンターの 前から、奥の 角の 席へ。歩くので すこし 揺れる
    const p = Math.min(1, e / 4.2);
    const k = ease(p);
    const bob = Math.round(Math.sin(e * Math.PI * 2 * 1.6)) * (1 - p) * 1.2;
    camera(1.8 - 0.8 * k, 200 - 40 * k, 86 + 4 * k + bob);
    fade(1 - e / 0.6);
    if (p >= 1) go('sit');
    return;
  }
  if (state.phase === 'sit') {
    // 腰を おろす：視線が すっと 下がって、もどる
    const p = Math.min(1, e / 0.7);
    camera(1, 160, 90 + Math.sin(p * Math.PI) * 3);
    if (p >= 1) sitDown();
    return;
  }

  ctx.drawImage(layer, 0, 0, view.width, view.height);
  while (state.script.length && state.script[0][0] <= now) state.script.shift()[1]();
}

let lastFrame = -1;
function frame(now) {
  const f = Math.floor(now / 125); // 1秒に 8コマ
  if (f !== lastFrame) {
    lastFrame = f;
    draw(now);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---- さわる ----

function scenePoint(ev) {
  const r = view.getBoundingClientRect();
  return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
}
const inside = (spot, p, pad = 2) => p.x >= spot.x - pad && p.x < spot.x + spot.w + pad && p.y >= spot.y - pad && p.y < spot.y + spot.h + pad;

function target(p) {
  if (state.phase === 'door') return inside(DOOR, p, 4) ? 'door' : null;
  if (state.phase !== 'stay') return null;
  if (yukashiVisit((Date.now() - state.satAt) / 1000) !== false && inside({ x: 74, y: 146, w: 20, h: 18 }, p)) return 'cat';
  if (inside(SPOTS.okuno, p)) return 'okuno';
  if (inside(SPOTS.notebook, p, 1)) return 'notebook';
  if (inside(SPOTS.jukebox, p, 0)) return 'jukebox';
  return null;
}

view.addEventListener('mousemove', ev => { view.style.cursor = target(scenePoint(ev)) ? 'pointer' : 'default'; });
view.addEventListener('click', async ev => {
  const t = target(scenePoint(ev));
  if (t === 'door') openDoor();
  else if (t === 'okuno') say(await nextHitorigoto());
  else if (t === 'cat') say(PURR, 'cat');
  else if (t === 'notebook') window.open('./sketchbook.html', '_blank', 'noopener');
  else if (t === 'jukebox') toggleMusic();
});
view.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && state.phase === 'door') { ev.preventDefault(); openDoor(); }
});

drawFavicon(1, 'yukashi');
