// 歯磨き記録アプリ（localStorageのみで完結）
const STORAGE_KEY = 'hamigakiLog';
const SLOTS = [
  { key: 'brush', label: '歯磨き', emoji: '🪥' },
  { key: 'floss', label: 'フロス', emoji: '🧵' },
];
const HISTORY_DAYS = 14;
const MEMO_MAX_LENGTH = 30;

let selectedDate = null; // 表示中の日付（YYYY-MM-DD）。日を跨いでも表示中の日に記録される
let renderedToday = null;

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function hasAnyRecord(day) {
  return !!day && (SLOTS.some(s => day[s.key]) || !!day.memo);
}

// 今日 or 昨日から遡って、指定した項目(brush/floss)を記録した日が連続している日数
function computeStreak(data, key) {
  let streak = 0;
  const doneOn = offset => !!(data[todayStr(offset)] && data[todayStr(offset)][key]);
  let offset = doneOn(0) ? 0 : -1;
  if (offset === -1 && !doneOn(-1)) return 0;
  while (doneOn(offset)) {
    streak++;
    offset--;
  }
  return streak;
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = '日月火水木金土'[new Date(y, m - 1, d).getDay()]; // UTC解釈を避けるためローカル日付で生成
  return `${m}/${d}(${dow})`;
}

