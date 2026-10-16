import { PALETTE } from './palette.js';
import { drawSprite } from './pixel.js';
import {
  cup, okuno, okunoLook, okunoDown, yukashi, yukashiLoaf, yukashiFront, yukashiFrontBlink, clock, monsteraLeaf,
} from './sprites.js';
import {
  Shop, TIMES, timeKeyOf, okunoActivity, ACTIVITIES, yukashiPlace, yukashiVisit, PLACES, SCENE_W, SCENE_H, SPOTS,
} from './scene.js';
import { nextHitorigoto } from './hitorigoto.js';
import { Jukebox, SONGS, SONG_ORDER, GENRES } from './music.js';
import { VERSION } from './version.js';
import { weatherOf, WEATHERS } from './weather.js';
import { chooseSweet } from './lines.js';
import { seasonOf, sekkiOf, moonPhase, moonName, SEASONS } from './koyomi.js';
import { drawFacade, FACADE_W, FACADE_H } from './facade.js';

const params = new URLSearchParams(location.search);
// 確認用：?time=18:30 で その時刻から、?speed=60 で 60倍速
const startReal = Date.now();
const startShop = (() => {
  const d = new Date();
  // ?date=2027-01-15 で 日付も 決めうちに できる（季節や 月を 見る ため）
  const ymd = params.get('date');
  if (ymd) {
    const [y, mo, da] = ymd.split('-').map(Number);
    d.setFullYear(y, mo - 1, da);
  }
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
// 音は クリックした あとに だけ 鳴らせる（ブラウザの 決まり）。
// 上の ボタンは「おまかせ」（時間帯で 変わる）、試聴室では 1曲ずつ
let jukebox = null;
let mode = 'omakase';
const musicButton = document.getElementById('music');
const songLabel = document.getElementById('song');
async function playMode(m) {
  jukebox ??= new Jukebox();
  if (jukebox.playing && mode === m) {
    jukebox.stop();
  } else {
    mode = m;
    await jukebox.start();
    jukebox.follow(mode, currentKey(), 'hare');
  }
  musicButton.setAttribute('aria-pressed', String(jukebox.playing && mode === 'omakase'));
  refreshListen();
}
musicButton.addEventListener('click', () => playMode('omakase'));

const currentKey = () => (chosen === 'now' ? timeKeyOf(now()) : chosen);

// ---- 試聴室 ----
const LISTEN_KEY = 'kissa-yukashi.listening';
const listenNotes = (() => { try { return JSON.parse(localStorage.getItem(LISTEN_KEY) ?? '{}'); } catch { return {}; } })();
const saveListen = () => { try { localStorage.setItem(LISTEN_KEY, JSON.stringify(listenNotes)); } catch { /* 覚えられなくても 聴ける */ } };
const FEELINGS = ['いい', 'ふつう', '気になる'];
const listenEl = document.getElementById('listen');
const playButtons = {};
for (const [genre, g] of Object.entries(GENRES)) {
  const head = document.createElement('div');
  head.className = 'genre';
  head.textContent = `${g.label}：${g.note}`;
  listenEl.append(head);
  for (const id of SONG_ORDER.filter(i => SONGS[i].genre === genre)) {
    const s = SONGS[id];
    const row = document.createElement('div');
    row.className = 'row';
    const play = document.createElement('button');
    play.addEventListener('click', () => playMode(id));
    playButtons[id] = play;
    const name = document.createElement('span');
    name.className = 'name';
    name.innerHTML = `<span class="code">${s.code}</span>${s.title}<small>${s.note}・${s.bpm} BPM</small>`;
    row.append(play, name);
    for (const f of FEELINGS) {
      const b = document.createElement('button');
      b.textContent = f;
      b.setAttribute('aria-pressed', String(listenNotes[id] === f));
      b.addEventListener('click', () => {
        listenNotes[id] = listenNotes[id] === f ? undefined : f;
        saveListen();
        for (const x of row.querySelectorAll('button:not(:first-child)')) x.setAttribute('aria-pressed', String(listenNotes[id] === x.textContent));
      });
      row.append(b);
    }
    listenEl.append(row);
  }
}
const memo = document.getElementById('listen-memo');
memo.value = listenNotes.memo ?? '';
memo.addEventListener('input', () => { listenNotes.memo = memo.value; saveListen(); });
function refreshListen() {
  for (const [id, b] of Object.entries(playButtons)) {
    const on = !!jukebox?.playing && mode === id;
    b.textContent = on ? '■' : '▶';
    b.setAttribute('aria-pressed', String(on));
  }
}
refreshListen();
document.getElementById('listen-copy').addEventListener('click', async () => {
  const lines = [`喫茶ゆかし 試聴室の感想（版 ${VERSION}）`];
  for (const id of SONG_ORDER) lines.push(`${SONGS[id].code} ${SONGS[id].title}（${GENRES[SONGS[id].genre].label}）：${listenNotes[id] ?? '未'}`);
  if (listenNotes.memo) lines.push('', `メモ：${listenNotes.memo}`);
  const text = lines.join('\n');
  const done = document.getElementById('listen-copied');
  try {
    await navigator.clipboard.writeText(text);
    done.textContent = 'コピーしました。';
  } catch {
    memo.value = text; // コピーできない ときは、メモ欄に 出して 手で コピーしてもらう
    done.textContent = 'コピーできなかったので、メモ欄に出しました。';
  }
});

// ---- 天気 ----
let chosenWeather = params.get('weather') ?? 'now';
const currentWeather = () => (chosenWeather === 'now' ? weatherOf(now()) : chosenWeather);
const weatherButtons = ['now', ...Object.keys(WEATHERS)].map(key => {
  const b = document.createElement('button');
  b.textContent = key === 'now' ? 'いまの天気' : WEATHERS[key];
  b.addEventListener('click', () => { chosenWeather = key; draw(); });
  document.getElementById('weather-tabs').append(b);
  return [key, b];
});

function draw() {
  const d = now();
  const key = currentKey();
  const weather = currentWeather();
  for (const [k, b] of weatherButtons) b.setAttribute('aria-pressed', String(k === chosenWeather));
  const music = !!jukebox?.playing;
  if (music) jukebox.follow(mode, key, weather);
  jukebox?.setRain(music && weather === 'ame');
  songLabel.textContent = music ? `いま流れている曲：「${jukebox.title}」` : '';
  shop.render(d, key, { music, stay: stay(), weather, sweet: chooseSweet(d), sweetLeft: params.get('left') ? Number(params.get('left')) : 1 });
  drawFacade(facadeCtx, key, { cat: yukashiPlace(d, weather) === 'mado', s: d.getTime() / 1000, weather });
  for (const [k, b] of buttons) b.setAttribute('aria-pressed', String(k === chosen));
  const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
  const cat = yukashiVisit(stay()) !== false ? 'あなたのテーブルに来ている' : PLACES[yukashiPlace(d, weather)].label;
  status.textContent = `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}　${sekkiOf(d)}（${SEASONS[seasonOf(d)]}）・${moonName(moonPhase(d))}　${WEATHERS[weather]}　おくのさん：${ACTIVITIES[okunoActivity(d)]}　ゆかし：${cat}　滞在 ${Math.floor(stay() / 60)}分`;
}
const [, facadeCtx] = makeCanvas(FACADE_W, FACADE_H, document.getElementById('facade'));

const inside = (spot, x, y, pad = 2) => x >= spot.x - pad && x < spot.x + spot.w + pad && y >= spot.y - pad && y < spot.y + spot.h + pad;

sceneEl.addEventListener('click', async e => {
  const r = sceneEl.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * SCENE_W;
  const y = ((e.clientY - r.top) / r.height) * SCENE_H;
  if (inside(SPOTS.okuno, x, y)) bubble.textContent = await nextHitorigoto({ weather: currentWeather(), timeKey: currentKey(), season: seasonOf(now()) });
  else if (inside(SPOTS.notebook, x, y, 1)) bubble.textContent = '「スケッチ帳」と書かれた帳面。……いま開いているのが、これだ。';
  else if (inside(SPOTS.jukebox, x, y, 0)) await playMode(mode);
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
