// 歯磨き記録アプリ（localStorageのみで完結）
const STORAGE_KEY = 'hamigakiLog';
const SLOTS = [
  { key: 'brush', label: '歯磨き', emoji: '🪥' },
  { key: 'floss', label: 'フロス', emoji: '🧵' },
];
const HISTORY_DAYS = 14;
const MEMO_MAX_LENGTH = 30;

let selectedOffset = 0; // 0 = 今日、負の値 = 過去の日

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
  const [, m, d] = dateStr.split('-');
  const dow = '日月火水木金土'[new Date(dateStr).getDay()];
  return `${parseInt(m, 10)}/${parseInt(d, 10)}(${dow})`;
}

function render() {
  const data = loadData();
  const today = todayStr(0);
  const selectedDate = todayStr(selectedOffset);
  const selectedData = data[selectedDate] || {};

  const dateLabel = document.getElementById('dateLabel');
  dateLabel.textContent = selectedOffset === 0 ? `今日 ${formatDateLabel(selectedDate)}` : formatDateLabel(selectedDate);
  dateLabel.classList.toggle('is-today', selectedOffset === 0);
  document.getElementById('nextDay').disabled = selectedOffset >= 0;
  document.getElementById('todayLink').style.visibility = selectedOffset === 0 ? 'hidden' : 'visible';

  // フロスは2日に1回ペースでOKなので、2日連続でやっていない時だけ警告
  const warningEl = document.getElementById('warning');
  const flossedYesterday = !!(data[todayStr(-1)] && data[todayStr(-1)].floss);
  const flossedTwoDaysAgo = !!(data[todayStr(-2)] && data[todayStr(-2)].floss);
  if (selectedOffset === 0 && !flossedYesterday && !flossedTwoDaysAgo) {
    warningEl.textContent = '⚠️ デンタルフロスが2日間ないみたい…！ 🥺 そろそろやってみよう！';
    warningEl.style.display = 'block';
  } else {
    warningEl.style.display = 'none';
  }

  const brushStreak = computeStreak(data, 'brush');
  const flossStreak = computeStreak(data, 'floss');
  document.getElementById('streakBrush').textContent = brushStreak > 0 ? `🪥 ${brushStreak}日連続！` : '🪥 まずは1回！';
  document.getElementById('streakFloss').textContent = flossStreak > 0 ? `🧵 ${flossStreak}日連続！` : '🧵 まずは1回！';

  document.querySelectorAll('.slot-btn').forEach(btn => {
    const slot = btn.dataset.slot;
    btn.classList.toggle('done', !!selectedData[slot]);
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
    historyEl.innerHTML = '<div id="empty">まだ記録がありません</div>';
  }
}

function toggleSlot(slot) {
  const data = loadData();
  const selectedDate = todayStr(selectedOffset);
  if (!data[selectedDate]) data[selectedDate] = {};
  data[selectedDate][slot] = !data[selectedDate][slot];
  saveData(data);
  render();
}

function saveMemo(text) {
  const data = loadData();
  const selectedDate = todayStr(selectedOffset);
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

function csvToRecords(rows) {
  const records = {};
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const start = rows.length && isDate((rows[0][0] || '').trim()) ? 0 : 1;
  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const dateStr = (row[0] || '').trim();
    if (!isDate(dateStr)) continue;
    records[dateStr] = {
      brush: (row[1] || '').trim() === '○',
      floss: (row[2] || '').trim() === '○',
      memo: (row[3] || '').slice(0, MEMO_MAX_LENGTH),
    };
  }
  return records;
}

let pendingImportRecords = null;

function openImportModal() {
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
    selectedOffset--;
    render();
  });
  document.getElementById('nextDay').addEventListener('click', () => {
    if (selectedOffset < 0) {
      selectedOffset++;
      render();
    }
  });
  document.getElementById('gotoToday').addEventListener('click', () => {
    selectedOffset = 0;
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
    reader.onload = () => {
      let text = String(reader.result);
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const records = csvToRecords(parseCsv(text));
      if (Object.keys(records).length === 0) {
        alert('読み込めるデータが見つかりませんでした。エクスポートしたCSVファイルを選んでください。');
        importFile.value = '';
        return;
      }
      pendingImportRecords = records;
      openImportModal();
    };
    reader.readAsText(file);
  });
  document.getElementById('modalReplace').addEventListener('click', () => applyImport('replace'));
  document.getElementById('modalMerge').addEventListener('click', () => applyImport('merge'));
  document.getElementById('modalCancel').addEventListener('click', closeImportModal);

  render();
});
