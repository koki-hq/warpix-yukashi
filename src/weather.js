// 月見坂の 天気。日付と 時刻から 決まるので、同じ 時刻なら 誰が 来ても 同じ 天気。
// 本当の 天気は 見ない（お客さんの 場所を 使わない）。

const HOUR = 60 * 60 * 1000;

function hash(n) {
  const v = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return v - Math.floor(v);
}

const local = date => date.getTime() - date.getTimezoneOffset() * 60000;

export const WEATHERS = { hare: '晴れ', kiri: '霧', ame: '雨' };

// 霧の 朝：日付で 決まる。三日に 一日くらい、5時から 10時まで
export function isFoggyMorning(date) {
  const h = date.getHours();
  const day = Math.floor(local(date) / (24 * HOUR));
  return h >= 5 && h < 10 && hash(day) < 0.33;
}

// 雨：3時間ごとに 決まる。だいたい 6回に 1回
export function isRainy(date) {
  const block = Math.floor(local(date) / (3 * HOUR));
  return hash(block * 3.7 + 5) < 0.17;
}

export function weatherOf(date) {
  if (isRainy(date)) return 'ame';
  if (isFoggyMorning(date)) return 'kiri';
  return 'hare';
}
