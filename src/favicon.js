// タブの アイコン：上から 見た カップ。飲むほど コーヒーが 減って、内側の 白い 壁が 見えてくる。
import { COLOR } from './palette.js';

const DRINK_COLOR = { yukashi: ['1', '2'], tsukimi: ['2', '3'], milk: ['5', '6'] };

let link = null;
let last = '';

export function drawFavicon(level, drink = 'yukashi') {
  const key = `${drink}:${Math.round(level * 8)}`;
  if (key === last) return; // 見た目が 変わらない ときは 描きなおさない
  last = key;

  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const disc = (r, k, cx = 14, cy = 16) => {
    g.fillStyle = COLOR[k];
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) g.fillRect(cx + x, cy + y, 1, 1);
  };
  disc(14, '0', 15); disc(13, 'c', 15); // ソーサー
  g.fillStyle = COLOR['0']; g.fillRect(23, 13, 8, 7);
  g.fillStyle = COLOR['9']; g.fillRect(24, 14, 6, 5); // 取っ手
  disc(10, '0'); disc(9, '9'); disc(8, 'b');
  if (level > 0.02) {
    const [edge, body] = DRINK_COLOR[drink];
    const r = Math.max(1, Math.round(2 + 6 * level));
    disc(r, edge);
    if (r > 1) disc(r - 1, body);
    if (r > 3) { g.fillStyle = COLOR['8']; g.fillRect(12, 14, 2, 1); }
  }

  if (!link) {
    link = document.querySelector('link[rel="icon"]') ?? Object.assign(document.createElement('link'), { rel: 'icon' });
    document.head.append(link);
  }
  link.href = c.toDataURL('image/png');
}
