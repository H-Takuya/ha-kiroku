// すいそうに来る 淡水の いきもの 30種と、フロスで ふえる 水草・石のデータ。
// 名前は日本で一般に流通している呼び名。画面の文は ひらがな・カタカナだけにする（学名は おうちの人向け）。
// size: 表示の大きさ（em）。zone: およぐ場所（top / mid / bottom）。
// art: fishart.js が 絵を かくための指定（形・色・もよう）。左向きで かく。
(function (root) {
  'use strict';

  const SPECIES = [
    // ---- よく くる（12） ----
    {
      id: 'neon', name: 'ネオンテトラ', sci: 'Paracheirodon innesi', tier: 'common',
      home: 'みなみアメリカ', cm: 3, zone: 'mid', size: 1.6,
      note: 'あおく ひかる ラインと あかい おなかが きれい。むれで およぐよ。',
      art: { hT: 9, hB: 9, tb: 3.5, tail: 'fork', tf: 9, dorsal: 'small', anal: 'small', adipose: true,
        base: '#b9c4c4', back: '#7d8c86', fin: '#e8f2f2',
        pattern: [{ t: 'belly', y: 1, x0: 44, x1: 90, color: '#e8343a' }, { t: 'stripe', y: -3, h: 3.6, x0: 16, x1: 80, color: '#27d6ff' }] },
    },
    {
      id: 'cardinal', name: 'カージナルテトラ', sci: 'Paracheirodon axelrodi', tier: 'common',
      home: 'みなみアメリカ', cm: 4, zone: 'mid', size: 1.7,
      note: 'ネオンテトラに にているけど、あかい いろが おなか ぜんぶに あるよ。',
      art: { hT: 9.5, hB: 9.5, tb: 3.5, tail: 'fork', tf: 9, dorsal: 'small', anal: 'small', adipose: true,
        base: '#b9c4c4', back: '#7d8c86', fin: '#e8f2f2',
        pattern: [{ t: 'belly', y: 0.5, x0: 10, x1: 90, color: '#e3262f' }, { t: 'stripe', y: -3.5, h: 3.8, x0: 14, x1: 84, color: '#2fd8ff' }] },
    },
    {
      id: 'rummy', name: 'ラミーノーズテトラ', sci: 'Hemigrammus rhodostomus', tier: 'common',
      home: 'みなみアメリカ', cm: 4.5, zone: 'mid', size: 1.8,
      note: 'はなが まっか。しっぽは しろと くろの しましま。',
      art: { hT: 10, hB: 10, tb: 3.5, tail: 'fork', tf: 10, dorsal: 'small', anal: 'small', adipose: true,
        base: '#d8e1e0', back: '#a9b8b2', fin: '#f2f6f6',
        pattern: [{ t: 'nose', x1: 24, color: '#e8323b' }],
        tailPattern: [{ y: -7, h: 3, color: '#1a1a1a' }, { y: -1.3, h: 2.6, color: '#1a1a1a' }, { y: 4.5, h: 3, color: '#1a1a1a' }] },
    },
    {
      id: 'guppy', name: 'グッピー', sci: 'Poecilia reticulata', tier: 'common',
      home: 'みなみアメリカ', cm: 4, zone: 'top', size: 1.9,
      note: 'おすは おおきな しっぽが カラフル。あかちゃんを そのまま うむよ。',
      art: { hT: 8, hB: 9, tb: 4, tail: 'fan', tf: 20, dorsal: 'small', anal: 'small', nose: 14, ped: 74,
        base: '#b8c2a8', back: '#8c977c', fin: '#ff9a3c',
        tailGrad: ['#ff8a2a', '#e83f8f', '#3c6cff'],
        pattern: [{ t: 'spots', n: 3, r: 2.4, color: '#ff8a2a', x0: 40, x1: 70, seed: 3 }] },
    },
    {
      id: 'platy', name: 'プラティ', sci: 'Xiphophorus maculatus', tier: 'common',
      home: 'ちゅうおうアメリカ', cm: 5, zone: 'mid', size: 1.9,
      note: 'まるっこくて げんき。いろいろな いろの なかまが いるよ。',
      art: { hT: 13, hB: 13, tb: 5, tail: 'round', tf: 11, dorsal: 'small', anal: 'small',
        base: '#ff5a24', back: '#e0421a', fin: '#ff7a40',
        pattern: [{ t: 'belly', y: 6, x0: 10, x1: 70, color: '#ff8a50' }] },
    },
    {
      id: 'akahire', name: 'アカヒレ', sci: 'Tanichthys albonubes', tier: 'common',
      home: 'ちゅうごく', cm: 4, zone: 'top', size: 1.7,
      note: 'さむさに つよい つよい さかな。ひれの はしが あかいよ。',
      art: { hT: 8, hB: 8, tb: 3.5, tail: 'fork', tf: 9, dorsal: 'small', anal: 'small',
        base: '#a3a074', back: '#76734f', fin: '#e8453c',
        pattern: [{ t: 'stripe', y: -1, h: 2, x0: 20, x1: 86, color: '#ffd86b' }] },
    },
    {
      id: 'zebra', name: 'ゼブラダニオ', sci: 'Danio rerio', tier: 'common',
      home: 'みなみアジア', cm: 5, zone: 'top', size: 1.9,
      note: 'よこじまの もようで、すばやく およぐよ。',
      art: { hT: 8.5, hB: 8.5, tb: 3.5, tail: 'fork', tf: 10, dorsal: 'small', anal: 'small',
        base: '#ece6c6', back: '#c9c19a', fin: '#f2ecd2',
        pattern: [{ t: 'hstripes', ys: [-4.2, 0, 4.2], h: 2.2, x0: 20, x1: 92, color: '#20348c' }],
        tailPattern: [{ y: -3.3, h: 2, color: '#20348c' }, { y: 1.3, h: 2, color: '#20348c' }] },
    },
    {
      id: 'harlequin', name: 'ラスボラ・ヘテロモルファ', sci: 'Trigonostigma heteromorpha', tier: 'common',
      home: 'とうなんアジア', cm: 4, zone: 'mid', size: 1.8,
      note: 'からだに くろい さんかくの もようが あるよ。',
      art: { hT: 13, hB: 12, tb: 4, tail: 'fork', tf: 10, dorsal: 'small', anal: 'small',
        base: '#f0a27c', back: '#c97a5a', fin: '#f28a6a',
        pattern: [{ t: 'poly', pts: [[46, -7], [88, -4], [88, 4], [52, 6]], color: '#1d1d22' }] },
    },
    {
      id: 'cory', name: 'コリドラス・パレアタス', sci: 'Corydoras paleatus', tier: 'common',
      home: 'みなみアメリカ', cm: 6, zone: 'bottom', size: 1.9,
      note: 'そこで ひげを うごかして えさを さがすよ。',
      art: { hT: 16, hB: 8, tb: 4.5, hx: 0.36, tail: 'fork', tf: 10, dorsal: 'tall', anal: 'small', adipose: true, barbels: true,
        base: '#bdb6a2', back: '#8e8774', fin: '#cfc9b6', eyeY: -5,
        pattern: [{ t: 'spots', n: 14, r: 2.6, color: '#46443a', x0: 14, x1: 86, seed: 9 }],
        tailPattern: [{ y: -5, h: 1.5, color: '#46443a' }, { y: 3, h: 1.5, color: '#46443a' }] },
    },
    {
      id: 'oto', name: 'オトシンクルス', sci: 'Otocinclus sp.', tier: 'common',
      home: 'みなみアメリカ', cm: 4, zone: 'bottom', size: 1.6,
      note: 'ガラスや はっぱに くっついて コケを たべる そうじやさん。',
      art: { hT: 8, hB: 7, tb: 3.5, tail: 'fork', tf: 9, dorsal: 'small', anal: 'small', sucker: true,
        base: '#cdbf90', back: '#9d8f62', fin: '#ddd2ad',
        pattern: [{ t: 'stripe', y: 0, h: 3.2, x0: 6, x1: 92, color: '#3d382a' }] },
    },
    {
      id: 'yamato', name: 'ヤマトヌマエビ', sci: 'Caridina multidentata', tier: 'common',
      home: 'にほん など', cm: 5, zone: 'bottom', size: 1.8, kind: 'shrimp',
      note: 'コケを たべて すいそうを きれいに してくれる エビ。',
      art: { base: '#b9cbc6', opacity: 0.85, dash: '#a0503a' },
    },
    {
      id: 'ramshorn', name: 'レッドラムズホーン', sci: 'Planorbella duryi', tier: 'common',
      home: 'きたアメリカ', cm: 2, zone: 'bottom', size: 1.2, kind: 'snail',
      note: 'あかい うずまきの かいを せおった まきがいの なかま。',
      art: { base: '#d9473b', foot: '#e8706a' },
    },

    // ---- めずらしい（10） ----
    {
      id: 'angel', name: 'エンゼルフィッシュ', sci: 'Pterophyllum scalare', tier: 'rare',
      home: 'みなみアメリカ', cm: 15, zone: 'mid', size: 3.0,
      note: 'さんかくの ながい ひれで、ゆうがに およぐよ。',
      art: { hT: 20, hB: 20, tb: 5, nose: 26, ped: 74, hx: 0.42, tail: 'lyre', tf: 13, dorsal: 'angel', anal: 'angel', filaments: true,
        base: '#e9e8df', back: '#c9c8bc', fin: '#dcdcd2',
        pattern: [{ t: 'bands', xs: [36, 56, 72], w: 4, color: '#26261f' }] },
    },
    {
      id: 'gourami', name: 'ドワーフグラミー', sci: 'Trichogaster lalius', tier: 'rare',
      home: 'みなみアジア', cm: 6, zone: 'top', size: 2.1,
      note: 'ひものような ひれで まわりを さわって しらべるよ。',
      art: { hT: 15, hB: 15, tb: 5, nose: 14, ped: 80, tail: 'round', tf: 12, dorsal: 'long', anal: 'long', threads: true,
        base: '#e85a2c', back: '#c8441e', fin: '#e8582f',
        pattern: [{ t: 'bands', xs: [26, 33, 40, 47, 54, 61, 68, 75], w: 2.6, color: '#40c8d8', slant: 4 }] },
    },
    {
      id: 'cherrybarb', name: 'チェリーバルブ', sci: 'Puntius titteya', tier: 'rare',
      home: 'スリランカ', cm: 5, zone: 'mid', size: 1.8,
      note: 'おすは さくらんぼのように まっかに なるよ。',
      art: { hT: 11.5, hB: 11, tb: 4, tail: 'fork', tf: 10, dorsal: 'small', anal: 'small',
        base: '#d8283b', back: '#a81a2c', fin: '#e8404e',
        pattern: [{ t: 'stripe', y: -1, h: 2, x0: 10, x1: 90, color: '#6a1420' }] },
    },
    {
      id: 'molly', name: 'ブラックモーリー', sci: 'Poecilia sphenops', tier: 'rare',
      home: 'ちゅうおうアメリカ', cm: 6, zone: 'top', size: 2.1,
      note: 'からだも ひれも まっくろな さかな。',
      art: { hT: 13, hB: 13, tb: 5.5, tail: 'round', tf: 13, dorsal: 'long', anal: 'small',
        base: '#1d1d22', back: '#111114', fin: '#26262c', sheen: true },
    },
    {
      id: 'swordtail', name: 'ソードテール', sci: 'Xiphophorus hellerii', tier: 'rare',
      home: 'ちゅうおうアメリカ', cm: 12, zone: 'mid', size: 2.6,
      note: 'おすの しっぽの したが、けんのように ながく のびるよ。',
      art: { hT: 10, hB: 10, tb: 4.5, nose: 6, ped: 72, tail: 'sword', tf: 10, dorsal: 'small', anal: 'small',
        base: '#f0602a', back: '#cf4418', fin: '#f47a40' },
    },
    {
      id: 'kuhli', name: 'クーリーローチ', sci: 'Pangio kuhlii', tier: 'rare',
      home: 'とうなんアジア', cm: 10, zone: 'bottom', size: 2.4,
      note: 'ヘビみたいに ほそながい ドジョウの なかま。すなに もぐるのが すき。',
      art: { hT: 5.5, hB: 5.5, tb: 4, hx: 0.5, nose: 4, ped: 104, tail: 'round', tf: 5, dorsal: 'none', anal: 'none', barbels: true,
        base: '#f2a65c', back: '#d98a40', fin: '#e8a060',
        pattern: [{ t: 'bands', xs: [14, 25, 36, 47, 58, 69, 80, 91, 101], w: 5, color: '#3a271a' }] },
    },
    {
      id: 'bristlenose', name: 'ブッシープレコ', sci: 'Ancistrus sp.', tier: 'rare',
      home: 'みなみアメリカ', cm: 12, zone: 'bottom', size: 2.4,
      note: 'かおに ふさふさの とげ。くちで ガラスや ながれぎに すいつくよ。',
      art: { hT: 11, hB: 7, tb: 4, hx: 0.3, tail: 'fork', tf: 10, dorsal: 'sail', anal: 'small', sucker: true, bristles: true, pectoral: true,
        base: '#5d5a4c', back: '#46443a', fin: '#5d5a4c', eyeY: -4,
        pattern: [{ t: 'spots', n: 22, r: 1.5, color: '#cfc8a2', x0: 8, x1: 88, seed: 5 }] },
    },
    {
      id: 'ram', name: 'ラミレジィ', sci: 'Mikrogeophagus ramirezi', tier: 'rare',
      home: 'みなみアメリカ', cm: 6, zone: 'bottom', size: 2.0,
      note: 'きいろと あおに かがやく ちいさな シクリッド。',
      art: { hT: 14, hB: 13, tb: 4.5, tail: 'round', tf: 11, dorsal: 'crest', anal: 'small',
        base: '#f2c84a', fin: '#5aaee8', grad: ['#f5c63a', '#f0c45a', '#6aaee6'],
        pattern: [{ t: 'bands', xs: [14], w: 5, color: '#1e1e22' }, { t: 'ellipse', cx: 30, cy: 9, rx: 14, ry: 6, color: '#f2683a' },
          { t: 'spots', n: 8, r: 1.2, color: '#9fe0ff', x0: 40, x1: 82, seed: 4 }] },
    },
    {
      id: 'hatchet', name: 'マーブルハチェット', sci: 'Carnegiella strigata', tier: 'rare',
      home: 'みなみアメリカ', cm: 3.5, zone: 'top', size: 1.7,
      note: 'おなかが まるく でっぱった ふしぎな かたち。ジャンプが とくい。',
      art: { hT: 4, hB: 22, tb: 3.5, hx: 0.36, tail: 'fork', tf: 9, dorsal: 'small', anal: 'small', wings: true, eyeY: 2,
        base: '#e2e8e6', back: '#a9b2ae', fin: '#eef2f0',
        pattern: [{ t: 'waves', n: 3, color: '#4a4a40', y0: 5, dy: 5, x0: 24, x1: 82 }] },
    },
    {
      id: 'rainbow', name: 'ネオンドワーフレインボー', sci: 'Melanotaenia praecox', tier: 'rare',
      home: 'ニューギニア', cm: 6, zone: 'mid', size: 2.1,
      note: 'あおく ひかる からだに、あかい ひれ。',
      art: { hT: 15, hB: 11, tb: 4, hx: 0.48, tail: 'fork', tf: 11, dorsal: 'double', anal: 'long',
        base: '#62aaea', back: '#4a86c8', fin: '#e8453c',
        pattern: [{ t: 'stripe', y: -2, h: 1.5, x0: 20, x1: 86, color: '#bfe6ff' }, { t: 'stripe', y: 3, h: 1.2, x0: 24, x1: 84, color: '#bfe6ff' }] },
    },

    // ---- とっても めずらしい（4） ----
    {
      id: 'betta', name: 'ベタ', sci: 'Betta splendens', tier: 'superRare',
      home: 'とうなんアジア', cm: 6, zone: 'top', size: 2.4,
      note: 'ひらひらの ながい ひれ。くうきを すって いきが できるよ。',
      art: { hT: 9, hB: 9, tb: 5, nose: 12, ped: 66, tail: 'flow', tf: 26, dorsal: 'flow', anal: 'flow',
        base: '#2c3cd4', back: '#1f2ca8', fin: '#4a62f0', finEdge: '#e0213a' },
    },
    {
      id: 'zebrapleco', name: 'ゼブラプレコ', sci: 'Hypancistrus zebra', tier: 'superRare',
      home: 'みなみアメリカ', cm: 8, zone: 'bottom', size: 2.2,
      note: 'しろと くろの しましま。とても めずらしい ナマズの なかま。',
      art: { hT: 11, hB: 7, tb: 4, hx: 0.3, tail: 'fork', tf: 10, dorsal: 'sail', anal: 'small', sucker: true, pectoral: true,
        base: '#f2f2ec', back: '#e2e2da', fin: '#f2f2ec', eyeY: -4, eyeColor: '#3a6fd8',
        pattern: [{ t: 'bands', xs: [18, 34, 52, 70, 86], w: 6, color: '#121214', slant: 6 }],
        tailPattern: [{ y: -5, h: 3, color: '#121214' }, { y: 2, h: 3, color: '#121214' }] },
    },
    {
      id: 'apisto', name: 'アピストグラマ・カカトゥオイデス', sci: 'Apistogramma cacatuoides', tier: 'superRare',
      home: 'みなみアメリカ', cm: 8, zone: 'bottom', size: 2.1,
      note: 'せびれが とりの とさかの ように ピンと たつよ。',
      art: { hT: 12, hB: 11, tb: 4.5, tail: 'lyre', tf: 12, dorsal: 'cockatoo', anal: 'long',
        base: '#dccb78', back: '#a99a50', fin: '#e8582f',
        pattern: [{ t: 'stripe', y: 0, h: 2.6, x0: 12, x1: 86, color: '#3a3320' }, { t: 'belly', y: 6, x0: 12, x1: 60, color: '#e9e2a8' }] },
    },
    {
      id: 'redbee', name: 'レッドビーシュリンプ', sci: 'Caridina sp.', tier: 'superRare',
      home: 'にほんで うまれた', cm: 3, zone: 'bottom', size: 1.5, kind: 'shrimp',
      note: 'あかと しろの もようの エビ。にほんの ひとが つくりだしたよ。',
      art: { base: '#fafafa', bands: '#d61f2c', opacity: 1 },
    },

    // ---- とくべつな おきゃくさん（れんぞく日数で くる・4） ----
    {
      id: 'clownloach', name: 'クラウンローチ', sci: 'Chromobotia macracanthus', tier: 'milestone', streak: 7,
      home: 'とうなんアジア', cm: 30, zone: 'bottom', size: 2.8,
      note: 'オレンジに くろい しま。ドジョウの なかまで、とても ながいきだよ。',
      art: { hT: 13, hB: 11, tb: 4.5, hx: 0.42, tail: 'fork', tf: 12, dorsal: 'small', anal: 'small', barbels: true,
        base: '#ff8a1f', back: '#e8700a', fin: '#e8382c',
        pattern: [{ t: 'bands', xs: [20, 50, 82], w: 10, color: '#161616' }] },
    },
    {
      id: 'glasscat', name: 'グラスキャットフィッシュ', sci: 'Kryptopterus vitreolus', tier: 'milestone', streak: 14,
      home: 'とうなんアジア', cm: 8, zone: 'mid', size: 2.2,
      note: 'からだが すきとおって ほねが みえる ふしぎな ナマズ。',
      art: { hT: 9, hB: 11, tb: 4, nose: 6, ped: 96, hx: 0.25, tail: 'fork', tf: 9, dorsal: 'none', anal: 'glass', barbels: true, glass: true,
        base: '#d8eef2', back: '#b8d8de', fin: '#e8f6f8' },
    },
    {
      id: 'discus', name: 'ディスカス', sci: 'Symphysodon sp.', tier: 'milestone', streak: 30,
      home: 'みなみアメリカ', cm: 15, zone: 'mid', size: 3.0, kind: 'disc',
      note: 'まるい おさらのような かたち。ねったいぎょの おうさまと よばれるよ。',
      art: { base: '#c8532f', line: '#2fc8c8', fin: '#b8482a', band: '#6a2a18' },
    },
    {
      id: 'arowana', name: 'アジアアロワナ', sci: 'Scleropages formosus', tier: 'milestone', streak: 100,
      home: 'とうなんアジア', cm: 90, zone: 'top', size: 4.6,
      note: 'きんいろの おおきな うろこ。「りゅうぎょ」とも よばれるよ。',
      art: { hT: 10, hB: 11, tb: 5, hx: 0.5, nose: 4, ped: 100, tail: 'round', tf: 11, dorsal: 'rear', anal: 'rear', barbels: 'chin', upturned: true,
        base: '#ecc24a', back: '#c99a26', fin: '#d9a43a', scales: '#b88a20' },
    },
  ];

  // フロスした日に ふえる 水草・石
  const PLANTS = [
    { id: 'anubias', name: 'アヌビアス・ナナ', size: 2.2 },
    { id: 'microsorum', name: 'ミクロソリウム', size: 2.6 },
    { id: 'moss', name: 'ウィローモス', size: 1.8 },
    { id: 'rotala', name: 'ロタラ', size: 3.2 },
    { id: 'sword', name: 'アマゾンソード', size: 3.0 },
    { id: 'hairgrass', name: 'ヘアーグラス', size: 1.8 },
    { id: 'glosso', name: 'グロッソスティグマ', size: 1.6 },
    { id: 'lava', name: 'ようがんせき', size: 1.8 },
  ];

  const Species = { SPECIES, PLANTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Species;
  else root.Species = Species;
})(this);
