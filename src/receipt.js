// お会計の レシート。canvas に 描くので、そのまま 画像として 保存できる。
import { COLOR } from './palette.js';

const W = 240; // レシートの 幅（ドット）
const S = 2;   // 描く 細かさ

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export function formatStay(sec) {
  const m = Math.floor(sec / 60);
  if (m < 1) return '1分たらず';
  if (m < 60) return `${m}分`;
  return `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ''}`;
}

// 文字を 幅に 合わせて 折り返す
function wrap(g, text, width) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    if (g.measureText(line + ch).width > width && line) { lines.push(line); line = ''; }
    line += ch;
  }
  if (line) lines.push(line);
  return lines;
}

// data: { date, visit, items: [[名前, 数]], stay, catVisits, hitorigotoCount, words }
export async function drawReceipt(canvas, data) {
  try { await document.fonts.load(`${12 * S}px "DotGothic16"`); } catch { /* 読めなければ ふつうの 字で */ }
  const g = canvas.getContext('2d');
  const font = size => `${size * S}px "DotGothic16", monospace`;
  const pad = 16;

  // 先に 高さを 測る
  g.font = font(11);
  const words = wrap(g, `「${data.words}」`, (W - pad * 2) * S);
  const rows = 16 + data.items.length + words.length;
  const H = 40 + rows * 16 + 8;
  canvas.width = W * S;
  canvas.height = H * S;
  g.imageSmoothingEnabled = false;

  // 紙：下の 端は ギザギザに ちぎれている
  g.fillStyle = COLOR['9'];
  g.fillRect(0, 0, W * S, (H - 6) * S);
  for (let x = 0; x < W; x += 6) {
    g.beginPath();
    g.moveTo(x * S, (H - 6) * S);
    g.lineTo((x + 3) * S, H * S);
    g.lineTo((x + 6) * S, (H - 6) * S);
    g.fill();
  }

  let y = 26;
  const ink = COLOR['2'], dim = COLOR['5'];
  const center = (text, size = 11, color = ink) => {
    g.font = font(size); g.fillStyle = color; g.textAlign = 'center';
    g.fillText(text, (W / 2) * S, y * S); y += size + 6;
  };
  const row = (left, right, color = ink) => {
    g.font = font(11); g.fillStyle = color;
    g.textAlign = 'left'; g.fillText(left, pad * S, y * S);
    g.textAlign = 'right'; g.fillText(right, (W - pad) * S, y * S);
    y += 16;
  };
  const rule = () => {
    g.fillStyle = COLOR.b;
    for (let x = pad; x < W - pad; x += 4) g.fillRect(x * S, (y - 6) * S, 2 * S, S);
    y += 8;
  };

  const d = data.date;
  center('喫茶 ゆかし', 16);
  center('月見坂中腹　坂の途中', 10, dim);
  y += 4; rule();
  row(`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`, `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  if (data.koyomi) row(data.koyomi, '', dim);
  row('ご来店', `${data.visit}回目`, dim);
  rule();
  for (const [name, n] of data.items) row(name, `×${n}`);
  rule();
  row('ご滞在', formatStay(data.stay));
  row('ゆかしが来た', `${data.catVisits}回`);
  row('ひとりごと', `${data.hitorigotoCount}回`);
  rule();
  row('お代', 'またのお越しで');
  rule();
  center('本日のひとこと', 10, dim);
  g.font = font(11); g.fillStyle = ink; g.textAlign = 'left';
  for (const line of words) { g.fillText(line, pad * S, y * S); y += 16; }
  y += 6;
  center('ありがとうございました', 11);

  // ゆかしの 足あとの はんこ
  const sx = W - pad - PAW[0].length * 3, sy = y - 16;
  g.fillStyle = COLOR.h;
  g.globalAlpha = 0.7;
  PAW.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') g.fillRect((sx + i * 3) * S, (sy + j * 3) * S, 3 * S, 3 * S); }));
  g.globalAlpha = 1;
}

const PAW = [
  '..00.00..',
  '..00.00..',
  '00.....00',
  '00.000.00',
  '..00000..',
  '.0000000.',
  '.0000000.',
  '..00000..',
];

export function saveReceipt(canvas, date) {
  const name = `yukashi-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.png`;
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
}
