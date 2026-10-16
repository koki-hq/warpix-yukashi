// ジュークボックスの 曲を 音の ファイルに 書き出して、音量を 確かめる。
// node tools/listen.mjs [曲の キー] [秒数]   例: node tools/listen.mjs yoru 40
// shots/<キー>.wav に 保存する。Claude は 聞けないので、大きすぎ・割れ・無音が ないかを 数字で 見る。
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { startServer } from './serve.mjs';

const [key = 'hiru', seconds = '30'] = process.argv.slice(2);
const server = await startServer();
const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.goto(`http://127.0.0.1:${server.address().port}/sketchbook.html`, { waitUntil: 'networkidle' });
const result = await tab.evaluate(async ({ key, seconds }) => {
  const { Jukebox, SONGS, MASTER } = await import('./src/music.js');
  const rate = 44100;
  const ctx = new OfflineAudioContext(1, rate * seconds, rate);
  const jb = new Jukebox(ctx);
  jb.master.gain.value = MASTER * jb.volume;
  let t = 0.05, i = 0;
  while (t < seconds) t = jb.schedulePhrase(SONGS[key], t, i++);
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0);
  let peak = 0, sum = 0, nan = 0, silent = 0;
  for (let s = 0; s < d.length; s++) {
    const v = d[s];
    if (Number.isNaN(v)) nan++;
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  // 1秒ごとの 音量で、無音の 区間を 数える
  for (let s = 0; s < seconds; s++) {
    let e = 0;
    for (let k = s * rate; k < (s + 1) * rate; k++) e += d[k] * d[k];
    if (Math.sqrt(e / rate) < 0.002) silent++;
  }
  // 16bit の wav に する
  const bytes = new DataView(new ArrayBuffer(44 + d.length * 2));
  const w = (o, s) => [...s].forEach((c, i) => bytes.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); bytes.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt ');
  bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 1, true);
  bytes.setUint32(24, rate, true); bytes.setUint32(28, rate * 2, true); bytes.setUint16(32, 2, true); bytes.setUint16(34, 16, true);
  w(36, 'data'); bytes.setUint32(40, d.length * 2, true);
  for (let s = 0; s < d.length; s++) bytes.setInt16(44 + s * 2, Math.max(-1, Math.min(1, d[s])) * 32767, true);
  return { title: SONGS[key].title, peak: peak.toFixed(3), rms: Math.sqrt(sum / d.length).toFixed(4), nan, silentSeconds: silent, wav: Array.from(new Uint8Array(bytes.buffer)) };
}, { key, seconds: Number(seconds) });

await mkdir('shots', { recursive: true });
await writeFile(`shots/${key}.wav`, Buffer.from(result.wav));
delete result.wav;
console.log(result, `→ shots/${key}.wav`);
await browser.close();
server.close();
