// おくのさんの、もてなしの ことば。ひとりごとは data/hitorigoto.txt。

const DAY = 24 * 60 * 60 * 1000;

function hash(n) {
  const v = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return v - Math.floor(v);
}

// 霧の 朝：日付で 決まる（同じ 日なら 誰が 来ても 霧）。三日に 一日くらい
export function isFoggyMorning(date) {
  const h = date.getHours();
  const day = Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / DAY);
  return h >= 5 && h < 10 && hash(day) < 0.33;
}

export function greeting(guest, date) {
  if (guest.visits <= 1) return 'いらっしゃいませ。';
  if (guest.previous && date - guest.previous > 30 * DAY) return 'いらっしゃいませ。……おや、おひさしぶりですね。';
  if (guest.visits >= 5) return 'いらっしゃいませ。いつもの席、空いていますよ。';
  return 'いらっしゃいませ。また来てくださったんですね。';
}

// 注文は お客さんが 選ばない。おくのさんが 顔を 見て 決める
export function chooseDrink(date) {
  const h = date.getHours();
  if (h >= 19 || h < 5) return 'tsukimi';
  if (isFoggyMorning(date)) return 'milk';
  return 'yukashi';
}

export function orderLine(guest, drink) {
  if (drink === 'tsukimi') return '夜ですから、月見ブレンドにしましょうか。';
  if (drink === 'milk') return '霧の朝ですから、ミルクコーヒーにしましょう。';
  if (guest.visits >= 3) return 'いつもので、よろしいですね。';
  if (guest.visits <= 1) return 'はじめてでしたら、ゆかしブレンドを。……実はもう、淹れてあるんです。';
  return '今日も、ゆかしブレンドにしましょう。';
}

export const SERVED = 'どうぞ、ごゆっくり。';
export const WELCOME_BACK = 'おかえりなさい。';
export const PURR = '（ゴロゴロ……）';
