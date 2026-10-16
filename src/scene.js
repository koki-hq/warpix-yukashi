// 店の 景色を 組み立てる（いまは スケッチ用の 小さな 版）。
import { drawSprite, px, line, light } from './pixel.js';
import { cup, yukashi, okuno, clock } from './sprites.js';

export const SCENE_W = 128;
export const SCENE_H = 72;

const WINDOW = { x: 6, y: 8, w: 34, h: 30 };
const LAMP = { x: 104, y: 20 };

export const TIMES = {
  asa: {
    label: '朝',
    sky: ['p', 'p', 'o'],
    ambient: [0.78, 0.8, 0.88],
    lamps: [{ x: 23, y: 23, r: 80, color: [0.4, 0.38, 0.3] }],
  },
  hiru: {
    label: '昼',
    sky: ['o', 'o', 'p'],
    ambient: [0.92, 0.9, 0.86],
    lamps: [{ x: 23, y: 23, r: 90, color: [0.3, 0.3, 0.26] }],
  },
  yu: {
    label: '夕',
    sky: ['h', 'i', 'j'],
    ambient: [0.62, 0.48, 0.42],
    lamps: [
      { x: 23, y: 23, r: 90, color: [0.55, 0.32, 0.12] },
      { x: LAMP.x, y: LAMP.y, r: 50, color: [0.3, 0.22, 0.1], squash: 0.8 },
    ],
  },
  yoru: {
    label: '夜',
    sky: ['l', 'l', 'm'],
    stars: true,
    ambient: [0.26, 0.28, 0.42],
    lamps: [{ x: LAMP.x, y: LAMP.y, r: 80, color: [1.05, 0.78, 0.42], squash: 0.7 }],
  },
};

export function timeKeyOf(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 10) return 'asa';
  if (h >= 10 && h < 16) return 'hiru';
  if (h >= 16 && h < 19) return 'yu';
  return 'yoru';
}

export function drawClockHands(ctx, x, y, date) {
  const cx = x + 7.5, cy = y + 7.5;
  const m = date.getMinutes() + date.getSeconds() / 60;
  const h = (date.getHours() % 12) + m / 60;
  const hand = (turn, len, key) => {
    const a = turn * Math.PI * 2 - Math.PI / 2;
    line(ctx, key, cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
  };
  hand(h / 12, 3, '0');
  hand(m / 60, 5, '1');
}

function drawWindow(ctx, t) {
  const { x, y, w, h } = WINDOW;
  // 空は 3段の 帯で 塗る
  const band = Math.ceil(h / 3);
  t.sky.forEach((key, i) => px(ctx, key, x, y + i * band, w, Math.min(band, h - i * band)));
  if (t.stars) {
    [[4, 3], [20, 6], [28, 2], [12, 12], [25, 15]].forEach(([sx, sy]) => px(ctx, 'p', x + sx, y + sy));
  }
  // 窓わく
  px(ctx, '1', x - 2, y - 2, w + 4, 2);
  px(ctx, '1', x - 2, y + h, w + 4, 2);
  px(ctx, '1', x - 2, y, 2, h);
  px(ctx, '1', x + w, y, 2, h);
  px(ctx, '1', x + w / 2 - 1, y, 2, h);
  px(ctx, '1', x, y + h / 2 - 1, w, 2);
  px(ctx, '5', x - 3, y + h + 2, w + 6, 2); // 窓台
}

export function drawScene(ctx, timeKey, date = new Date()) {
  const t = TIMES[timeKey];
  // 壁と 腰板
  px(ctx, '3', 0, 0, SCENE_W, SCENE_H);
  for (let x = 0; x < SCENE_W; x += 6) px(ctx, '2', x, 0, 1, 44);
  px(ctx, '2', 0, 40, SCENE_W, 4);

  drawWindow(ctx, t);
  drawSprite(ctx, clock, 46, 8);
  drawClockHands(ctx, 46, 8, date);

  // ランプ
  px(ctx, '0', LAMP.x, 0, 1, 13);
  px(ctx, '0', LAMP.x - 5, 13, 11, 1);
  px(ctx, 'h', LAMP.x - 6, 14, 13, 4);
  px(ctx, 'g', LAMP.x - 6, 17, 13, 1);
  px(ctx, 'k', LAMP.x - 2, 18, 5, 1);

  drawSprite(ctx, okuno, 64, 20);

  // カウンター
  px(ctx, '6', 0, 44, SCENE_W, 1);
  px(ctx, '5', 0, 45, SCENE_W, 7);
  px(ctx, '4', 0, 50, SCENE_W, 2);
  px(ctx, '0', 0, 52, SCENE_W, 1);
  px(ctx, '2', 0, 53, SCENE_W, 19);
  for (let x = 4; x < SCENE_W; x += 16) px(ctx, '1', x, 53, 1, 19);

  drawSprite(ctx, yukashi, 98, 32);
  drawSprite(ctx, cup, 22, 36);

  const W = WINDOW;
  light(ctx, SCENE_W, SCENE_H, {
    ambient: t.ambient,
    lamps: t.lamps,
    skip: (x, y) => x >= W.x && x < W.x + W.w && y >= W.y && y < W.y + W.h,
  });
  // ランプの 光源そのものは 暗くしない
  if (timeKey === 'yoru' || timeKey === 'yu') px(ctx, 'k', LAMP.x - 3, 18, 7, 1);
}
