// ジュークボックス。おくのさんが 直した 古い 機械で、なぜか チップチューンしか 鳴らない。
//
// 決まった 曲を くり返すのでは なく、コード進行に そって その場で メロディを 紡ぐ。
// 開きっぱなしでも 聞き飽きないように。でも 4小節の まとまり（A A' B A）で、ちゃんと 曲に 聞こえるように。
//
// 音色：矩形波（メロディ・和音）、三角波（ベース）、ノイズ（ブラシ）。
// 角を 取るために 高い 音を 少し 削り、うっすら こだまを かける。
import { seeded } from './pixel.js';

const midiHz = m => 440 * 2 ** ((m - 69) / 12);
export const MASTER = 0.5; // 作業の じゃまに ならない 大きさ（tools/listen.mjs で 測って 決めた）

const CHORD = {
  maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], '6': [0, 4, 7, 9], m9: [0, 3, 7, 14],
};
const ch = (root, type) => ({ root, tones: CHORD[type] });

// 時間帯ごとの 曲。root は MIDI の 音の 番号（48 = ド）
export const SONGS = {
  asa: {
    title: '霧の停留所', bpm: 80, swing: 0.56,
    scale: [0, 2, 4, 7, 9], key: 60,
    chords: [ch(53, 'maj7'), ch(52, 'm7'), ch(50, 'm7'), ch(48, 'maj7')],
  },
  hiru: {
    title: '午後の地図帳', bpm: 86, swing: 0.58,
    scale: [0, 2, 4, 7, 9], key: 60,
    chords: [ch(53, 'maj7'), ch(55, '6'), ch(52, 'm7'), ch(57, 'm7')],
  },
  yu: {
    title: '坂の上の灯台', bpm: 74, swing: 0.6,
    scale: [0, 2, 4, 7, 9], key: 60,
    chords: [ch(50, 'm7'), ch(55, '7'), ch(48, 'maj7'), ch(57, '7')],
  },
  yoru: {
    title: '月見坂ノクターン', bpm: 64, swing: 0.6,
    scale: [0, 3, 5, 7, 10], key: 57,
    chords: [ch(57, 'm9'), ch(53, 'maj7'), ch(50, 'm7'), ch(52, '7')],
  },
};

const RHYTHMS = ['x.x.x...', 'x..x..x.', 'x...x.x.', '..x.x.x.', 'x.......', 'x.xx.x..', '....x.x.', 'x..x....'];

// 4小節の フレーズを 作る。音は 8分音符 単位で [位置, MIDI, 長さ]。
function makePhrase(song, rnd, rhythmsFrom) {
  const scaleNotes = [];
  for (let o = 0; o < 3; o++) for (const s of song.scale) scaleNotes.push(song.key + o * 12 + s);
  const inRange = scaleNotes.filter(n => n >= song.key + 7 && n <= song.key + 21);
  let prev = inRange[Math.floor(inRange.length / 2)];
  // 4小節目は 長く のばして 息つぎ
  const rhythms = rhythmsFrom ?? song.chords.map((_, b) => (b === 3 ? 'x.......' : RHYTHMS[Math.floor(rnd() * RHYTHMS.length)]));
  const bars = song.chords.map((chord, b) => {
    const pattern = rhythms[b];
    const notes = [];
    const hits = [...pattern].map((c, i) => (c === 'x' ? i : -1)).filter(i => i >= 0);
    hits.forEach((pos, k) => {
      let note;
      if (pos % 4 === 0) {
        // 強い 拍は 和音の 音に 寄せる
        const chordNotes = inRange.filter(n => chord.tones.some(t => (n - chord.root - t) % 12 === 0));
        const pool = chordNotes.length ? chordNotes : inRange;
        note = pool.reduce((a, c) => (Math.abs(c - prev) < Math.abs(a - prev) ? c : a));
        if (rnd() < 0.3) note = pool[Math.floor(rnd() * pool.length)];
      } else {
        const i = inRange.indexOf(prev);
        const step = [-2, -1, -1, 1, 1, 2][Math.floor(rnd() * 6)];
        note = inRange[Math.max(0, Math.min(inRange.length - 1, (i < 0 ? 3 : i) + step))];
      }
      const next = hits[k + 1] ?? 8;
      notes.push([pos, note, Math.min(next - pos, 4)]);
      prev = note;
    });
    return notes;
  });
  return { bars, rhythms };
}

export class Jukebox {
  constructor(ctx = new AudioContext()) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    const echo = ctx.createDelay(1);
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    feedback.gain.value = 0.28;
    wet.gain.value = 0.22;
    this.input = ctx.createGain();
    this.input.connect(tone);
    tone.connect(this.master);
    tone.connect(echo);
    echo.connect(feedback);
    feedback.connect(echo);
    echo.connect(wet);
    wet.connect(this.master);
    this.master.connect(ctx.destination);
    this.echo = echo;

    this.waves = { 12: this.pulseWave(0.125), 25: this.pulseWave(0.25) };
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    const rnd = seeded(1);
    for (let i = 0; i < len; i++) data[i] = rnd() * 2 - 1;

