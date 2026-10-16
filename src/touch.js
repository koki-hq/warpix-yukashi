// 触ると 何かが 起きる もの。おくのさんの ことばでは なく、地の 文（かっこ書き）で 返す。
// 地名は data/chimei.txt、本の 書き出しは data/kakidashi.txt。
import { sekkiOf, moonPhase, moonName, seasonOf } from './koyomi.js';
import { DRINKS, SWEETS } from './scene.js';

const cache = {};
const last = {};

async function loadPairs(name) {
  if (cache[name]) return cache[name];
  const res = await fetch(new URL(`../data/${name}.txt`, import.meta.url));
  const text = await res.text();
  cache[name] = text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(s => s.split('｜'));
  return cache[name];
}

// さっきと 同じ ものは 続けて 出さない
function pick(name, list) {
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === last[name]) i = (i + 1) % list.length;
  last[name] = i;
  return list[i];
}

export async function mapPlace() {
  const [place, note] = pick('chimei', await loadPairs('chimei'));
  return `（地図の町：${place}。${note}）`;
}

export async function bookOpening() {
  const [title, first] = pick('kakidashi', await loadPairs('kakidashi'));
  return `（一冊抜いてみた。『${title}』――${first}）`;
}

export function clockWords(date) {
  return `（${sekkiOf(date)}のころ。月は、${moonName(moonPhase(date))}）`;
}

export function cupWords(served, warmth) {
  if (!served) return null;
  if (warmth >= 3) return '（まだ湯気が立っている）';
  if (warmth >= 1) return '（ちょうどいい温かさ）';
  return '（すっかり冷めている。それもまた、いい）';
}

const SUGAR = [
  '（角砂糖がひとつ、考えごとをしているように見えた）',
  '（ふたを開けると、角砂糖が七つ。昨日は八つだった気がする）',
  '（砂糖つぼの白が、ランプの色に染まっている）',
];
export const sugarWords = () => pick('sugar', SUGAR);

export function boardWords() {
  return `（黒板の字：本日 ${DRINKS.yukashi.name}／${DRINKS.tsukimi.name}（夜）／${SWEETS.toast.name}（朝）／${SWEETS.pudding.name}（昼すぎ）／${SWEETS.lemon.name}（夕方）。字が少しだけ右に傾いている）`;
}

export function catWords(place) {
  return place === 'mado' ? '（しっぽが、ぱたんと一回）' : '（すやすや……）';
}

// 窓：時間帯と 季節と 天気で、外から 聞こえる ものが 変わる。[ことば, 音]
export function windowSound(date, timeKey, weather) {
  if (weather === 'yuki') return ['（雪が、音を吸いこんでいる）', null];
  if (weather === 'ame') return ['（雨の音が、少しだけ近くなった）', null];
  if (weather === 'kiri') return ['（霧の向こうで、路面電車の鐘がくぐもって鳴った）', 'tram'];
  if (timeKey === 'asa' || timeKey === 'hiru') return ['（窓の外で、雀が二回鳴いた）', 'bird'];
  if (timeKey === 'yu') return ['（坂の下で、路面電車の鐘が鳴った）', 'tram'];
  const season = seasonOf(date);
  if (season === 'aki') return ['（どこかで、秋の虫が鳴いている）', 'insect'];
  if (season === 'natsu') return ['（夏の虫の声が、少しだけ）', 'insect'];
  return ['（終電の、路面電車の鐘が遠くで鳴った）', 'tram'];
}
