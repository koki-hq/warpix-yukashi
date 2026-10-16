// ページを 開いて 写真を 撮る（Claude の「目」）。
// node tools/shot.mjs <ページ> <保存先.png> [横幅] [--click=セレクタ] [--el=セレクタ]
// 例: node tools/shot.mjs "sketchbook.html?time=18:30" shots/yu.png 1100 --el=#scene
//   --el をつけると、その 部分だけを 撮る
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { startServer } from './serve.mjs';

const [page = 'index.html', out = 'shots/shot.png', width = '1100', ...rest] = process.argv.slice(2);
const clicks = rest.filter(a => a.startsWith('--click=')).map(a => a.slice(8));
const element = rest.find(a => a.startsWith('--el='))?.slice(5);
// --clickat=セレクタ@x,y：その 部分の 左上から x,y（CSS ピクセル）を クリック
const clickAt = rest.filter(a => a.startsWith('--clickat=')).map(a => a.slice(10));
// --wait=ミリ秒：撮る 前に 待つ（入店の 演出などを 待つ）
const wait = Number(rest.find(a => a.startsWith('--wait='))?.slice(7) ?? 800);

const server = await startServer();
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: Number(width), height: 800 } });
const problems = [];
tab.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${m.type()}] ${m.text()}`); });
tab.on('pageerror', e => problems.push(`[pageerror] ${e.message}`));

await tab.goto(`http://127.0.0.1:${server.address().port}/${page}`, { waitUntil: 'networkidle' });
for (const sel of clicks) await tab.click(sel);
for (const c of clickAt) {
  const [sel, pos] = c.split('@');
  const [x, y] = pos.split(',').map(Number);
  await tab.click(sel, { position: { x, y } });
}
await tab.waitForTimeout(wait);
await mkdir(dirname(out), { recursive: true });
if (element) await tab.locator(element).screenshot({ path: out });
else await tab.screenshot({ path: out, fullPage: true });
console.log(`saved ${out}`);
if (problems.length) console.log(problems.join('\n'));

await browser.close();
server.close();
