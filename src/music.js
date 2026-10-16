// ジュークボックス。おくのさんが 直した 古い 機械で、どんな 曲も どこか 8bit の 音に なる。
//
// いちばん 大事な こと：作業の じゃまを しない。
//   - 和音は やわらかい 長調系（maj7、m7、6、sus）。メロディは 和音の 音か、調の 音だけ
//   - メロディは 手で 作曲した もの。4周に 1周は 休んで、和音と ベースだけに なる
//   - 音色は 丸く。高い 音を 削り、こだまは 薄く
//
// 曲の 種類：チップチューン、ジャズ、ローファイ、環境音楽。
import { seeded } from './pixel.js';

export const MASTER = 0.5; // 作業の じゃまに ならない 大きさ（tools/listen.mjs で 測って 決める）

const midiHz = m => 440 * 2 ** ((m - 69) / 12);
const PC = { c: 0, 'c#': 1, db: 1, d: 2, 'd#': 3, eb: 3, e: 4, f: 5, 'f#': 6, gb: 6, g: 7, 'g#': 8, ab: 8, a: 9, 'a#': 10, bb: 10, b: 11 };
const CHORD_TYPES = {
  maj7: [0, 4, 7, 11], maj9: [0, 4, 7, 11, 14], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14],
  6: [0, 4, 7, 9], 9: [0, 4, 7, 10, 14], sus: [0, 5, 7, 10],
};

