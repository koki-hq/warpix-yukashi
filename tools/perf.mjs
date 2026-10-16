// 店の 1コマを 描くのに かかる 時間を 測る。開きっぱなしに されるので、軽さは 大事。
// node tools/perf.mjs
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const server = await startServer();
const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.goto(`http://127.0.0.1:${server.address().port}/sketchbook.html`, { waitUntil: 'networkidle' });
const result = await tab.evaluate(async () => {
  const { Shop, TIMES } = await import('./src/scene.js');
  const c = document.createElement('canvas');
  c.width = 320; c.height = 180;
  const shop = new Shop(c.getContext('2d', { willReadFrequently: true }));
  const out = {};
  for (const key of Object.keys(TIMES)) {
    shop.render(new Date(), key); // 1コマ目は 下ごしらえ（光の 表を 作る）
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) shop.render(new Date(Date.now() + i * 125), key);
    out[key] = ((performance.now() - t0) / 100).toFixed(2);
  }
  return out;
});
console.log('1コマあたり (ms):', result);
await browser.close();
server.close();
