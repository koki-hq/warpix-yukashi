// ページを 開いて 写真を 撮る（Claude の「目」）。
// node tools/shot.mjs <ページ> <保存先.png> [横幅] [手順...]
//
// 手順は 書いた 順に 行う：
//   --click=セレクタ          その 要素を クリック
//   --clickat=セレクタ@x,y    その 要素の 左上から x,y（CSS ピクセル）を クリック
//   --wait=ミリ秒             待つ（入店の 演出などを 待つ）
//   --el=セレクタ             最後に その 部分だけを 撮る（なければ ページ全体）
// 例: node tools/shot.mjs index.html shots/a.png 1000 --clickat=#view@484,342 --wait=9000 --click=#song --el=.stage
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { startServer } from './serve.mjs';

const [page = 'index.html', out = 'shots/shot.png', width = '1100', ...steps] = process.argv.slice(2);
const element = steps.find(a => a.startsWith('--el='))?.slice(5);

const server = await startServer();
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: Number(width), height: 800 } });
const problems = [];
tab.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${m.type()}] ${m.text()}`); });
tab.on('pageerror', e => problems.push(`[pageerror] ${e.message}`));

await tab.goto(`http://127.0.0.1:${server.address().port}/${page}`, { waitUntil: 'networkidle' });
let waited = false;
for (const step of steps) {
  const [name, value] = [step.slice(2, step.indexOf('=')), step.slice(step.indexOf('=') + 1)];
  if (name === 'click') await tab.click(value);
  else if (name === 'clickat') {
    const [sel, pos] = value.split('@');
    const [x, y] = pos.split(',').map(Number);
    await tab.click(sel, { position: { x, y } });
  } else if (name === 'wait') await tab.waitForTimeout(Number(value));
  waited = name === 'wait';
}
if (!waited) await tab.waitForTimeout(800);
await mkdir(dirname(out), { recursive: true });
if (element) await tab.locator(element).screenshot({ path: out });
else await tab.screenshot({ path: out, fullPage: true });
console.log(`saved ${out}`);
if (problems.length) console.log(problems.join('\n'));

await browser.close();
server.close();
