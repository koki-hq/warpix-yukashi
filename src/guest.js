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

// ジュークボックスの 好み：選曲の しかた、音量、鳴らすか どうか
const PREFS_KEY = 'kissa-yukashi.prefs';
export function loadPrefs() {
  const base = { mode: 'omakase', volume: 0.6, playing: true };
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

// 入店した ことを 記録して、前回の 来店日を 返す
export function checkIn(now = Date.now()) {
  const guest = loadGuest();
  const previous = guest.lastVisit;
  guest.visits += 1;
  guest.lastVisit = now;
  saveGuest(guest);
  return { ...guest, previous };
}
