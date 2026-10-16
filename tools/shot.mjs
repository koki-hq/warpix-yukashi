// ページを 開いて 写真を 撮る（Claude の「目」）。
// node tools/shot.mjs <ページ> <保存先.png> [横幅] [--click=セレクタ]
// 例: node tools/shot.mjs "sketchbook.html?time=18:30" shots/yu.png 1100
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { startServer } from './serve.mjs';

const [page = 'index.html', out = 'shots/shot.png', width = '1100', ...rest] = process.argv.slice(2);
const clicks = rest.filter(a => a.startsWith('--click=')).map(a => a.slice(8));

const server = await startServer();
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: Number(width), height: 800 } });
const problems = [];
tab.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${m.type()}] ${m.text()}`); });
tab.on('pageerror', e => problems.push(`[pageerror] ${e.message}`));

await tab.goto(`http://127.0.0.1:${server.address().port}/${page}`, { waitUntil: 'networkidle' });
for (const sel of clicks) await tab.click(sel);
await tab.waitForTimeout(800);
await mkdir(dirname(out), { recursive: true });
await tab.screenshot({ path: out, fullPage: true });
console.log(`saved ${out}`);
if (problems.length) console.log(problems.join('\n'));

await browser.close();
server.close();
