// 喫茶ゆかしの パレット。店の 絵は すべて この 色だけで 描く。
// 1文字の キーで ドット絵の 文字列から 呼びだす。'.' は 透明。

export const PALETTE = [
  { key: '0', hex: '#1a1214', name: '墨' },
  { key: '1', hex: '#2b1d1c', name: '焙煎' },
  { key: '2', hex: '#3e2a24', name: '深煎り' },
  { key: '3', hex: '#57392c', name: '胡桃' },
  { key: '4', hex: '#74503a', name: '樫' },
  { key: '5', hex: '#946a48', name: '飴色' },
  { key: '6', hex: '#b88b5e', name: '木肌' },
  { key: '7', hex: '#d9b382', name: '麦' },
  { key: '8', hex: '#efe0bf', name: '生成り' },
  { key: '9', hex: '#faf4e4', name: '白シャツ' },
  { key: 'a', hex: '#8a8580', name: '鼠' },
  { key: 'b', hex: '#b9b4ac', name: '銀鼠' },
  { key: 'c', hex: '#dcd7cd', name: '白髪' },
  { key: 'd', hex: '#2f3b2c', name: '苔' },
  { key: 'e', hex: '#4c5e3a', name: '松葉' },
  { key: 'f', hex: '#7a8a4e', name: '若草' },
  { key: 'g', hex: '#5a2320', name: '葡萄酒' },
  { key: 'h', hex: '#8e3b2a', name: '煉瓦' },
  { key: 'i', hex: '#c2622f', name: '柿' },
  { key: 'j', hex: '#e89a4a', name: '灯' },
  { key: 'k', hex: '#f6cf72', name: '蜜' },
  { key: 'l', hex: '#1d2236', name: '夜' },
  { key: 'm', hex: '#2e3a5c', name: '藍' },
  { key: 'n', hex: '#4e6a8c', name: '縹' },
  { key: 'o', hex: '#8eabc0', name: '空' },
  { key: 'p', hex: '#c9dbe0', name: '薄曇' },
  { key: 'q', hex: '#e8b796', name: '肌' },
  { key: 'r', hex: '#c98c6e', name: '頬' },
  { key: 's', hex: '#9b6450', name: '影肌' },
];

export const COLOR = Object.fromEntries(PALETTE.map(c => [c.key, c.hex]));
