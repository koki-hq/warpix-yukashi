// おくのさんの ひとりごと。data/hitorigoto.txt の 1行が ひとつの ひとりごと。
// 空の 行と「#」で はじまる 行は 読みとばす。
// 行の 頭に [雨] [霧] [雪] [朝] [昼] [夕] [夜] [春] [夏] [秋] [冬] と 書くと、その 天気・時間帯・季節の ときだけ 言う。

const TAGS = { 雨: 'ame', 霧: 'kiri', 雪: 'yuki', 朝: 'asa', 昼: 'hiru', 夕: 'yu', 夜: 'yoru', 春: 'haru', 夏: 'natsu', 秋: 'aki', 冬: 'fuyu' };

let lines = null;
let last = '';

export async function loadHitorigoto() {
  if (lines) return lines;
  const res = await fetch(new URL('../data/hitorigoto.txt', import.meta.url));
  const text = await res.text();
  lines = text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(s => {
    const m = s.match(/^\[(.)\]\s*(.*)$/);
    return m && TAGS[m[1]] ? { when: TAGS[m[1]], text: m[2] } : { when: null, text: s };
  });
  return lines;
}

// いまの 天気と 時間帯に 合う ものから 選ぶ。合う 札つきの 行が あれば、少し 多めに 選ぶ。
// さっきと 同じ ものは 続けて 出さない。
export async function nextHitorigoto({ weather = 'hare', timeKey = '', season = '' } = {}) {
  const all = await loadHitorigoto();
  const fits = l => l.when === null || l.when === weather || l.when === timeKey || l.when === season;
  const tagged = all.filter(l => l.when && fits(l) && l.text !== last);
  const pool = tagged.length && Math.random() < 0.4 ? tagged : all.filter(l => fits(l) && l.text !== last);
  if (pool.length === 0) return '……';
  last = pool[Math.floor(Math.random() * pool.length)].text;
  return last;
}
