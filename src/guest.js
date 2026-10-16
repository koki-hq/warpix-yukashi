// 店が おぼえている、お客さんの こと。このブラウザの 中だけに しまう（どこにも 送らない）。
// 使えない ときは（プライベートブラウズなど）、はじめての お客さんとして もてなす。

const KEY = 'kissa-yukashi.guest';

export function loadGuest() {
  try {
    return { visits: 0, lastVisit: 0, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { visits: 0, lastVisit: 0 };
  }
}

export function saveGuest(guest) {
  try {
    localStorage.setItem(KEY, JSON.stringify(guest));
  } catch {
    // おぼえられなくても、店は 開いている
  }
}

// 好み：ジュークボックスの 選曲の しかた、音量、鳴らすか どうか。座る 席（kado：角の 席、counter：カウンター席）
const PREFS_KEY = 'kissa-yukashi.prefs';
export function loadPrefs() {
  const base = { mode: 'omakase', volume: 0.6, playing: true, seat: 'kado' };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') };
  } catch {
    return base;
  }
}
export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // おぼえられなくても、曲は 鳴る
  }
}

// いた 時間と 杯数を、これまでの 合計に 足す（同じ 滞在を 二度 足さないように、最後の 記録を 覚えておく）
let recorded = { stay: 0, cups: 0 };
export function recordStay(stay, cups) {
  const guest = loadGuest();
  guest.totalStay = (guest.totalStay ?? 0) + Math.max(0, stay - recorded.stay);
  guest.totalCups = (guest.totalCups ?? 0) + Math.max(0, cups - recorded.cups);
  saveGuest(guest);
  recorded = { stay, cups };
}

// 入店した ことを 記録して、前回の 来店日を 返す
export function checkIn(now = Date.now()) {
  const guest = loadGuest();
  const previous = guest.lastVisit;
  guest.visits += 1;
  guest.lastVisit = now;
  saveGuest(guest);
  recorded = { stay: 0, cups: 0 };
  return { ...guest, previous };
}
