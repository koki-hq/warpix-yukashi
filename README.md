# 喫茶ゆかし

ピクセルアートの喫茶店に「入店」して、そこで過ごすサイトです。
開きっぱなしにしておいて、別の作業のあいだ、ふと目をやると何かが起きている。そんな居場所をつくっています。

[WARPIX製作所](https://koki-hq.github.io/warpix/) の作品です。いまはプレオープン中。

- 店: https://koki-hq.github.io/warpix-yukashi/ （ドアをクリックして入店）
- スケッチ帳（店づくりの作業台。店の中の本棚にも一冊まぎれている）: https://koki-hq.github.io/warpix-yukashi/sketchbook.html

## つくり

ビルド不要の素の HTML / CSS / JavaScript だけで動きます。ライブラリは使っていません。

| 場所 | 中身 |
|---|---|
| `src/palette.js` | 店の色（29色）。絵はこの色だけで描く |
| `src/sprites.js` | ドット絵。1文字＝1ドットの文字列で描く |
| `src/pixel.js` | ドット絵を canvas に描く道具と、光の計算 |
| `src/main.js` | 店（index.html）：入店から、過ごすあいだのこと |
| `src/scene.js` | 店の中の景色、住人、時間帯ごとの光 |
| `src/facade.js` | 店の表 |
| `src/music.js` | ジュークボックス（チップチューン）と効果音 |
| `src/lines.js` | おくのさんのもてなしのことば、注文の決め方 |
| `src/guest.js` | 店が覚えているお客さんのこと（ブラウザの中だけ） |
| `src/favicon.js` | タブのアイコン（減っていくコーヒー） |
| `src/version.js` | 店の版 |
| `data/hitorigoto.txt` | おくのさんのひとりごと |
| `docs/` | 設定資料。世界観、住人、店の中、店づくりの決まり、バージョンの決まり |
| `CHANGELOG.md` | 店の歩み |

## バージョン

区切りごとに番号をつけて、git のタグと GitHub のリリースに残しています。設定資料もソースと同じ場所にあるので、どの版でも「そのときの店」と「そのときの設定」がそろって見られます。戻り方は [docs/versions.md](docs/versions.md)。

## 手元で見る

```
npm install          # はじめの一回（確認用の Playwright が入る）
npm run serve        # http://127.0.0.1:8080/
npm run shot -- "sketchbook.html?time=18:30" shots/yu.png
npm run perf         # 1コマを描く重さ
npm run listen -- yoru 30   # 曲を wav に書き出して音量を確かめる
```

スケッチ帳の URL に `?time=18:30` をつけるとその時刻の店を、`?speed=60` で早送り、`?stay=900` で「もう15分いる」ところを見られます。
