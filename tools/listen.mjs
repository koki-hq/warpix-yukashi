// ジュークボックスの 曲を 音の ファイルに 書き出して、音量を 確かめる。
// node tools/listen.mjs [曲の id か all] [秒数]   例: node tools/listen.mjs nocturne 40 / node tools/listen.mjs all 30
// shots/<id>.wav に 保存する。Claude は 聞けないので、大きすぎ・割れ・無音・曲ごとの 音量の ばらつきを 数字で 見る。
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { startServer } from './serve.mjs';

const [which = 'all', seconds = '30'] = process.argv.slice(2);
const server = await startServer();
const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.goto(`http://127.0.0.1:${server.address().port}/sketchbook.html`, { waitUntil: 'networkidle' });
const ids = which === 'all' ? await tab.evaluate(async () => (await import('./src/music.js')).SONG_ORDER) : [which];

await mkdir('shots', { recursive: true });
const rows = [];
for (const id of ids) {
  const result = await tab.evaluate(async ({ id, seconds }) => {
    const { Jukebox, SONGS, MASTER } = await import('./src/music.js');
    const rate = 44100;
    const ctx = new OfflineAudioContext(1, rate * seconds, rate);
    const jb = new Jukebox(ctx);
    jb.master.gain.value = MASTER * jb.volume;
    jb.switchTo(id);
    jb.fill(seconds);
    const buf = await ctx.startRendering();
    const d = buf.getChannelData(0);
    let peak = 0, sum = 0, nan = 0, silent = 0;
    for (let s = 0; s < d.length; s++) {
      const v = d[s];
      if (Number.isNaN(v)) nan++;
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
    for (let s = 1; s < seconds; s++) {
      let e = 0;
      for (let k = s * rate; k < (s + 1) * rate; k++) e += d[k] * d[k];
      if (Math.sqrt(e / rate) < 0.002) silent++;
    }
    const bytes = new DataView(new ArrayBuffer(44 + d.length * 2));
    const w = (o, s) => [...s].forEach((c, i) => bytes.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); bytes.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt ');
    bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 1, true);
    bytes.setUint32(24, rate, true); bytes.setUint32(28, rate * 2, true); bytes.setUint16(32, 2, true); bytes.setUint16(34, 16, true);
    w(36, 'data'); bytes.setUint32(40, d.length * 2, true);
    for (let s = 0; s < d.length; s++) bytes.setInt16(44 + s * 2, Math.max(-1, Math.min(1, d[s])) * 32767, true);
    return {
      id, title: SONGS[id].title, genre: SONGS[id].genre,
      peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan, silentSeconds: silent,
      wav: Array.from(new Uint8Array(bytes.buffer)),
    };
  }, { id, seconds: Number(seconds) });
  await writeFile(`shots/${id}.wav`, Buffer.from(result.wav));
  delete result.wav;
  rows.push(result);
}
console.table(rows);
await browser.close();
server.close();
