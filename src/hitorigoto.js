// おくのさんの ひとりごと。data/hitorigoto.txt の 1行が ひとつの ひとりごと。
// 空の 行と「#」で はじまる 行は 読みとばす。

let lines = null;
let last = -1;

export async function loadHitorigoto() {
  if (lines) return lines;
  const res = await fetch(new URL('../data/hitorigoto.txt', import.meta.url));
  const text = await res.text();
  lines = text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  return lines;
}

// さっきと 同じ ものは 続けて 出さない。
export async function nextHitorigoto() {
  const all = await loadHitorigoto();
  if (all.length === 0) return '……';
  let i = Math.floor(Math.random() * all.length);
  if (all.length > 1 && i === last) i = (i + 1) % all.length;
  last = i;
  return all[i];
}