function render() {
  const data = loadData();
  const today = todayStr(0);
  renderedToday = today;
  const isToday = selectedDate === today;
  const selectedData = data[selectedDate] || {};

  const dateLabel = document.getElementById('dateLabel');
  dateLabel.textContent = isToday ? `きょう ${formatDateLabel(selectedDate)}` : formatDateLabel(selectedDate);
  dateLabel.classList.toggle('is-today', isToday);
  document.getElementById('nextDay').disabled = selectedDate >= today;
  document.getElementById('todayLink').style.visibility = isToday ? 'hidden' : 'visible';

  // フロスは2日に1回ペースでOKなので、今日・昨日・一昨日すべてやっていない時だけ警告
  // （記録が1件もない初回起動時は出さない）
  const warningEl = document.getElementById('warning');
  const flossedOn = offset => !!(data[todayStr(offset)] && data[todayStr(offset)].floss);
  const hasPastRecord = Object.keys(data).some(d => d < today && hasAnyRecord(data[d]));
  if (isToday && hasPastRecord && !flossedOn(0) && !flossedOn(-1) && !flossedOn(-2)) {
    warningEl.textContent = '🥺 きのうも おとといも フロスを してないよ… きょうは やってみよう！';
    warningEl.style.display = 'block';
  } else {
    warningEl.style.display = 'none';
  }

  const brushStreak = computeStreak(data, 'brush');
  const flossStreak = computeStreak(data, 'floss');
  document.getElementById('streakBrush').textContent = brushStreak > 0 ? `🪥 ${brushStreak}にち れんぞく` : '🪥 まずは 1かい！';
  document.getElementById('streakFloss').textContent = flossStreak > 0 ? `🧵 ${flossStreak}にち れんぞく` : '🧵 まずは 1かい！';

  document.querySelectorAll('.slot-btn').forEach(btn => {
    const slot = btn.dataset.slot;
    const done = !!selectedData[slot];
    btn.classList.toggle('done', done);
    btn.querySelector('.slot-status').textContent = done ? '✔ できた！' : '◯ まだ';
  });

  const allDone = SLOTS.every(s => selectedData[s.key]);
  document.getElementById('complete').textContent = allDone ? '🎉 コンプリート！' : '';

  const memoInput = document.getElementById('memoInput');
  memoInput.value = selectedData.memo || '';
  document.getElementById('memoCount').textContent = `${memoInput.value.length}/${MEMO_MAX_LENGTH}`;

  const historyEl = document.getElementById('history');
  historyEl.innerHTML = '';
  let rendered = 0;
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const dateStr = todayStr(-i);
    const day = data[dateStr];
    if (dateStr !== today && !hasAnyRecord(day)) continue; // 記録がない日は履歴から省略（今日は常に表示）
    const li = document.createElement('li');
    const dateSpan = document.createElement('span');
    dateSpan.className = 'date' + (dateStr === today ? ' today' : '');
    dateSpan.textContent = formatDateLabel(dateStr);
    const memoSpan = document.createElement('span');
    memoSpan.className = 'memo';
    memoSpan.textContent = (day && day.memo) || '';
    if (day && day.memo) memoSpan.title = day.memo;
    const marksSpan = document.createElement('span');
    marksSpan.className = 'marks';
    marksSpan.innerHTML = SLOTS.map(s => `<span class="${day && day[s.key] ? 'on' : ''}">${s.emoji}</span>`).join('');
    li.appendChild(dateSpan);
    li.appendChild(memoSpan);
    li.appendChild(marksSpan);
    historyEl.appendChild(li);
    rendered++;
  }
  if (rendered === 0) {
    historyEl.innerHTML = '<div id="empty">まだ きろくが ないよ</div>';
  }

  renderGame(data, today);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderGame(data, today) {
  const game = Game.computeGame(data, today);
  const equippedItem = key => {
    const slot = Game.EQUIP_SLOTS.find(s => s.key === key);
    return game.equipped[key] >= 0 ? slot.items[game.equipped[key]] : null;
  };

  // ヒーロー：つけている きせかえを 絵文字で まわりに ならべる
  const avatarParts = { avHat: 'shield', avHand: 'weapon', avBody: 'armor', avCharm: 'accessory' };
  Object.keys(avatarParts).forEach(id => {
    const it = equippedItem(avatarParts[id]);
    document.getElementById(id).textContent = it ? it.emoji : '';
  });
  document.getElementById('heroName').textContent = game.heroName;
  document.getElementById('heroLevel').textContent = `レベル ${game.level}`;
  document.getElementById('heroPower').textContent = `💪 パワー ${game.power}`;
  document.getElementById('xpBar').style.width = `${Math.round(game.xpProgress * 100)}%`;
  document.getElementById('xpNext').textContent =
    game.level >= Game.MAX_LEVEL ? 'さいこう レベル！' : `つぎの レベルまで あと ${game.xpToNext}`;

  const equipEl = document.getElementById('heroEquip');
  equipEl.innerHTML = '';
  Game.EQUIP_SLOTS.forEach(slot => {
    const it = equippedItem(slot.key);
    equipEl.appendChild(el('span', 'equip-chip' + (it ? '' : ' empty'), it ? `${it.emoji} ${it.name}` : `${slot.label}：まだ ない`));
  });

  // エリアと ボスまでの すすみぐあい（ドットで みせる）
  const area = game.area;
  const loopLabel = game.loop > 0 ? `（${game.loop + 1}しゅうめ）` : '';
  document.getElementById('areaName').textContent = `📍 ${area.name}${loopLabel}`;
  const dotsEl = document.getElementById('areaDots');
  dotsEl.innerHTML = '';
  for (let i = 0; i < area.kills; i++) dotsEl.appendChild(el('span', 'dot' + (i < game.kills ? ' on' : '')));
  const bossReady = game.kills >= area.kills;
  dotsEl.appendChild(el('span', 'dot-boss' + (bossReady ? ' on' : ''), area.boss.emoji));
  document.getElementById('areaHint').textContent = bossReady
    ? `ボスの ${area.boss.name}と しょうぶ ちゅう！`
    : `あと ${area.kills - game.kills}ひき ピカピカに すると ボスが でてくるよ`;

  const logEl = document.getElementById('battleLogBody');
  logEl.innerHTML = '';
  const day = game.days[selectedDate];
  const lines = day ? day.lines
    : selectedDate === today ? ['はみがきを すると ぼうけんが はじまるよ！']
    : ['この日は ぼうけんに いかなかったよ。'];
  lines.forEach(text => logEl.appendChild(el('p', null, text)));

  // きせかえ ずかん
  document.getElementById('zukanCount').textContent = `${game.collectionCount}/${game.collectionTotal}`;
  const zukanEl = document.getElementById('zukanList');
  zukanEl.innerHTML = '';
  Game.EQUIP_SLOTS.forEach(slot => {
    zukanEl.appendChild(el('div', 'zukan-head', slot.label));
    const grid = el('div', 'zukan-grid');
    slot.items.forEach((it, tier) => {
      const owned = !!game.collection[`${slot.key}:${tier}`];
      const cell = el('div', 'zukan-cell' + (owned ? ' owned' : '') + (game.equipped[slot.key] === tier ? ' equipped' : ''));
      cell.appendChild(el('span', 'zukan-emoji', owned ? it.emoji : '？'));
      cell.appendChild(el('span', 'zukan-name', owned ? it.name : '？？？'));
      grid.appendChild(cell);
    });
    zukanEl.appendChild(grid);
  });

  // なかま ずかん
  document.getElementById('friendsCount').textContent = `${game.friendsCount}/${game.friendsTotal}`;
  const friendsEl = document.getElementById('friendsList');
  friendsEl.innerHTML = '';
  Game.AREAS.forEach(a => {
    friendsEl.appendChild(el('div', 'zukan-head', a.name));
    const grid = el('div', 'zukan-grid');
    a.monsters.concat([a.boss]).forEach(m => {
      const met = !!game.friends[m.name];
      const cell = el('div', 'zukan-cell' + (met ? ' owned' : '') + (m === a.boss ? ' boss' : ''));
      cell.appendChild(el('span', 'zukan-emoji', met ? m.emoji : '？'));
      cell.appendChild(el('span', 'zukan-name', met ? m.name : '？？？'));
      grid.appendChild(cell);
    });
    friendsEl.appendChild(grid);
  });

  return game;
}

