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

// 入店した ことを 記録して、前回の 来店日を 返す
export function checkIn(now = Date.now()) {
  const guest = loadGuest();
  const previous = guest.lastVisit;
  guest.visits += 1;
  guest.lastVisit = now;
  saveGuest(guest);
  return { ...guest, previous };
}
