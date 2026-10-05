// 実行: node --test
const test = require('node:test');
const assert = require('node:assert');
const Game = require('../game.js');

function days(start, n, fn) {
  const data = {};
  for (let i = 0; i < n; i++) data[Game.addDays(start, i)] = fn(i);
  return data;
}

test('レベル曲線: Lv2は初日の30経験値で到達し、累計経験値は単調増加', () => {
  assert.strictEqual(Game.levelFromXp(0), 1);
  assert.strictEqual(Game.levelFromXp(30), 2);
  for (let l = 1; l < Game.MAX_LEVEL; l++) assert.ok(Game.xpForLevel(l + 1) > Game.xpForLevel(l));
  assert.strictEqual(Game.levelFromXp(10 ** 9), Game.MAX_LEVEL);
});

test('経験値: 歯磨き10・フロス15・両方でコンボ+5', () => {
  const g = Game.computeGame({ '2026-01-01': { brush: true, floss: true }, '2026-01-02': { brush: true } }, '2026-01-02');
  assert.strictEqual(g.xp, 30 + 10);
});

test('同じ記録なら何度計算しても同じ結果（引き直し不可）', () => {
  const data = days('2026-01-01', 100, i => ({ brush: true, floss: i % 3 !== 0 }));
  assert.deepStrictEqual(Game.computeGame(data, '2026-12-31'), Game.computeGame(data, '2026-12-31'));
});

test('未来の日付・記録なしの日・メモだけの日は冒険に数えない', () => {
  const g = Game.computeGame({
    '2026-01-01': { brush: false, floss: false, memo: 'x' },
    '2026-01-02': { brush: true },
    '2099-01-01': { brush: true, floss: true },
  }, '2026-01-02');
  assert.deepStrictEqual(Object.keys(g.days), ['2026-01-02']);
});

test('ボスは負けるたびに弱り、毎日続ければ最大4連敗以内で倒せる', () => {
  const data = days('2026-01-01', 730, () => ({ brush: true, floss: true }));
  const g = Game.computeGame(data, '2027-12-31');
  let streak = 0, max = 0;
  Object.keys(g.days).sort().forEach(d => {
    const b = g.days[d].battle;
    if (!b.isBoss) return;
    streak = b.result === 'win' ? 0 : streak + 1;
    max = Math.max(max, streak);
  });
  assert.ok(max <= 4, `最大連敗 ${max}`);
  assert.ok(g.loop >= 1, '2年続ければ魔王を倒している');
});

test('フロスをする方が早く強くなる', () => {
  const both = Game.computeGame(days('2026-01-01', 200, () => ({ brush: true, floss: true })), '2026-12-31');
  const brushOnly = Game.computeGame(days('2026-01-01', 200, () => ({ brush: true })), '2026-12-31');
  assert.ok(both.level > brushOnly.level);
  assert.ok(both.bossWins > brushOnly.bossWins);
});