// 'Bbmaj7' → { root: 58（2オクターブ目の シ♭）, tones }
function parseChord(sym) {
  const m = sym.match(/^([A-G](?:#|b)?)(.*)$/);
  const tones = CHORD_TYPES[m[2]];
  if (!tones) throw new Error(`知らない 和音：${sym}`);
  return { name: sym, root: 48 + PC[m[1].toLowerCase()], tones };
}

// 'eb5' → MIDI の 番号（c4 = 60）
function parseNote(tok) {
  const m = tok.match(/^([a-g](?:#|b)?)(\d)$/);
  if (!m) throw new Error(`知らない 音：${tok}`);
  return 12 * (Number(m[2]) + 1) + PC[m[1]];
}

// メロディの 楽譜：小節は「|」で 区切り、1小節に 8つ（8分音符）。音名で 鳴らし、「-」で のばし、「.」で 休む
function parseMelody(text) {
  return text.split('|').map((bar, b) => {
    const toks = bar.trim().split(/\s+/);
    if (toks.length !== 8) throw new Error(`メロディの ${b + 1}小節目が ${toks.length}個（8個の はず）`);
    const notes = [];
    let cur = null;
    toks.forEach((tok, i) => {
      if (tok === '-') { if (cur) cur[2]++; return; }
      cur = null;
      if (tok === '.') return;
      cur = [i, parseNote(tok), 1];
      notes.push(cur);
    });
    return notes;
  });
}

export const GENRES = {
  // gain は tools/listen.mjs で 曲ごとの 音量を そろえて 決めた
  chip: { label: 'チップチューン', note: '宿屋や、静かな町の曲のような', tone: 2600, echo: 0.12, gain: 1 },
  jazz: { label: 'ジャズ', note: 'カフェで流れる、ゆるいジャズ', tone: 3200, echo: 0.1, gain: 0.92 },
  lofi: { label: 'ローファイ', note: '低くくり返す、やわらかいビート', tone: 1500, echo: 0.12, gain: 1.05 },
  ambient: { label: '環境音楽', note: 'メロディのない、空気のような', tone: 2200, echo: 0.25, gain: 1.15 },
};

const SONG_LIST = [
  {
    id: 'kiri', code: 'A1', title: '霧の停留所', genre: 'chip', note: '朝の、ゆったりした町の曲',
    bpm: 84, swing: 0.5, lead: 'pulse50', leadVol: 0.1,
    chords: 'Cmaj7 Am7 Fmaj7 G6 Cmaj7 Am7 Dm7 G6',
    melody: 'e5 - - - g5 - e5 - | c5 - - - - - . . | a4 - c5 - f5 - e5 - | d5 - - - - - . . | e5 - g5 - c6 - b5 - | a5 - - - g5 - e5 - | f5 - e5 - d5 - c5 - | d5 - - - - - - -',
  },
  {
    id: 'chizucho', code: 'A2', title: '午後の地図帳', genre: 'chip', note: '昼の、少しだけ弾む曲',
    bpm: 92, swing: 0.56, lead: 'pulse50', leadVol: 0.1,
    chords: 'Fmaj7 Am7 Bbmaj7 C6 Fmaj7 Dm7 Gm7 C6',
    melody: 'a4 - c5 - f5 - e5 - | e5 - - - c5 - . . | d5 - f5 - a5 - g5 - | g5 - - - e5 - . . | f5 - e5 - c5 - a4 - | d5 - - - f5 - a5 - | g5 - f5 - d5 - bb4 - | c5 - - - - - . .',
  },
  {
    id: 'shippo', code: 'A3', title: 'ゆかしのしっぽ', genre: 'chip', note: '気ままに、ゆらゆら',
    bpm: 96, swing: 0.54, lead: 'pulse50', leadVol: 0.1,
    chords: 'Gmaj7 Em7 Cmaj7 D6 Gmaj7 Bm7 Cmaj7 D6',
    melody: 'd5 - b4 - d5 - g5 - | e5 - - - d5 - b4 - | c5 - e5 - g5 - e5 - | f#5 - - - - - . . | g5 - f#5 - d5 - b4 - | d5 - - - f#5 - a5 - | g5 - e5 - c5 - b4 - | a4 - - - - - . .',
  },
  {
    id: 'lamp', code: 'A4', title: 'ランプの下で', genre: 'chip', note: '夜ふけの、静かな町の曲',
    bpm: 68, swing: 0.58, lead: 'pulse50', leadVol: 0.09,
    chords: 'Bbmaj7 Gm7 Ebmaj7 F6 Bbmaj7 Dm7 Ebmaj7 F6',
    melody: 'd5 - - - f5 - - - | d5 - - - bb4 - - - | g5 - - - f5 - d5 - | c5 - - - - - . . | d5 - f5 - bb5 - a5 - | f5 - - - d5 - - - | eb5 - d5 - c5 - bb4 - | c5 - - - - - - -',
  },
  {
    id: 'toudai', code: 'B1', title: '坂の上の灯台', genre: 'jazz', note: '夕方の、ゆるいスウィング',
    bpm: 100, swing: 0.62, lead: 'pulse50', leadVol: 0.085,
    chords: 'Gm7 C9 Fmaj7 Dm7 Gm7 C9 Fmaj7 Fmaj7',
    melody: '. . d5 - f5 - a5 - | g5 - - - e5 - c5 - | a4 - - - - - . . | . . a4 - c5 - d5 - | f5 - - - d5 - bb4 - | e5 - g5 - bb5 - a5 - | f5 - - - - - . . | . . . . . . . .',
  },
  {
    id: 'nocturne', code: 'B2', title: '月見坂ノクターン', genre: 'jazz', note: '夜の、ブラシのバラード',
    bpm: 66, swing: 0.6, lead: 'flute', leadVol: 0.08,
    chords: 'Ebmaj7 Cm7 Fm7 Bbsus Ebmaj7 Abmaj7 Fm7 Bbsus',
    melody: 'g5 - - - bb5 - - - | g5 - - - eb5 - - - | ab5 - - - g5 - f5 - | eb5 - - - - - . . | d5 - eb5 - g5 - bb5 - | c6 - - - bb5 - g5 - | ab5 - g5 - f5 - eb5 - | f5 - - - - - - -',
  },
  {
    id: 'amayadori', code: 'C1', title: '雨やどりのビート', genre: 'lofi', note: '雨の日に、低くくり返す',
    bpm: 78, swing: 0.6, lead: 'pulse25', leadVol: 0.06,
    chords: 'Bbmaj7 Am7 Gm7 Fmaj7',
    melody: '. . d5 - c5 - a4 - | c5 - - - - - . . | . . d5 - c5 - bb4 - | a4 - - - - - . .',
  },
  {
    id: 'yohaku', code: 'C2', title: '地図の余白', genre: 'lofi', note: '何も描いていない、白いところ',
    bpm: 72, swing: 0.6, lead: 'epiano', leadVol: 0.07,
    chords: 'Ebmaj7 Dm7 Cm7 Bbmaj7',
    melody: '. . g4 - bb4 - d5 - | c5 - - - a4 - . . | . . eb5 - d5 - c5 - | d5 - - - - - . .',
  },
  {
    id: 'hidamari', code: 'D1', title: '窓辺の日だまり', genre: 'ambient', note: 'ゆかしが眠っているあいだ',
    bpm: 56, swing: 0.5, bells: 'd e f# a b',
    chords: 'Dmaj7 Dmaj7 Gmaj7 Gmaj7 Bm7 Bm7 A6 A6',
  },
  {
    id: 'sakashita', code: 'D2', title: '坂の下の霧', genre: 'ambient', note: '霧の朝の、ぼんやりした空気',
    bpm: 50, swing: 0.5, bells: 'eb f g bb c',
    chords: 'Ebmaj7 Ebmaj7 Abmaj7 Abmaj7 Cm7 Cm7 Abmaj7 Abmaj7',
  },
];

export const SONGS = Object.fromEntries(SONG_LIST.map(s => [s.id, {
  ...s,
  chordList: s.chords.split(/\s+/).map(parseChord),
  melodyBars: s.melody ? parseMelody(s.melody) : null,
  bellNotes: s.bells ? s.bells.split(/\s+/).flatMap(n => [72, 84].map(o => o + PC[n])).filter(m => m <= 88) : null,
}]));
export const SONG_ORDER = SONG_LIST.map(s => s.id);

// 「おまかせ」で 流れる 曲
export const OMAKASE = { asa: 'kiri', hiru: 'chizucho', yu: 'toudai', yoru: 'nocturne', ame: 'amayadori', kiri: 'sakashita' };
export const omakaseSong = (timeKey, weather) => OMAKASE[weather === 'ame' || weather === 'kiri' ? weather : timeKey];

// 和音を、前の 和音と 近い 高さに 並べる
function voicing(chord, low, high, { withRoot = true } = {}) {
  const out = new Set();
  for (const t of chord.tones) {
    if (!withRoot && t === 0) continue;
    let m = chord.root + t;
    while (m < low) m += 12;
    while (m > high) m -= 12;
    out.add(m);
  }
  return [...out].sort((a, b) => a - b);
}

// ---- 曲の 種類ごとの 演奏 ----

const ARRANGE = {
  chip(p) {
    const { chord, e8, beat, rnd } = p;
    this.note('tri', chord.root - 12, e8(0), beat * 1.6, 0.42);
    this.note('tri', chord.root - 5, e8(4), beat * 1.6, 0.34);
    const v = voicing(chord, 60, 76);
    const arp = [0, 1, 2, 3, 2, 1, 2, 1].map(i => v[i % v.length]);
    arp.forEach((m, i) => { if (rnd() > 0.25) this.note('pulse12', m, e8(i), beat * 0.42, 0.04); });
    for (const i of [2, 6]) this.note('hat', 0, e8(i), 0.04, 0.02);
  },

  jazz(p) {
    const { chord, next, e8, beat, rnd, song } = p;
    // 歩く ベース：根音 → 3度か 5度 → 5度か 6度 → 次の 根音の 一歩 手前
    const fold = m => { while (m < 36) m += 12; while (m > 50) m -= 12; return m; };
    const walk = [
      chord.root,
      chord.root + (rnd() < 0.5 ? chord.tones[1] : 7),
      chord.root + (rnd() < 0.5 ? 7 : 9),
      next.root + (rnd() < 0.5 ? -1 : 2),
    ].map(fold);
    walk.forEach((m, i) => this.note('tri', m, e8(i * 2), beat * 0.85, 0.4));
    // 和音（根音ぬき）を、チャールストンの リズムで そっと
    const v = voicing(chord, 55, 69, { withRoot: false });
    const hits = rnd() < 0.5 ? [[0, 1.2], [3, 0.6]] : [[2, 0.8], [5, 1.2]];
    for (const [pos, len] of hits) for (const m of v) this.note('epiano', m, e8(pos), beat * len, 0.045);
    // ドラム：ゆっくりの 曲は ブラシだけ
    if (song.bpm < 80) {
      for (const i of [2, 6]) this.note('brush', 0, e8(i), 0.2, 0.05);
      for (const i of [0, 4]) this.note('brush', 0, e8(i), 0.2, 0.025);
    } else {
      for (const i of [0, 2, 3, 4, 6, 7]) this.note('ride', 0, e8(i), 0.25, i % 2 ? 0.012 : 0.02);
      for (const i of [2, 6]) this.note('brush', 0, e8(i), 0.15, 0.03);
    }
  },

  lofi(p) {
    const { chord, e8, beat, rnd } = p;
    this.note('kick', 0, e8(0), 0.3, 0.5);
    this.note('kick', 0, e8(5), 0.3, 0.35);
    for (const i of [2, 6]) this.note('snare', 0, e8(i), 0.18, 0.16);
    for (let i = 0; i < 8; i++) this.note('hat', 0, e8(i), 0.03, i % 2 ? 0.012 : 0.022);
    const v = voicing(chord, 55, 70);
    for (const m of v) this.note('epiano', m, e8(0), beat * 2.5, 0.05);
    if (rnd() < 0.6) for (const m of v) this.note('epiano', m, e8(5), beat * 0.8, 0.032);
    this.note('tri', chord.root - 12, e8(0), beat * 1.5, 0.42);
    this.note('tri', chord.root - 12, e8(5), beat, 0.32);
    // レコードの ぷちぷち
    for (let k = 0; k < 4; k++) this.note('crackle', 0, e8(0) + rnd() * beat * 4, 0.01, 0.02 + rnd() * 0.03);
  },

  ambient(p) {
    const { chord, prev, bar, e8, beat, rnd, song } = p;
    const n = song.chordList.length;
    if (bar === 0 || chord.name !== prev.name) {
      // 同じ 和音が 続く あいだ、ずっと のばす
      let span = 1;
      while (span < n && song.chordList[(bar + span) % n].name === chord.name) span++;
      for (const m of voicing(chord, 52, 72)) this.note('pad', m, e8(0), beat * 4 * span, 0.045);
      this.note('tri', chord.root - 12, e8(0), beat * 4 * span, 0.22);
    }
    // ときどき、鈴のような 音が ひとつ
    for (let i = 0; i < 8; i++) {
      if (rnd() < 0.09) this.note('bell', song.bellNotes[Math.floor(rnd() * song.bellNotes.length)], e8(i), 2.5, 0.05);
    }
  },
};

export class Jukebox {
  constructor(ctx = new AudioContext()) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 2600;
    this.echo = ctx.createDelay(2);
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.12;
    this.input = ctx.createGain();
    this.input.connect(this.tone);
    this.tone.connect(this.master);
    this.tone.connect(this.echo);
    this.echo.connect(feedback);
    feedback.connect(this.echo);
    this.echo.connect(this.wet);
    this.wet.connect(this.master);
    this.master.connect(ctx.destination);

    this.waves = { pulse12: this.pulseWave(0.125), pulse25: this.pulseWave(0.25), pulse50: this.pulseWave(0.5) };
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    const rnd = seeded(1);
    for (let i = 0; i < len; i++) data[i] = rnd() * 2 - 1;

    this.song = null;
    this.bus = null;
    this.playing = false;
    this.volume = 0.6;
    this.seedBase = 0;
  }

  pulseWave(duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return this.ctx.createPeriodicWave(re, im);
  }

  // ---- 楽器 ----

  osc(type, hz, t, stop) {
    const o = this.ctx.createOscillator();
    if (this.waves[type]) o.setPeriodicWave(this.waves[type]);
    else o.type = type;
    o.frequency.value = hz;
    o.start(t);
    o.stop(stop);
    return o;
  }

  noiseSrc(t, stop) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.start(t, Math.random() * 1.5);
    s.stop(stop);
    return s;
  }

  filter(type, hz, q = 0.7) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    return f;
  }

  note(type, midi, t, dur, vol, out = this.bus) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.connect(out);
    const hz = midiHz(midi);
    const end = t + dur;
    switch (type) {
      case 'pulse12': case 'pulse25': case 'pulse50': case 'tri': {
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.01);
        g.gain.setTargetAtTime(vol * 0.7, t + 0.03, dur * 0.5);
        g.gain.setTargetAtTime(0, end, 0.06);
        this.osc(type === 'tri' ? 'triangle' : type, hz, t, end + 0.5).connect(g);
        break;
      }
      case 'flute': {
        // 三角波に、ゆっくりの ビブラート
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.08);
        g.gain.setTargetAtTime(0, end, 0.12);
        const o = this.osc('triangle', hz, t, end + 0.8);
        const lfo = this.osc('sine', 4.5, t, end + 0.8);
        const depth = ctx.createGain();
        depth.gain.setValueAtTime(0, t);
        depth.gain.linearRampToValueAtTime(hz * 0.004, t + 0.4);
        lfo.connect(depth);
        depth.connect(o.frequency);
        o.connect(g);
        break;
      }
      case 'epiano': {
        // 丸い 鍵盤：基音と、すぐ 消える 2倍音
        const ring = Math.max(dur * 1.5, 1.2);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.006);
        g.gain.exponentialRampToValueAtTime(vol * 0.3, t + ring * 0.5);
        g.gain.setTargetAtTime(0, end, 0.15);
        this.osc('sine', hz, t, end + 1).connect(g);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(vol * 0.35, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        g2.connect(out);
        this.osc('sine', hz * 2, t, t + 0.5).connect(g2);
        break;
      }
      case 'pad': {
        // 少し ずらした 三角波 二つを、ゆっくり ふくらませる
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + Math.min(1.2, dur * 0.3));
        g.gain.setValueAtTime(vol, end);
        g.gain.linearRampToValueAtTime(0, end + 2);
        for (const cents of [-7, 7]) this.osc('triangle', hz * 2 ** (cents / 1200), t, end + 2.2).connect(g);
        break;
      }
      case 'bell': {
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        this.osc('sine', hz, t, t + dur).connect(g);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(vol * 0.2, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4);
        g2.connect(out);
        this.osc('sine', hz * 2.76, t, t + dur).connect(g2);
        break;
      }
      case 'kick': {
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const o = this.osc('sine', 110, t, t + dur);
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        o.connect(g);
        break;
      }
      case 'snare': {
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const f = this.filter('bandpass', 1600);
        this.noiseSrc(t, t + dur).connect(f);
        f.connect(g);
        break;
      }
      case 'hat': case 'ride': case 'crackle': {
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const f = this.filter('highpass', type === 'ride' ? 5500 : type === 'crackle' ? 2500 : 7000);
        this.noiseSrc(t, t + dur).connect(f);
        f.connect(g);
        break;
      }
      case 'brush': {
        // さっと はく 音：少し ゆっくり 立ちあがる ノイズ
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const f = this.filter('bandpass', 2800, 0.5);
        this.noiseSrc(t, t + dur).connect(f);
        f.connect(g);
        break;
      }
      default:
        throw new Error(`知らない 楽器：${type}`);
    }
  }

  // ---- 演奏 ----

  scheduleBar(song, index, t0) {
    const beat = 60 / song.bpm;
    const e8 = i => t0 + Math.floor(i / 2) * beat + (i % 2 ? beat * 2 * song.swing - beat : 0);
    const n = song.chordList.length;
    const bar = index % n;
    const p = {
      song, bar, beat, e8,
      cycle: Math.floor(index / n),
      chord: song.chordList[bar],
      next: song.chordList[(bar + 1) % n],
      prev: song.chordList[(bar + n - 1) % n],
      rnd: seeded(this.seedBase * 1000 + index * 7 + 3),
    };
    ARRANGE[song.genre].call(this, p);
    this.playMelody(p);
    return t0 + beat * 4;
  }

  // メロディは 4周のうち 3周だけ。4周目は 1オクターブ 下で そっと（ローファイは 1周おき）
  playMelody({ song, cycle, bar, e8, beat }) {
    if (!song.melodyBars) return;
    const phase = cycle % 4;
    if (song.genre === 'lofi' ? phase % 2 === 0 : phase === 2) return;
    const low = song.genre !== 'lofi' && phase === 3;
    for (const [pos, midi, len] of song.melodyBars[bar % song.melodyBars.length]) {
      this.note(song.lead, midi - (low ? 12 : 0), e8(pos), (beat / 2) * len * 0.92, song.leadVol * (low ? 0.8 : 1));
    }
  }

  // until 秒まで 音を 予約する
  fill(until) {
    while (this.nextTime < until) this.nextTime = this.scheduleBar(this.song, this.barIndex++, this.nextTime);
  }

  tick() {
    if (!this.playing || !this.song) return; // 曲が 決まるまでは 待つ
    // タブが 裏に ある ときは タイマーが 遅く なるので、多めに 予約する
    const ahead = typeof document !== 'undefined' && document.hidden ? 3 : 0.4;
    this.fill(this.ctx.currentTime + ahead);
  }

  // 曲を 切りかえる。今の 曲は すっと 小さく なって、次の 曲が 始まる
  switchTo(id) {
    const song = SONGS[id];
    if (!song || this.song?.id === id) return;
    const now = this.ctx.currentTime;
    const old = this.bus;
    if (old) {
      old.gain.setTargetAtTime(0, now, 0.4);
      setTimeout(() => old.disconnect(), 6000);
    }
    const genre = GENRES[song.genre];
    this.bus = this.ctx.createGain();
    this.bus.gain.setValueAtTime(0, now);
    this.bus.gain.setTargetAtTime(genre.gain, now + 0.1, old ? 0.6 : 0.05);
    this.bus.connect(this.input);
    this.tone.frequency.setTargetAtTime(genre.tone, now, 0.5);
    this.wet.gain.setTargetAtTime(genre.echo, now, 0.5);
    this.echo.delayTime.setValueAtTime((60 / song.bpm) * 0.75, now);
    this.song = song;
    this.barIndex = 0;
    this.seedBase = Math.floor(Math.random() * 100000);
    this.nextTime = now + (old ? 0.6 : 0.1);
    this.startedAt = now;
  }

  // 選曲の しかたに あわせて、流す 曲を 決める。
  // omakase：時間帯と 天気で、iroiro：4分ほどで 次の 曲へ、それ以外：その 曲を くり返す
  follow(mode, timeKey, weather) {
    if (!this.playing) return;
    let id = mode;
    if (mode === 'omakase') id = omakaseSong(timeKey, weather);
    else if (mode === 'iroiro') {
      id = this.song?.id;
      if (!id || this.ctx.currentTime - this.startedAt > 240) {
        const i = SONG_ORDER.indexOf(id);
        id = SONG_ORDER[(i + 1 + Math.floor(Math.random() * 3)) % SONG_ORDER.length];
      }
    }
    this.switchTo(id);
  }

  async start(id) {
    await this.ctx.resume();
    if (id) this.switchTo(id);
    this.playing = true;
    if (!(this.nextTime >= this.ctx.currentTime)) this.nextTime = this.ctx.currentTime + 0.1;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(MASTER * this.volume, this.ctx.currentTime, 0.4);
    this.tick();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 50);
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  setVolume(v) {
    this.volume = v;
    if (this.playing) this.master.gain.setTargetAtTime(MASTER * v, this.ctx.currentTime, 0.1);
    if (this.rainGain) this.rainGain.gain.setTargetAtTime(this.rainLevel * v, this.ctx.currentTime, 0.3);
  }

  get title() { return this.song?.title ?? ''; }

  // 雨音：ノイズを やわらかく 削って、ずっと 流す。音量は ジュークボックスと いっしょに 変わる
  setRain(on) {
    const ctx = this.ctx;
    if (on && !this.rainSrc) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const hp = this.filter('highpass', 300);
      const lp = this.filter('lowpass', 1400);
      this.rainLevel = 0.06;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;
      src.connect(hp);
      hp.connect(lp);
      lp.connect(this.rainGain);
      this.rainGain.connect(ctx.destination);
      src.start();
      this.rainSrc = src;
      this.rainGain.gain.setTargetAtTime(this.rainLevel * this.volume, ctx.currentTime, 1.5);
    } else if (!on && this.rainSrc) {
      const src = this.rainSrc, g = this.rainGain;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
      setTimeout(() => { src.stop(); g.disconnect(); }, 5000);
      this.rainSrc = null;
      this.rainGain = null;
    }
  }

  // ---- 効果音（音楽を 止めていても 鳴る） ----

  chime(midi, t, dur, vol) {
    const ctx = this.ctx;
    this.sfx ??= (() => { const g = ctx.createGain(); g.gain.value = 0.5; g.connect(ctx.destination); return g; })();
    for (const [ratio, v] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = midiHz(midi) * ratio;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / ratio);
      o.connect(g);
      g.connect(this.sfx);
      o.start(t);
      o.stop(t + dur);
    }
  }

  // ドアの 鈴：ちりん、ちりん
  async bell() {
    await this.ctx.resume();
    const t = this.ctx.currentTime + 0.02;
    for (const [d, m, v] of [[0, 93, 0.14], [0.11, 98, 0.1], [0.3, 93, 0.08], [0.42, 98, 0.05]]) this.chime(m, t + d, 1.6, v);
  }

  // カップを ソーサーに 置く 音
  async clink() {
    await this.ctx.resume();
    const t = this.ctx.currentTime + 0.02;
    this.chime(103, t, 0.25, 0.05);
    this.chime(98, t + 0.06, 0.2, 0.03);
  }
}
