// すいぞくかん：はみがきで 淡水の さかなが、フロスで 水草が、月ごとの すいそうに ふえていく。
// 状態は保存せず、記録データ（日付 → { brush, floss }）から毎回計算する。
// そのため CSV の書き出し・取り込みだけで すいそうも元にもどる。
// 乱数は日付から決まるので、同じ記録なら何度計算しても同じ いきものが来る（引き直し不可）。
// 画面に出る文は、小学校低学年が読めるよう ひらがな・カタカナだけにする。
(function (root) {
  'use strict';

  const { SPECIES, PLANTS } = typeof module !== 'undefined' && module.exports ? require('./species.js') : root.Species;
  const byId = Object.fromEntries(SPECIES.map(sp => [sp.id, sp]));

  // はみがきした日に来る さかな。レア度ごとに出やすさが違う
  const FISH = {
    common: SPECIES.filter(sp => sp.tier === 'common'),
    rare: SPECIES.filter(sp => sp.tier === 'rare'),
    superRare: SPECIES.filter(sp => sp.tier === 'superRare'),
  };
  const RARITY_LABEL = { common: '', rare: 'めずらしい ', superRare: '‼️ とっても めずらしい ' };
  // 両方できた日は めずらしい さかなが 出やすい
  const WEIGHTS_COMPLETE = { common: 50, rare: 35, superRare: 15 };
  const WEIGHTS_BRUSH_ONLY = { common: 65, rare: 28, superRare: 7 };

  // 両方の れんぞく日数が とどくと 来る、とくべつな おきゃくさん（7・14・30・100日）
  const MILESTONES = SPECIES.filter(sp => sp.tier === 'milestone').sort((x, y) => x.streak - y.streak);

  const ALL_CREATURES = SPECIES;

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

  function daysInMonth(monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }

  function pickFish(weights, rand) {
    const tiers = Object.keys(weights);
    const total = tiers.reduce((n, t) => n + weights[t], 0);
    let r = rand() * total;
    let tier = tiers[tiers.length - 1];
    for (const t of tiers) {
      r -= weights[t];
      if (r < 0) { tier = t; break; }
    }
    const list = FISH[tier];
    return { tier, species: list[Math.floor(rand() * list.length)] };
  }

  // すいそうの中の いち（%）。およぐ場所（上・中・底）で たかさを きめる。日付から決まるので ひらくたびに同じ場所
  const ZONE_Y = { top: [10, 24], mid: [26, 60], bottom: [76, 84] };
  function placement(rand, sp) {
    const [y0, y1] = ZONE_Y[sp.zone] || ZONE_Y.mid;
    const crawler = sp.kind === 'snail';
    const bottom = sp.zone === 'bottom';
    return {
      x: 14 + rand() * 72,
      y: y0 + rand() * (y1 - y0),
      swim: crawler ? 26 + rand() * 12 : bottom ? 10 + rand() * 8 : 6 + rand() * 8 + sp.size * 1.5, // 秒
      delay: -rand() * 10,
      range: crawler ? 3 + rand() * 3 : bottom ? 4 + rand() * 8 : 12 + rand() * 24, // px
    };
  }

  function isRecordDay(day) {
    return !!day && (!!day.brush || !!day.floss);
  }

  function computeAquarium(data, today) {
    const dates = Object.keys(data)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today && isRecordDay(data[d]))
      .sort();

    const state = {
      months: {}, // 'YYYY-MM' → { key, creatures: [...], decos: [...], brushDays }
      discovered: {}, // いきものの id → 最初に来た日
      totalCreatures: 0,
      totalDecos: 0,
      completeStreak: 0,
      days: {}, // 日付 → { lines: [...], arrivals: [...] }
    };

    let prevDate = null;
    dates.forEach(date => {
      const day = data[date];
      const rand = seededRandom(date);
      const complete = !!day.brush && !!day.floss;
      const consecutive = prevDate !== null && prevDate === addDays(date, -1);
      state.completeStreak = complete ? (consecutive ? state.completeStreak + 1 : 1) : 0;

      const monthKey = date.slice(0, 7);
      if (!state.months[monthKey]) state.months[monthKey] = { key: monthKey, creatures: [], decos: [], brushDays: 0 };
      const month = state.months[monthKey];
      const lines = [];
      const arrivals = [];

      const addCreature = (species, extra) => {
        const isNew = !state.discovered[species.id];
        if (isNew) state.discovered[species.id] = date;
        const creature = { id: species.id, name: species.name, tier: extra.tier, date, place: placement(rand, species) };
        month.creatures.push(creature);
        arrivals.push(creature);
        state.totalCreatures++;
        return isNew;
      };

      if (day.brush) {
        month.brushDays++;
        const { tier, species } = pickFish(complete ? WEIGHTS_COMPLETE : WEIGHTS_BRUSH_ONLY, rand);
        const isNew = addCreature(species, { tier });
        lines.push(`${RARITY_LABEL[tier]}${species.name}が すいそうに きたよ！${isNew ? ' 🆕 はじめて！' : ''}`);
      }
      if (day.floss) {
        const plant = PLANTS[Math.floor(rand() * PLANTS.length)];
        month.decos.push({ id: plant.id, name: plant.name, size: plant.size, date, x: 4 + rand() * 92 });
        state.totalDecos++;
        lines.push(`🌿 ${plant.name}を うえたよ！`);
      }
      const milestone = complete && MILESTONES.find(m => m.streak === state.completeStreak);
      if (milestone) {
        const isNew = addCreature(milestone, { tier: 'milestone' });
        lines.push(`🎉 ${milestone.streak}にち れんぞく！ とくべつな おきゃくさん ${milestone.name}が きたよ！${isNew ? ' 🆕' : ''}`);
      }

      state.days[date] = { lines, arrivals };
      prevDate = date;
    });

    // 最後の記録が おとといより前なら れんぞくは とぎれている
    if (prevDate === null || prevDate < addDays(today, -1)) state.completeStreak = 0;

    // 月ごとの まとめ。おわった月で 毎日みがけたら 👑
    const currentMonth = today.slice(0, 7);
    Object.values(state.months).forEach(m => {
      m.finished = m.key < currentMonth;
      m.perfect = m.finished && m.brushDays === daysInMonth(m.key);
    });
    if (!state.months[currentMonth]) {
      state.months[currentMonth] = { key: currentMonth, creatures: [], decos: [], brushDays: 0, finished: false, perfect: false };
    }
    state.currentMonth = state.months[currentMonth];
    state.pastMonths = Object.values(state.months).filter(m => m.finished).sort((a, b) => (a.key < b.key ? 1 : -1));
    state.discoveredCount = Object.keys(state.discovered).length;
    state.discoverableTotal = ALL_CREATURES.length;
    const nextMilestone = MILESTONES.find(m => m.streak > state.completeStreak);
    state.nextMilestone = nextMilestone ? { id: nextMilestone.id, streak: nextMilestone.streak, remaining: nextMilestone.streak - state.completeStreak } : null;
    return state;
  }

  const Aquarium = { FISH, PLANTS, MILESTONES, ALL_CREATURES, byId, seededRandom, addDays, computeAquarium };

  if (typeof module !== 'undefined' && module.exports) module.exports = Aquarium;
  else root.Aquarium = Aquarium;
})(this);
