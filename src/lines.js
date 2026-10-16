// おくのさんの、もてなしの ことば。ひとりごとは data/hitorigoto.txt。

import { weatherOf } from './weather.js';

const DAY = 24 * 60 * 60 * 1000;

export function greeting(guest, date, weather = 'hare') {
  if (guest.visits <= 1) return weather === 'ame' ? 'いらっしゃいませ。雨の中、ようこそ。' : weather === 'yuki' ? 'いらっしゃいませ。雪の中、ようこそ。' : 'いらっしゃいませ。';
  if (guest.previous && date - guest.previous > 30 * DAY) return 'いらっしゃいませ。……おや、おひさしぶりですね。';
  if (weather === 'ame') return 'いらっしゃいませ。降られませんでしたか。';
  if (weather === 'yuki') return 'いらっしゃいませ。冷えましたでしょう。';
  if (guest.visits >= 5) return 'いらっしゃいませ。いつもの席、空いていますよ。';
  return 'いらっしゃいませ。また来てくださったんですね。';
}

// 注文は お客さんが 選ばない。おくのさんが 顔を 見て 決める
export function chooseDrink(date, weather = weatherOf(date)) {
  const h = date.getHours();
  if (h >= 19 || h < 5) return 'tsukimi';
  if (weather === 'kiri') return 'milk';
  return 'yukashi';
}

export function orderLine(guest, drink, weather = 'hare') {
  if (drink === 'tsukimi') return '夜ですから、月見ブレンドにしましょうか。';
  if (drink === 'milk') return '霧の朝ですから、ミルクコーヒーにしましょう。';
  if (weather === 'ame') return '雨の日は、少し濃いめに淹れておきました。';
  if (weather === 'yuki') return '雪の日は、少し熱めにしておきました。';
  if (guest.visits >= 3) return 'いつもので、よろしいですね。';
  if (guest.visits <= 1) return 'はじめてでしたら、ゆかしブレンドを。……実はもう、淹れてあるんです。';
  return '今日も、ゆかしブレンドにしましょう。';
}

// 甘いもの：朝は シナモントースト、昼すぎは プリン、夕方は レモンケーキ。夜と 深夜は なし
export function chooseSweet(date) {
  const h = date.getHours();
  if (h >= 5 && h < 10) return 'toast';
  if (h >= 13 && h < 16) return 'pudding';
  if (h >= 16 && h < 19) return 'lemon';
  return null;
}

export const SWEET_LINES = {
  toast: 'それと、トーストを。シナモンは、おまけです。',
  pudding: 'プリンがちょうど固まったので、よかったら。',
  lemon: 'レモンケーキもどうぞ。夏の味がする、冬のお菓子です。',
};

export const SERVED = 'どうぞ、ごゆっくり。';
export const CHECKOUT = 'ありがとうございました。';
export const STAY_MORE = 'ええ、どうぞ。いくらでも。';

export function farewell(cups) {
  if (cups >= 3) return 'ゆっくりしていただけて、よかったです。またどうぞ。';
  return 'またどうぞ。';
}
export const WELCOME_BACK = 'おかえりなさい。';
export const PURR = '（ゴロゴロ……）';
