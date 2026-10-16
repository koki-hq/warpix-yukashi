// 店の 住人と 小物。色の キーは palette.js を 見てね。
// 店は 引きの 絵なので、住人は 小さい。
import { sprite, mirrorX, mirrorY } from './pixel.js';

// 手前の 自分の テーブルに ある「いつもの 一杯」。
export const cup = sprite('コーヒーカップ', [
  '................',
  '..0000000000....',
  '.09cccccccc90...',
  '.09c112233c90...',
  '.099c2233c990...',
  '.09999999cbb000.',
  '.09999999cbb0.90',
  '.09999999cbb0.90',
  '.0c999999cbb000.',
  '..0cc9999cb0....',
  '...00000000.....',
  '.00000000000000.',
  '0cccccccccccccc0',
  '.0bbbbbbbbbbbb0.',
  '..000000000000..',
]);

// おくのさん。カウンターの 向こうに 立っている。胸から 下は カウンターに 隠れる。
export const okuno = sprite('おくのさん', mirrorX([
  '..0000',
  '.0cccc',
  '0ccccc',
  '0cqqqq',
  '0cq1qq',
  '0cqqqr',
  '.0qbbb',
  '..0qqq',
  '...0qq',
  '..099g',
  '00c339',
  '0c9339',
  '0c9335',
  '0c9333',
  '0c9333',
  '0c9333',
  '0c9333',
]));

// ゆかし。窓辺に 座って 外を 見ている 後ろ姿。しっぽは 動くので コードで 描く。
const yukashiRows = [
  '.0......0...',
  '0i0....010..',
  '0ii0000110..',
  '0iii99c110..',
  '0ii9999c10..',
  '.0999999c0..',
  '.0i99999c0..',
  '0ii99991c0..',
  '0i999911c0..',
  '0c99991110..',
  '0cc9999cc00.',
  '.000000000..',
];
export const yukashi = sprite('ゆかし', yukashiRows);
// 左耳を ぴくっと 倒した ところ
export const yukashiEar = sprite('ゆかし（耳ぴく）', [
  '........0...',
  '00i....010..',
  ...yukashiRows.slice(2),
]);

// 丸くなって 眠る ゆかし（横向き、頭は 右）。椅子の 上、日だまり、本棚で。
export const yukashiLoaf = sprite('ゆかし（丸くなる）', [
  '.........0.0..',
  '....00000i0i0.',
  '...0999ii99990',
  '..09991ii91990',
  '.0c99911999q90',
  '.0c99999999990',
  '0ciii999999cc0',
  '.000000000000.',
]);

// 自分の テーブルに 上がって きた ゆかし（正面）。近いので 大きい。
const yukashiFrontRows = [
  '.010........0i0.....',
  '.0110......0ii0.....',
  '.0111000000iii0.....',
  '.0111999999iii0.....',
  '.011f099990fii0.....',
  '.011999qq999ii0.....',
  '.0c9999009999c0.....',
  '..0c99999999c0......',
  '...0c999999c0.......',
  '..0c9999999i90......',
  '.0c99999999ii90.....',
  '.0c9999999iiii0.....',
  '0c99999999iii110....',
  '0c9999999911110.....',
  '0c99999999111i0.000.',
  '0c99c99c99c1ii00ii0.',
  '0cc9cc9cc9ccbbiiii0.',
  '.000000000000000000.',
];
export const yukashiFront = sprite('ゆかし（正面）', yukashiFrontRows);
// 目を 細める（ゆっくりの まばたきは、猫の「好き」の 合図）
export const yukashiFrontBlink = sprite('ゆかし（まばたき）', yukashiFrontRows.map((r, y) => (y === 4 ? '.01100999900ii0.....' : r)));

// 壁の 時計（針は 時刻に あわせて コードで 描く）。
export const clock = sprite('壁の時計', mirrorY(mirrorX([
  '.....000',
  '...00555',
  '..055444',
  '.0544881',
  '.0548888',
  '05488888',
  '05488888',
  '05418888',
])));

// モンステラの 葉。切れこみは 森の 風の 通り道。
export const monsteraLeaf = sprite('モンステラの葉', mirrorX([
  '.......eee',
  '.....eefff',
  '...eefffff',
  '..effffffe',
  '.effe..ffe',
  'efe....ffe',
  'effe...ffe',
  '.effe..ffe',
  'e.ffffeffe',
  'ef...efffe',
  'eff...fffe',
  '.efff.fffe',
  '..eeffffee',
  '....eeeeee',
  '.........4',
]));

// おくのさんの ちがう 姿勢。
// 窓の ほうを 見る（目が 左に 寄る）
export const okunoLook = sprite('おくのさん（窓を見る）', okuno.rows.map((r, y) => (y === 4 ? '0c1qqqq1qqc0' : r)));
// うつむく（頭が 1ドット 下がる）。本を 読む、地図を 描く、うたた寝
export const okunoDown = sprite('おくのさん（うつむく）', ['............', ...okuno.rows.slice(0, 8), ...okuno.rows.slice(9)]);
