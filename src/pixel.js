// ドット絵の 文字列を canvas に する 道具と、光の 計算。
import { COLOR } from './palette.js';

// 左半分だけ 描いて、右に 鏡写しする。
export const mirrorX = rows => rows.map(r => r + [...r].reverse().join(''));
// 上半分だけ 描いて、下に 鏡写しする。
export const mirrorY = rows => [...rows, ...rows.slice().reverse()];

// 行の 長さや 知らない 色を 見つけたら、どこが おかしいか 教えて 止まる。
export function sprite(name, rows) {
  const w = rows[0].length;
  rows.forEach((r, y) => {
    if (r.length !== w) throw new Error(`${name}: ${y}行目が ${r.length}文字（${w}文字のはず）`);
    for (const ch of r) {
      if (ch !== '.' && !COLOR[ch]) throw new Error(`${name}: ${y}行目に 知らない色「${ch}」`);
    }
  });
  return { name, w, h: rows.length, rows };
}

// flip で 左右反転、swap で 色の 入れかえ（{ f: 'e' } なら f を e で 塗る）。
export function drawSprite(ctx, sp, x, y, { flip = false, swap } = {}) {
  for (let j = 0; j < sp.h; j++) {
    for (let i = 0; i < sp.w; i++) {
      let ch = sp.rows[j][flip ? sp.w - 1 - i : i];
      if (ch === '.') continue;
      if (swap && swap[ch]) ch = swap[ch];
      ctx.fillStyle = COLOR[ch];
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}

// 決まった 種から 毎回 同じ 並びの 乱数を 出す（本の 並びが 開くたびに 変わらないように）。
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function px(ctx, key, x, y, w = 1, h = 1) {
  ctx.fillStyle = COLOR[key];
  ctx.fillRect(x, y, w, h);
}

// ドットの 線（ブレゼンハム）。
export function line(ctx, key, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(ctx, key, x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

// 光を あてる。ambient は 部屋全体の 色、lamps は 点の 光、beams は 窓から 差しこむ 光（多角形）。
// 明るさは 段階に 丸めて、境目は 網点（ディザ）で ぼかす。なめらかな グラデーションに しないのが ドット絵らしさ。
export function light(ctx, w, h, { ambient, lamps = [], beams = [], steps = 6, skip }) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skip && skip(x, y)) continue;
      const o = (y * w + x) * 4;
      const t = BAYER[(y & 3) * 4 + (x & 3)];
      const inBeams = beams.filter(b => inPolygon(x, y, b.poly));
      for (let c = 0; c < 3; c++) {
        let f = ambient[c];
        for (const L of lamps) {
          const dist = Math.hypot(x - L.x, (y - L.y) * (L.squash ?? 1));
          const k = Math.max(0, 1 - dist / L.r);
          f += L.color[c] * k * k;
        }
        for (const b of inBeams) f += b.color[c];
        const q = Math.floor(f * steps + t) / steps;
        d[o + c] = Math.min(255, d[o + c] * q);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}
