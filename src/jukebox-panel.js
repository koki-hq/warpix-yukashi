// ジュークボックスの 曲目カード。昔の ジュークボックスの ように、番号と 曲名が 並ぶ。
import { SONGS, SONG_ORDER, GENRES } from './music.js';

// root：カードを 入れる 要素。prefs：{ mode, volume, playing }。
// onChange(prefs)：選んだ ときに 呼ぶ。getNow()：いま 流れている 曲の id と、鳴っているか
export function createJukeboxPanel(root, { prefs, onChange, getNow }) {
  root.innerHTML = `
    <div class="jb-head"><span>ジュークボックス</span><button class="jb-close" aria-label="閉じる">×</button></div>
    <div class="jb-modes">
      <button data-mode="omakase">おまかせ<small>時間帯や天気で変わる</small></button>
      <button data-mode="iroiro">いろいろ<small>ときどき曲が変わる</small></button>
    </div>
    <div class="jb-list"></div>
    <div class="jb-foot">
      <label>音量 <input class="jb-volume" type="range" min="0" max="1" step="0.05"></label>
      <button class="jb-play"></button>
    </div>`;

  const list = root.querySelector('.jb-list');
  for (const [genre, g] of Object.entries(GENRES)) {
    const head = document.createElement('div');
    head.className = 'jb-genre';
    head.innerHTML = `${g.label}<small>${g.note}</small>`;
    list.append(head);
    for (const id of SONG_ORDER.filter(i => SONGS[i].genre === genre)) {
      const s = SONGS[id];
      const b = document.createElement('button');
      b.dataset.mode = id;
      b.innerHTML = `<b>${s.code}</b>${s.title}<small>${s.note}</small>`;
      list.append(b);
    }
  }

  const volume = root.querySelector('.jb-volume');
  const play = root.querySelector('.jb-play');
  volume.value = prefs.volume;

  function refresh() {
    const now = getNow();
    for (const b of root.querySelectorAll('[data-mode]')) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === prefs.mode));
      b.classList.toggle('jb-now', now.playing && b.dataset.mode === now.id);
    }
    play.textContent = now.playing ? '止める' : '鳴らす';
  }

  root.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.classList.contains('jb-close')) { root.hidden = true; return; }
    if (b === play) { prefs.playing = !getNow().playing; onChange(prefs); }
    else if (b.dataset.mode) { prefs.mode = b.dataset.mode; prefs.playing = true; onChange(prefs); }
    setTimeout(refresh, 50);
  });
  volume.addEventListener('input', () => { prefs.volume = Number(volume.value); onChange(prefs); });

  return {
    open() { refresh(); root.hidden = false; },
    close() { root.hidden = true; },
    toggle() { if (root.hidden) this.open(); else this.close(); },
    refresh,
  };
}

// カードの 見た目（店と スケッチ帳で 共通）
export const JUKEBOX_PANEL_CSS = `
  .jb { position: absolute; right: 2%; bottom: 4%; width: min(46%, 340px); max-height: 88%; overflow-y: auto;
        background: #2b1d1c; color: #efe0bf; border: 3px solid #0d0909; box-shadow: 4px 4px 0 rgba(0,0,0,.45);
        font-size: clamp(11px, 1.3vw, 14px); line-height: 1.5; z-index: 5; }
  .jb[hidden] { display: none; }
  .jb-head { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #57392c; position: sticky; top: 0; }
  .jb button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-align: left; }
  .jb-close { font-size: 1.2em; padding: 0 4px; }
  .jb-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px 10px 4px; }
  .jb-modes button, .jb-list button { display: block; width: 100%; padding: 4px 8px; border: 2px solid #3e2a24 !important; }
  .jb-list { padding: 0 10px 8px; display: grid; gap: 4px; }
  .jb-genre { margin-top: 8px; color: #b88b5e; }
  .jb small { display: block; color: #946a48; font-size: .85em; }
  .jb-genre small { display: inline; margin-left: .6em; }
  .jb-list b { color: #e89a4a; font-weight: normal; margin-right: .6em; }
  .jb [aria-pressed="true"] { border-color: #f6cf72 !important; background: #3e2a24; }
  .jb .jb-now::after { content: ' ♪'; color: #f6cf72; }
  .jb-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 6px 10px; border-top: 2px solid #3e2a24; position: sticky; bottom: 0; background: #2b1d1c; }
  .jb-foot input { width: 7em; accent-color: #e89a4a; vertical-align: middle; }
  .jb-play { border: 2px solid #946a48 !important; padding: 2px 10px !important; }
`;
