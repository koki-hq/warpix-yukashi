// 暦：二十四節気と、月の 満ち欠け。月見坂は 本当の 暦と 本当の 月で めぐる。

// 二十四節気（だいたいの 日付。年に よって 一日 ずれる ことが ある）
const SEKKI = [
  [1, 5, '小寒'], [1, 20, '大寒'], [2, 4, '立春'], [2, 19, '雨水'], [3, 5, '啓蟄'], [3, 20, '春分'],
  [4, 4, '清明'], [4, 20, '穀雨'], [5, 5, '立夏'], [5, 21, '小満'], [6, 5, '芒種'], [6, 21, '夏至'],
  [7, 7, '小暑'], [7, 22, '大暑'], [8, 7, '立秋'], [8, 23, '処暑'], [9, 7, '白露'], [9, 23, '秋分'],
  [10, 8, '寒露'], [10, 23, '霜降'], [11, 7, '立冬'], [11, 22, '小雪'], [12, 7, '大雪'], [12, 21, '冬至'],
];

export const SEASONS = { haru: '春', natsu: '夏', aki: '秋', fuyu: '冬' };

export function sekkiOf(date) {
  const m = date.getMonth() + 1, d = date.getDate();
  let name = '冬至';
  for (const [sm, sd, n] of SEKKI) if (m > sm || (m === sm && d >= sd)) name = n;
  return name;
}

// 季節は 節気で 区切る：立春から 春、立夏から 夏、立秋から 秋、立冬から 冬
export function seasonOf(date) {
  const order = SEKKI.map(s => s[2]);
  const i = order.indexOf(sekkiOf(date));
  if (i >= order.indexOf('立冬') || i < order.indexOf('立春')) return 'fuyu';
  if (i >= order.indexOf('立秋')) return 'aki';
  if (i >= order.indexOf('立夏')) return 'natsu';
  return 'haru';
}

// 月の 満ち欠け：0 = 新月、0.5 = 満月
const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export function moonPhase(date) {
  const days = (date.getTime() - NEW_MOON) / 86400000;
  return ((days / SYNODIC) % 1 + 1) % 1;
}

export function moonName(phase) {
  const age = phase * SYNODIC;
  if (age < 1.5) return '新月';
  if (age < 4.5) return '三日月';
  if (age < 9) return '上弦の月';
  if (age < 13.5) return '十三夜';
  if (age < 15.5) return '満月';
  if (age < 17) return '十六夜';
  if (age < 24) return '下弦の月';
  if (age < 28) return '有明の月';
  return '新月';
}