    this.songKey = null;
    this.playing = false;
    this.seedBase = 0;
    this.volume = 0.5;
  }

  // ファミコンと 同じ、幅の ちがう 矩形波
  pulseWave(duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return this.ctx.createPeriodicWave(re, im);
  }

  note(type, midi, t, dur, vol) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setTargetAtTime(vol * 0.6, t + 0.02, dur * 0.4);
    g.gain.setTargetAtTime(0, t + dur * 0.9, 0.05);
    g.connect(this.input);
    let src;
    if (type === 'noise') {
      src = ctx.createBufferSource();
      src.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6000;
      src.connect(hp);
      hp.connect(g);
    } else {
      src = ctx.createOscillator();
      if (type === 'tri') src.type = 'triangle';
      else src.setPeriodicWave(this.waves[type]);
      src.frequency.value = midiHz(midi);
      src.connect(g);
    }
    src.start(t);
    src.stop(t + dur + 0.4);
  }

  // 1フレーズ（4小節）の 音を 予約する
  schedulePhrase(song, t0, index) {
    const beat = 60 / song.bpm;
    const eighth = i => t0 + Math.floor(i / 2) * beat + (i % 2 ? beat * 2 * song.swing - beat : 0);
    // A A' B A：2つ目は リズムだけ 同じ、3つ目は 新しく、4つ目は 1つ目と 同じ
    // seedBase は 鳴らしはじめる たびに 変わるので、毎回 ちがう 出だしに なる
    const round = this.seedBase + Math.floor(index / 4), part = index % 4;
    if (part === 0 || !this.phraseA || this.phraseRound !== round) {
      this.phraseA = makePhrase(song, seeded(round * 7 + 1));
      this.phraseRound = round;
    }
    const phrase = part === 0 || part === 3 ? this.phraseA
      : part === 1 ? makePhrase(song, seeded(round * 7 + 2), this.phraseA.rhythms)
      : makePhrase(song, seeded(round * 7 + 3));
    const rnd = seeded((this.seedBase * 4 + index) * 3 + 5);

    song.chords.forEach((chord, b) => {
      const bar = b * 8;
      // ベース：1拍目に 根音、3拍目に 5度。ときどき 次の 和音へ 歩く
      this.note('tri', chord.root - 12, eighth(bar), beat * 1.8, 0.5);
      const next = song.chords[(b + 1) % 4].root;
      if (rnd() < 0.4) {
        this.note('tri', chord.root - 5, eighth(bar + 4), beat * 0.9, 0.42);
        this.note('tri', next - 12 + (next > chord.root ? -1 : 1), eighth(bar + 6), beat * 0.9, 0.42);
      } else {
        this.note('tri', chord.root - 5, eighth(bar + 4), beat * 1.8, 0.42);
      }
      // 和音：細い 矩形波で、そっと 分散和音
      const arp = [0, 1, 2, 3, 2, 1, 2, 3];
      for (let i = 0; i < 8; i++) {
        if (i % 2 && rnd() < 0.35) continue;
        this.note(12, chord.root + 12 + chord.tones[arp[i]], eighth(bar + i), beat * 0.45, 0.07);
      }
      // ブラシ：裏拍に かすかに
      for (const i of [2, 6]) this.note('noise', 0, eighth(bar + i), 0.04, rnd() < 0.5 ? 0.05 : 0.03);
      if (rnd() < 0.3) this.note('noise', 0, eighth(bar + 7), 0.03, 0.025);
      // メロディ（ときどき 休んで、和音と ベースだけに なる）
      if (part !== 2 || rnd() < 0.8) {
        for (const [pos, midi, len] of phrase.bars[b]) this.note(25, midi, eighth(bar + pos), (beat / 2) * len * 0.95, 0.16);
      }
    });
    return t0 + beat * 4 * song.chords.length;
  }

  // 先の 音を 予約していく。タブが 裏に あるときは タイマーが 遅く なるので、多めに 予約する
  tick() {
    if (!this.playing) return;
    const ahead = typeof document !== 'undefined' && document.hidden ? 3 : 0.4;
    while (this.nextTime < this.ctx.currentTime + ahead) {
      const song = SONGS[this.songKey];
      this.echo.delayTime.setValueAtTime((60 / song.bpm) * 0.75, this.nextTime);
      this.nextTime = this.schedulePhrase(song, this.nextTime, this.phraseIndex++);
      if (this.pendingKey) { this.songKey = this.pendingKey; this.pendingKey = null; this.phraseIndex = 0; }
    }
  }

  // 曲は キリの いい ところ（フレーズの 終わり）で 切りかわる
  setSong(key) {
    if (!this.playing) { this.songKey = key; return; }
    if (key !== this.songKey) this.pendingKey = key;
  }

  async start(key) {
    await this.ctx.resume();
    if (key) this.songKey = key;
    this.playing = true;
    this.phraseIndex = 0;
    this.seedBase = Math.floor(Math.random() * 100000);
    this.nextTime = this.ctx.currentTime + 0.1;
    this.master.gain.setTargetAtTime(MASTER * this.volume, this.ctx.currentTime, 0.4);
    this.tick();
    this.timer = setInterval(() => this.tick(), 50);
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  get title() { return SONGS[this.pendingKey ?? this.songKey]?.title ?? ''; }

  // ---- 効果音（音楽を 止めていても 鳴る） ----

  chime(midi, t, dur, vol) {
    const ctx = this.ctx;
    this.sfx ??= (() => { const g = ctx.createGain(); g.gain.value = 0.5; g.connect(ctx.destination); return g; })();
    // 鈴らしさは、高い 倍音を 少し 混ぜて 出す
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
