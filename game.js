// ゲーム要素（子ども向けの冒険。小学校低学年が読めるよう、画面に出る文はひらがな・カタカナだけにする）
// むしばきんを「やっつける」のではなく「ピカピカにすると なかまになる」。負けても罰はない。
// ゲーム状態は保存せず、記録データ（日付 → { brush, floss }）から毎回計算する。
// そのため CSV の書き出し・取り込みだけでレベル・装備・冒険の進み具合も復元される。
// 乱数は日付から決まるので、同じ記録なら何度計算しても同じ結果になる（引き直し不可）。
(function (root) {
  'use strict';

  const XP = { brush: 10, floss: 15, combo: 5 };
  const MAX_LEVEL = 99;
  const HERO_NAME = 'はみがきヒーロー';

  // Lv L に必要な累計経験値。序盤は早く、後半ほどゆっくり上がる
  function xpForLevel(level) {
    return 15 * (level - 1) * (level - 1);
  }

  function levelFromXp(xp) {
    let level = 1;
    while (level < MAX_LEVEL && xpForLevel(level + 1) <= xp) level++;
    return level;
  }

  function heroBaseStats(level) {
    return { hp: 20 + 8 * level, atk: 5 + 3 * level, def: 3 + 2 * level };
  }

  // 日付文字列をシードにした乱数（FNV-1a でハッシュ → mulberry32）
  function seededRandom(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function addDays(dateStr, days) {
    const d = parseDate(dateStr);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  }

  // ---- きせかえ（そうび） ----
  // 各部位 12段階。段階が上がるほど強い。value = base + step * 段階（数値は画面に出さず、パワーにまとめる）
  const item = (name, emoji) => ({ name, emoji });
  const EQUIP_SLOTS = [
    {
      key: 'weapon', label: 'もちもの', stat: 'atk', base: 3, step: 4,
      items: [item('ちいさな ハブラシ', '🪥'), item('あわあわ ハブラシ', '🫧'), item('フロスの ロープ', '🧵'), item('ミントの ステッキ', '🌿'),
        item('ほしの ステッキ', '🌟'), item('にじいろ ハブラシ', '🌈'), item('かみなり ハブラシ', '⚡'), item('ほのおの ハブラシ', '🔥'),
        item('ロケット ハブラシ', '🚀'), item('まほうの つえ', '🪄'), item('ドラゴン ハブラシ', '🐉'), item('でんせつの ハブラシ', '🔱')],
    },
    {
      key: 'armor', label: 'ふく', stat: 'def', base: 2, step: 3,
      items: [item('Tシャツ', '👕'), item('パーカー', '🧥'), item('みずたま ワンピース', '👗'), item('しずくの マント', '💧'),
        item('ヒーロー スーツ', '🦸'), item('にんじゃの ふく', '🥷'), item('ロボ スーツ', '🤖'), item('うちゅうふく', '🪐'),
        item('こおりの マント', '❄️'), item('おうさまの マント', '🤴'), item('きんの よろい', '✨'), item('でんせつの マント', '🌠')],
    },
    {
      key: 'shield', label: 'ぼうし', stat: 'def', base: 1, step: 2,
      items: [item('キャップ', '🧢'), item('むぎわらぼうし', '👒'), item('ねこみみ', '🐱'), item('うさみみ', '🐰'),
        item('ゴーグル', '🥽'), item('まほうの ぼうし', '🎩'), item('くまの ぼうし', '🐻'), item('ヘルメット', '⛑️'),
        item('ライオンの たてがみ', '🦁'), item('ユニコーンの つの', '🦄'), item('ドラゴンの かぶと', '🐲'), item('でんせつの かんむり', '👑')],
    },
    {
      key: 'accessory', label: 'キラキラ', stat: 'hp', base: 5, step: 6,
      items: [item('どんぐり', '🌰'), item('クローバー', '🍀'), item('リボン', '🎀'), item('すず', '🔔'),
        item('ビーだま', '🔮'), item('ハートの ペンダント', '💖'), item('さくらの はなびら', '🌸'), item('にじの はね', '🪽'),
        item('ようせいの こな', '🧚'), item('ダイヤ', '💎'), item('おひさまの メダル', '🌞'), item('でんせつの メダル', '🏅')],
    },
  ];
  const MAX_TIER = 11;

  // たからばこのランク。ボーナスぶん強い段階のそうびが出る
  const CHESTS = [
    { name: 'たからばこ', tierBonus: 0 },
    { name: 'ぎんの たからばこ', tierBonus: 1 },
    { name: 'きんの たからばこ', tierBonus: 2 },
    { name: 'にじいろの たからばこ', tierBonus: 4 },
  ];
  // 歯磨き＋フロスの連続日数が長いほど良いたからばこが出やすい
  const CHEST_WEIGHTS = [
    { minStreak: 30, weights: [40, 35, 19, 6] },
    { minStreak: 7, weights: [50, 32, 14, 4] },
    { minStreak: 0, weights: [60, 28, 10, 2] },
  ];
  const CHEST_CHANCE_COMPLETE = 1;
  const CHEST_CHANCE_PARTIAL = 0.3;

  function equipValue(slot, tier) {
    return slot.base + slot.step * tier;
  }

  function pickWeighted(weights, rand) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }

  // ---- ぼうけんの エリアと むしばきん ----
  // power からステータスを決める。kills はボスに会うまでに ピカピカにする数
  const mon = (name, emoji) => ({ name, emoji });
  const AREAS = [
    { name: 'まえばの はらっぱ', kills: 5, power: 1,
      monsters: [mon('チョコきん', '🍫'), mon('アメきん', '🍬'), mon('ジュースきん', '🧃')], boss: mon('ベタベタ キング', '🤴') },
    { name: 'キバの もり', kills: 7, power: 3,
      monsters: [mon('グミきん', '🐻'), mon('ポテチきん', '🥔'), mon('ドーナツきん', '🍩')], boss: mon('ネバネバ まじょ', '🧙') },
    { name: 'おくばの どうくつ', kills: 10, power: 5,
      monsters: [mon('キャラメルきん', '🍮'), mon('ガムきん', '🫧'), mon('クッキーきん', '🍪')], boss: mon('カチコチ ゴーレム', '🗿') },
    { name: 'はぐきの ぬま', kills: 12, power: 7,
      monsters: [mon('プクプクきん', '🐸'), mon('ムズムズきん', '🐛'), mon('ヒリヒリきん', '🌶️')], boss: mon('ブクブク ドラゴン', '🐊') },
    { name: 'べろの さばく', kills: 15, power: 9,
      monsters: [mon('ザラザラきん', '🌵'), mon('モヤモヤきん', '☁️'), mon('クンクンきん', '🧄')], boss: mon('モクモク おばけ', '👻') },
    { name: 'つばの うみ', kills: 18, power: 11,
      monsters: [mon('スッパきん', '🍋'), mon('シュワシュワきん', '🥤'), mon('アイスきん', '🍦')], boss: mon('スッパイ クラーケン', '🦑') },
    { name: 'おくちの おしろの とう', kills: 22, power: 13,
      monsters: [mon('ジンジンきん', '🦂'), mon('キーンきん', '🧊'), mon('ズキズキきん', '🦇')], boss: mon('いたいいたい デビル', '😈') },
    { name: 'むしば じょう', kills: 26, power: 15,
      monsters: [mon('むしば ナイト', '🦠'), mon('むしば まほうつかい', '🦹'), mon('ジャイアント むしばきん', '👾')], boss: mon('むしば だいおう', '🐲') },
  ];
  const LOOP_POWER = 4; // クリア後の2周目以降は敵が強くなる
  const BOSS_WOUND = 0.2; // ボスに負けるたびに次回のボスHPが 20% 減る（最大 70% 減）
  const MAX_TURNS = 20;

  function monsterStats(name, power, isBoss, bossFails = 0) {
    const wound = isBoss ? Math.max(0.3, 1 - BOSS_WOUND * bossFails) : 1;
    const hp = Math.round((14 + 11 * power) * (isBoss ? 2.2 : 1) * wound);
    const atk = Math.round((10 + 6 * power) * (isBoss ? 1.15 : 1));
    const def = Math.round(4 + 5 * power);
    return { name, hp, atk, def, isBoss };
  }

  function areaPower(areaIndex, loop) {
    return AREAS[areaIndex].power + loop * LOOP_POWER;
  }

  function damage(atk, def, rand) {
    return Math.max(1, Math.round((atk - def / 2) * (0.85 + rand() * 0.3)));
  }

  // 自動戦闘。ヒーローが先攻
  function fight(hero, monster, rand) {
    let heroHp = hero.hp;
    let monsterHp = monster.hp;
    let critical = false;
    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      let dmg = damage(hero.atk, monster.def, rand);
      if (rand() < 1 / 16) {
        dmg = Math.round(hero.atk * (1.5 + rand() * 0.5));
        critical = true;
      }
      monsterHp -= dmg;
      if (monsterHp <= 0) return { result: 'win', turns: turn, heroHp, critical };
      heroHp -= damage(monster.atk, hero.def, rand);
      if (heroHp <= 0) return { result: 'lose', turns: turn, heroHp: 0, critical };
    }
    return { result: 'escape', turns: MAX_TURNS, heroHp, critical };
  }

  function heroStats(level, equipped) {
    const stats = heroBaseStats(level);
    EQUIP_SLOTS.forEach(slot => {
      const tier = equipped[slot.key];
      if (tier >= 0) stats[slot.stat] += equipValue(slot, tier);
    });
    return stats;
  }

  function isRecordDay(day) {
    return !!day && (!!day.brush || !!day.floss);
  }

  // 記録データ全体からゲーム状態を計算する
  function computeGame(data, today) {
    const dates = Object.keys(data)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today && isRecordDay(data[d]))
      .sort();

    const state = {
      heroName: HERO_NAME,
      xp: 0,
      level: 1,
      equipped: { weapon: -1, armor: -1, shield: -1, accessory: -1 },
      collection: {}, // "slotKey:tier" → true
      friends: {}, // ピカピカにして なかまになった むしばきんの なまえ → true
      areaIndex: 0,
      loop: 0,
      kills: 0,
      bossFails: 0,
      wins: 0,
      bossWins: 0,
      completeStreak: 0,
      days: {}, // 日付 → { lines: [...], levelUp, item, battle }
    };

    let prevDate = null;
    dates.forEach(date => {
      const day = data[date];
      const rand = seededRandom(date);
      const complete = !!day.brush && !!day.floss;
      const consecutive = prevDate !== null && prevDate === addDays(date, -1);
      state.completeStreak = complete ? (consecutive ? state.completeStreak + 1 : 1) : 0;

      const lines = [];
      const result = { lines, levelUp: null, item: null, battle: null };

      // 1. けいけんち
      const gain = (day.brush ? XP.brush : 0) + (day.floss ? XP.floss : 0) + (complete ? XP.combo : 0);
      state.xp += gain;
      lines.push(`けいけんちを ${gain} もらった！${complete ? '（りょうほう できた ボーナス つき）' : ''}`);
      const newLevel = levelFromXp(state.xp);
      if (newLevel > state.level) {
        result.levelUp = { from: state.level, to: newLevel };
        state.level = newLevel;
        lines.push(`🎉 レベル ${newLevel}に なった！`);
      }

      // 2. たからばこ
      const chestChance = complete ? CHEST_CHANCE_COMPLETE : CHEST_CHANCE_PARTIAL;
      if (rand() < chestChance) {
        const weights = CHEST_WEIGHTS.find(w => state.completeStreak >= w.minStreak).weights;
        const chest = CHESTS[pickWeighted(weights, rand)];
        const slot = EQUIP_SLOTS[Math.floor(rand() * EQUIP_SLOTS.length)];
        const baseTier = Math.min(MAX_TIER, state.areaIndex + state.loop * 2);
        const tier = Math.max(0, Math.min(MAX_TIER, baseTier + chest.tierBonus - (rand() < 0.3 ? 1 : 0)));
        const got = slot.items[tier];
        const isNew = !state.collection[`${slot.key}:${tier}`];
        state.collection[`${slot.key}:${tier}`] = true;
        lines.push(`🎁 ${chest.name}！ ${got.emoji}${got.name}を ゲット！${isNew ? ' 🆕' : ''}`);
        const equipped = tier > state.equipped[slot.key];
        if (equipped) {
          state.equipped[slot.key] = tier;
          lines.push(`さっそく ${got.name}を つけてみた！ パワー アップ！`);
        }
        result.item = { slot: slot.key, tier, name: got.name, emoji: got.emoji, chest: chest.name, isNew, equipped };
      }

      // 3. せんとう
      const area = AREAS[state.areaIndex];
      const isBoss = state.kills >= area.kills;
      const power = areaPower(state.areaIndex, state.loop);
      const foe = isBoss ? area.boss : area.monsters[Math.floor(rand() * area.monsters.length)];
      const monster = monsterStats(foe.name, power, isBoss, state.bossFails);
      const hero = heroStats(state.level, state.equipped);
      const outcome = fight(hero, monster, rand);
      lines.push(isBoss ? `‼️ ボスの ${foe.emoji}${foe.name}が でてきた！` : `${foe.emoji}${foe.name}が でてきた！`);
      if (isBoss && state.bossFails > 0) lines.push(`${foe.name}は まえより つかれて いるみたい！`);
      if (outcome.critical) lines.push('✨ スーパー ピカピカ アタック！');
      if (outcome.result === 'win') {
        state.wins++;
        const isNewFriend = !state.friends[foe.name];
        state.friends[foe.name] = true;
        lines.push(`${foe.name}を ピカピカに した！ きれいに なって なかまに なったよ！${isNewFriend ? ' 🆕' : ''}`);
        if (isBoss) {
          state.bossWins++;
          state.bossFails = 0;
          state.kills = 0;
          if (state.areaIndex < AREAS.length - 1) {
            state.areaIndex++;
            lines.push(`🗺️ ${AREAS[state.areaIndex].name}へ いけるように なった！`);
          } else {
            state.areaIndex = 0;
            state.loop++;
            lines.push(`🎊 おくちの なかが ぜんぶ ピカピカに なった！ …でも また むしばきんが やってきた！（${state.loop + 1}しゅうめ）`);
          }
        } else {
          state.kills++;
          if (state.kills >= area.kills) lines.push('つぎは ボスが でてくるよ…！');
        }
      } else {
        // 負け・時間切れは子どもには同じに見せる。ボスは負けた回数ぶん次回が弱くなる
        if (isBoss && outcome.result === 'lose') state.bossFails++;
        lines.push(`${foe.name}は にげちゃった！ また あした がんばろう！`);
      }
      result.battle = { monster: foe.name, emoji: foe.emoji, isBoss, result: outcome.result };

      state.days[date] = result;
      prevDate = date;
    });

    state.stats = heroStats(state.level, state.equipped);
    state.xpToNext = state.level >= MAX_LEVEL ? 0 : xpForLevel(state.level + 1) - state.xp;
    state.xpProgress = state.level >= MAX_LEVEL ? 1
      : (state.xp - xpForLevel(state.level)) / (xpForLevel(state.level + 1) - xpForLevel(state.level));
    state.area = AREAS[state.areaIndex];
    state.collectionCount = Object.keys(state.collection).length;
    state.collectionTotal = EQUIP_SLOTS.length * (MAX_TIER + 1);
    state.friendsCount = Object.keys(state.friends).length;
    state.friendsTotal = AREAS.reduce((n, a) => n + a.monsters.length + 1, 0);
    state.power = state.stats.atk + state.stats.def + Math.floor(state.stats.hp / 4);
    return state;
  }

  const Game = {
    XP, MAX_LEVEL, EQUIP_SLOTS, AREAS, CHESTS,
    xpForLevel, levelFromXp, heroStats, monsterStats, areaPower, fight, seededRandom, addDays, equipValue,
    computeGame,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Game;
  else root.Game = Game;
})(this);
