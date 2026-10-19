// 実行: node --test
const test = require('node:test');
const assert = require('node:assert');
const Aquarium = require('../aquarium.js');

function days(start, n, fn) {
  const data = {};
  for (let i = 0; i < n; i++) data[Aquarium.addDays(start, i)] = fn(i);
  return data;
}

test('はみがきで さかな1ぴき、フロスで かざり1こ', () => {
  const aq = Aquarium.computeAquarium({
    '2026-10-01': { brush: true, floss: true },
    '2026-10-02': { brush: true },
    '2026-10-03': { floss: true },
  }, '2026-10-03');
  assert.strictEqual(aq.currentMonth.creatures.length, 2);
  assert.strictEqual(aq.currentMonth.decos.length, 2);
  assert.strictEqual(aq.totalCreatures, 2);
});

test('同じ記録なら何度計算しても同じ いきものが来る', () => {
  const data = days('2026-01-01', 120, i => ({ brush: true, floss: i % 3 !== 0 }));
  assert.deepStrictEqual(Aquarium.computeAquarium(data, '2026-12-31'), Aquarium.computeAquarium(data, '2026-12-31'));
});

test('未来の日付・メモだけの日は数えない', () => {
  const aq = Aquarium.computeAquarium({
    '2026-10-01': { brush: false, floss: false, memo: 'x' },
    '2026-10-02': { brush: true },
    '2099-01-01': { brush: true, floss: true },
  }, '2026-10-02');
  assert.deepStrictEqual(Object.keys(aq.days), ['2026-10-02']);
});

test('両方の れんぞく 7・14・30日で とくべつな おきゃくさんが来る', () => {
  const aq = Aquarium.computeAquarium(days('2026-01-01', 30, () => ({ brush: true, floss: true })), '2026-01-30');
  const visitors = aq.currentMonth.creatures.filter(c => c.tier === 'milestone').map(c => c.id);
  assert.deepStrictEqual(visitors, ['clownloach', 'glasscat', 'discus']);
});

test('れんぞくが とぎれたら つぎの おきゃくさんまでの日数も もどる', () => {
  const aq = Aquarium.computeAquarium(days('2026-01-01', 5, () => ({ brush: true, floss: true })), '2026-01-10');
  assert.strictEqual(aq.completeStreak, 0);
  assert.strictEqual(aq.nextMilestone.remaining, 7);
});

test('月ごとに すいそうが分かれ、毎日みがいた月は 👑（パーフェクト）', () => {
  const data = days('2026-09-01', 30, () => ({ brush: true }));
  data['2026-08-15'] = { brush: true };
  const aq = Aquarium.computeAquarium(data, '2026-10-05');
  assert.deepStrictEqual(aq.pastMonths.map(m => [m.key, m.perfect]), [['2026-09', true], ['2026-08', false]]);
  assert.strictEqual(aq.currentMonth.key, '2026-10');
  assert.strictEqual(aq.currentMonth.creatures.length, 0);
});

test('両方できる方が めずらしい いきものが 多く来る', () => {
  const count = fn => {
    const aq = Aquarium.computeAquarium(days('2026-01-01', 365, fn), '2026-12-31');
    return Object.values(aq.months).flatMap(m => m.creatures).filter(c => c.tier === 'rare' || c.tier === 'superRare').length;
  };
  assert.ok(count(() => ({ brush: true, floss: true })) > count(() => ({ brush: true })));
});

test('ずかんは 淡水の 34種で、id と 名前が かさならない', () => {
  const { SPECIES } = require('../species.js');
  assert.strictEqual(SPECIES.length, 34);
  assert.strictEqual(new Set(SPECIES.map(s => s.id)).size, 34);
  assert.strictEqual(new Set(SPECIES.map(s => s.name)).size, 34);
  assert.deepStrictEqual(Aquarium.MILESTONES.map(s => s.streak), [7, 14, 30, 100]);
});

test('ぜんぶの さかなと 水草が SVG で かける', () => {
  const FishArt = require('../fishart.js');
  const { SPECIES, PLANTS } = require('../species.js');
  SPECIES.forEach(sp => {
    const svg = FishArt.drawFish(sp, '7');
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/, sp.id);
    assert.doesNotMatch(svg, /NaN|undefined/, sp.id);
  });
  PLANTS.forEach(p => assert.doesNotMatch(FishArt.drawPlant(p.id), /NaN|undefined/, p.id));
  assert.doesNotMatch(FishArt.drawTankBackground('1'), /NaN|undefined/);
});