// 記録をつけたときに、その日に起きたこと（レベルアップ・たからばこ・戦闘）をポップアップで見せる
let popupTimer = null;
function showAdventurePopup(lines) {
  const popup = document.getElementById('advPopup');
  popup.innerHTML = '';
  lines.forEach(text => popup.appendChild(el('p', null, text)));
  popup.classList.add('open');
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => popup.classList.remove('open'), 6000);
}

function toggleSlot(slot) {
  const data = loadData();
  if (!data[selectedDate]) data[selectedDate] = {};
  const turnedOn = !data[selectedDate][slot];
  data[selectedDate][slot] = turnedOn;
  saveData(data);
  render();
  if (turnedOn) {
    const day = Game.computeGame(data, todayStr(0)).days[selectedDate];
    if (day) showAdventurePopup(day.lines);
  }
}

function saveMemo(text) {
  const data = loadData();
  const memo = text.slice(0, MEMO_MAX_LENGTH);
  if (!data[selectedDate]) data[selectedDate] = {};
  data[selectedDate].memo = memo;
  saveData(data);
  document.getElementById('memoCount').textContent = `${memo.length}/${MEMO_MAX_LENGTH}`;
}

function csvEscape(value) {
  const str = String(value == null ? '' : value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function exportCsv() {
  const data = loadData();
  const dates = Object.keys(data).sort();
  const rows = [['日付', 'はみがき', 'フロス', 'メモ']];
  dates.forEach(dateStr => {
    const day = data[dateStr];
    if (!hasAnyRecord(day)) return;
    rows.push([dateStr, day.brush ? '○' : '', day.floss ? '○' : '', day.memo || '']);
  });
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
  const BOM = String.fromCharCode(0xFEFF);
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hamigaki-kiroku_${todayStr(0)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* ignore, \n終端でまとめて処理 */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Excelで保存し直すと 2026/9/26 のような形式になるため YYYY-MM-DD に揃える
function normalizeDate(value) {
  const m = (value || '').trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

// ○ 以外に、Excel等で置き換わりがちな 〇 ◯ 1 TRUE も「できた」とみなす
function isDoneMark(value) {
  return ['○', '〇', '◯', '1', 'true'].includes((value || '').trim().toLowerCase());
}

function csvToRecords(rows) {
  const records = {};
  let skipped = 0;
  const start = rows.length && normalizeDate(rows[0][0]) ? 0 : 1;
  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length || row.every(v => !v.trim())) continue;
    const dateStr = normalizeDate(row[0]);
    if (!dateStr) { skipped++; continue; }
    records[dateStr] = {
      brush: isDoneMark(row[1]),
      floss: isDoneMark(row[2]),
      memo: (row[3] || '').slice(0, MEMO_MAX_LENGTH),
    };
  }
  return { records, skipped };
}

let pendingImportRecords = null;

function openImportModal(count, skipped) {
  document.getElementById('modalSummary').textContent =
    `${count}日分の記録が見つかりました。` + (skipped ? `（読めなかった行：${skipped}行）` : '');
  document.getElementById('modalOverlay').classList.add('open');
}

function closeImportModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  pendingImportRecords = null;
  document.getElementById('importFile').value = '';
}

function applyImport(mode) {
  if (!pendingImportRecords) return;
  let data;
  if (mode === 'replace') {
    data = pendingImportRecords;
  } else {
    data = loadData();
    Object.keys(pendingImportRecords).forEach(dateStr => {
      data[dateStr] = pendingImportRecords[dateStr];
    });
  }
  saveData(data);
  closeImportModal();
  render();
  alert('取り込みが完了しました！');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.slot-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleSlot(btn.dataset.slot));
  });
  document.getElementById('prevDay').addEventListener('click', () => {
    selectedDate = Game.addDays(selectedDate, -1);
    render();
  });
  document.getElementById('nextDay').addEventListener('click', () => {
    if (selectedDate < todayStr(0)) {
      selectedDate = Game.addDays(selectedDate, 1);
      render();
    }
  });
  document.getElementById('gotoToday').addEventListener('click', () => {
    selectedDate = todayStr(0);
    render();
  });
  document.getElementById('advPopup').addEventListener('click', e => e.currentTarget.classList.remove('open'));
  // 開きっぱなしで日付が変わった場合、「今日」を見ていたなら新しい今日に追従する
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (selectedDate === renderedToday) selectedDate = todayStr(0);
    render();
  });
  document.getElementById('memoInput').addEventListener('input', e => {
    saveMemo(e.target.value);
  });
  document.getElementById('exportCsv').addEventListener('click', exportCsv);

  const importFile = document.getElementById('importFile');
  document.getElementById('importCsv').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    // Excelで保存し直したCSVは Shift_JIS になることがあるため、UTF-8で文字化けしたら読み直す
    const read = encoding => {
      const reader = new FileReader();
      reader.onload = () => {
        let text = String(reader.result);
        if (encoding === 'utf-8' && text.includes('\uFFFD')) {
          read('shift_jis');
          return;
        }
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const { records, skipped } = csvToRecords(parseCsv(text));
        const count = Object.keys(records).length;
        if (count === 0) {
          alert('読み込めるデータが見つかりませんでした。エクスポートしたCSVファイルを選んでください。');
          importFile.value = '';
          return;
        }
        pendingImportRecords = records;
        openImportModal(count, skipped);
      };
      reader.readAsText(file, encoding);
    };
    read('utf-8');
  });
  document.getElementById('modalReplace').addEventListener('click', () => applyImport('replace'));
  document.getElementById('modalMerge').addEventListener('click', () => applyImport('merge'));
  document.getElementById('modalCancel').addEventListener('click', closeImportModal);

  selectedDate = todayStr(0);
  render();
});
