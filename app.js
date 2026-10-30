/* ============================================================
   Логика дашборда «Здоровье ИТ-проектов»
   ============================================================ */

// ================== СОСТОЯНИЕ ==================
let rawProjects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));

// ================== УТИЛИТЫ ==================
const $ = (id) => document.getElementById(id);

function parseDate(str) { return str ? new Date(str + 'T00:00:00') : null; }

function calcProjectOverdueMonths(planCloseStr) {
  const plan = parseDate(planCloseStr);
  if (!plan || TODAY <= plan) return 0;
  let months = (TODAY.getFullYear()-plan.getFullYear())*12 + (TODAY.getMonth()-plan.getMonth());
  if (TODAY.getDate() < plan.getDate()) months--;
  return Math.max(0, months);
}

function calcGoalOverdueMonths(planDateStr) {
  const plan = parseDate(planDateStr);
  if (!plan || TODAY <= plan) return 0;
  let months = (TODAY.getFullYear()-plan.getFullYear())*12 + (TODAY.getMonth()-plan.getMonth());
  if (TODAY.getDate() < plan.getDate()) months--;
  return Math.max(0, months);
}

function isGoalOverdue(goal) {
  if (goal.status === 'просрочено') return true;
  if (goal.status === 'выполнено' || goal.status === 'не выполнено') return false;
  const plan = parseDate(goal.planDate);
  return plan && TODAY > plan;
}

function getProjectHealth(project) {
  const planClose = parseDate(project.planClose);
  const overdueMonths = calcProjectOverdueMonths(project.planClose);
  const budgetOverrun = project.factBudget > project.planBudget;

  if (overdueMonths > 0 || budgetOverrun) return { status:'red', label:'🔴 Проблема' };
  if (project.status === 'закрыт') return { status:'closed', label:'⚪ Закрыт' };

  const monthsToClose = planClose ? (planClose.getFullYear()-TODAY.getFullYear())*12 + (planClose.getMonth()-TODAY.getMonth()) : 999;
  const hasDoneGoal = project.goals.some(g => g.status === 'выполнено');
  const hasOverdueGoal = project.goals.some(g => isGoalOverdue(g));
  const factGePlan = project.factBudget >= project.planBudget;

  if (monthsToClose < 3 && !hasDoneGoal && (factGePlan || hasOverdueGoal)) {
    return { status:'yellow', label:'🟡 Внимание' };
  }

  const allGoalsOk = project.goals.every(g => g.status === 'в работе' || g.status === 'выполнено');
  if (overdueMonths === 0 && allGoalsOk && !budgetOverrun) return { status:'green', label:'🟢 В работе' };

  return { status:'green', label:'🟢 В работе' };
}

function buildReasons(project) {
  const reasons = [];
  const overdue = calcProjectOverdueMonths(project.planClose);
  if (overdue > 0) reasons.push(`просрочка закрытия ${overdue} мес`);
  if (project.factBudget > project.planBudget) {
    const over = (project.factBudget - project.planBudget) / 1000000;
    reasons.push(`перерасход ${over.toFixed(1)} млн`);
  }
  project.goals.forEach(g => {
    if (isGoalOverdue(g) && g.status !== 'выполнено' && g.status !== 'не выполнено') {
      const ov = calcGoalOverdueMonths(g.planDate);
      reasons.push(ov > 0 ? `цель "${g.name}" просрочена ${ov} мес` : `цель "${g.name}" просрочена`);
    }
  });
  return reasons;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ================== STATE ==================
let currentDirectionFilter = 'all';
let currentProjectFilter = 'all';
let deepseekKey = localStorage.getItem('deepseek_api_key') || '';

// ================== РЕНДЕР ==================
function populateAllSelects() {
  const allDirections = [...new Set(rawProjects.map(p => p.direction))].sort();
  const allProjects = rawProjects.map(p => p.project);
  const allProjectStatuses = [...new Set(rawProjects.map(p => p.status))];
  const uniqueGoals = [...new Set(rawProjects.flatMap(p => p.goals.map(g => g.name)))].sort();
  const allGoalStatuses = [...new Set(rawProjects.flatMap(p => p.goals.map(g => g.status)))];

  const fill = (sel, items, placeholder) => {
    sel.innerHTML = `<option value="all">${placeholder}</option>` +
      items.map(i => `<option value="${escapeHtml(i)}">${escapeHtml(i)}</option>`).join('');
  };
  fill($('filter-direction'), allDirections, 'Все');
  fill($('filter-project'), allProjects, 'Все');
  fill($('goal-filter-direction'), allDirections, 'Направление: все');
  fill($('goal-filter-project'), allProjects, 'Проект: все');
  fill($('goal-filter-project-status'), allProjectStatuses, 'Статус проекта: все');
  fill($('goal-filter-goal'), uniqueGoals, 'Цель: все');
  fill($('goal-filter-status'), allGoalStatuses, 'Статус цели: все');

  // восстановить ранее выбранные, если возможно
  if ([...$('filter-direction').options].some(o => o.value === currentDirectionFilter)) $('filter-direction').value = currentDirectionFilter;
  else { currentDirectionFilter = 'all'; $('filter-direction').value = 'all'; }
  if ([...$('filter-project').options].some(o => o.value === currentProjectFilter)) $('filter-project').value = currentProjectFilter;
  else { currentProjectFilter = 'all'; $('filter-project').value = 'all'; }
}

function renderDirections() {
  const filtered = rawProjects.filter(p =>
    (currentDirectionFilter === 'all' || p.direction === currentDirectionFilter) &&
    (currentProjectFilter === 'all' || p.project === currentProjectFilter)
  );
  const byDir = {};
  filtered.forEach(p => { (byDir[p.direction] ||= []).push(p); });
  const dirs = Object.keys(byDir).sort();

  if (dirs.length === 0) {
    $('directions-container').innerHTML = `<div class="empty-message">Нет направлений по выбранным фильтрам</div>`;
    return;
  }

  $('directions-container').innerHTML = dirs.map(dir => {
    const projects = byDir[dir];
    const total = projects.length;
    const counts = { red:0, yellow:0, green:0, closed:0 };
    projects.forEach(p => { const h = getProjectHealth(p); counts[h.status]++; });

    // Показываем на диаграмме и в легенде только те категории, где есть хотя бы один проект
    const categories = [
      { key:'red',    color:'--red',    label:'Проблема' },
      { key:'yellow', color:'--yellow', label:'Внимание' },
      { key:'green',  color:'--green',  label:'В работе' },
      { key:'closed', color:'--closed', label:'Закрыт' }
    ];
    const present = categories.filter(c => counts[c.key] > 0);

    let acc = 0, parts = [];
    present.forEach(c => {
      const deg = (counts[c.key]/total)*360;
      parts.push(`var(${c.color}) ${acc}deg ${acc+deg}deg`);
      acc += deg;
    });
    const gradient = parts.length ? `conic-gradient(${parts.join(', ')})` : 'conic-gradient(var(--closed) 0deg 360deg)';

    return `
      <div class="direction-card">
        <div class="direction-header">
          <span class="direction-name">Направление ${escapeHtml(dir)}</span>
          <span class="project-count">${total} проект${total === 1 ? '' : total < 5 ? 'а' : 'ов'}</span>
        </div>
        <div class="donut-container">
          <div class="donut" style="background:${gradient};">
            <div class="donut-inner">${total}</div>
          </div>
        </div>
        <div class="legend">
          ${present.map(c => `<span class="legend-item"><span class="legend-dot" style="background:var(${c.color})"></span>${c.label}<strong class="legend-count">${counts[c.key]}</strong></span>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function renderProjects() {
  const filtered = rawProjects.filter(p =>
    (currentDirectionFilter === 'all' || p.direction === currentDirectionFilter) &&
    (currentProjectFilter === 'all' || p.project === currentProjectFilter)
  );

  if (filtered.length === 0) {
    $('projects-container').innerHTML = `<div class="empty-message">Нет проектов по выбранным фильтрам</div>`;
    return;
  }

  $('projects-container').innerHTML = filtered.map(p => {
    const health = getProjectHealth(p);
    const reasons = buildReasons(p);
    const overdueMonths = calcProjectOverdueMonths(p.planClose);
    const totalGoals = p.goals.length;
    const doneGoals = p.goals.filter(g => g.status === 'выполнено').length;
    const progressPercent = totalGoals > 0 ? Math.round((doneGoals/totalGoals)*100) : 0;
    const planCloseFormatted = p.planClose ? new Date(p.planClose).toLocaleDateString('ru-RU') : '—';
    const planBudgetMln = (p.planBudget/1000000).toFixed(1);
    const factBudgetMln = (p.factBudget/1000000).toFixed(1);
    const fillColor = health.status === 'red' ? 'var(--red)'
                   : health.status === 'yellow' ? 'var(--yellow)'
                   : health.status === 'green' ? 'var(--green)' : 'var(--closed)';

    return `
      <div class="project-card">
        <div class="card-top">
          <span class="project-name">${escapeHtml(p.project)}</span>
          <span class="health-badge ${health.status}">${health.label}</span>
        </div>
        <div class="meta-row">
          <span class="meta-item">📁 <strong>${escapeHtml(p.direction)}</strong></span>
          <span class="meta-item">${p.status === 'открыт' ? '🟢 Открыт' : '⚪ Закрыт'}</span>
          <span class="meta-item">🎯 ${doneGoals}/${totalGoals} целей</span>
        </div>
        <div class="meta-row">
          <span class="meta-item">📅 План: <strong>${planCloseFormatted}</strong></span>
          ${overdueMonths > 0 ? `<span class="meta-item overdue-badge">⚠️ Просрочка: ${overdueMonths} мес</span>` : ''}
        </div>
        <div class="progress-section">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${progressPercent}%; background:${fillColor};"></div>
          </div>
          <div class="progress-label"><span>Прогресс целей</span><span>${progressPercent}%</span></div>
        </div>
        <div class="meta-row">
          <span class="meta-item">💰 Бюджет: <strong>${planBudgetMln} → ${factBudgetMln} млн</strong></span>
          ${p.factBudget > p.planBudget ? `<span class="meta-item overdue-badge">⚠️ Перерасход ${((p.factBudget-p.planBudget)/1000000).toFixed(1)} млн</span>` : ''}
        </div>
        ${reasons.length ? `<div class="reasons">${reasons.map(r => `<span class="reason-chip">${escapeHtml(r)}</span>`).join('')}</div>` : ''}
      </div>`;
  }).join('');
}

function renderGoalsTable() {
  const rows = [];
  rawProjects.forEach(p => p.goals.forEach(g => rows.push({
    direction:p.direction, project:p.project, projectStatus:p.status,
    goalName:g.name, goalStatus:g.status, planDate:g.planDate,
    overdueMonths:calcGoalOverdueMonths(g.planDate)
  })));

  const fDir = $('goal-filter-direction').value;
  const fProj = $('goal-filter-project').value;
  const fProjSt = $('goal-filter-project-status').value;
  const fGoal = $('goal-filter-goal').value;
  const fSt = $('goal-filter-status').value;

  const filtered = rows.filter(r =>
    (fDir === 'all' || r.direction === fDir) &&
    (fProj === 'all' || r.project === fProj) &&
    (fProjSt === 'all' || r.projectStatus === fProjSt) &&
    (fGoal === 'all' || r.goalName === fGoal) &&
    (fSt === 'all' || r.goalStatus === fSt)
  );

  if (!filtered.length) {
    $('goals-tbody').innerHTML = `<tr><td colspan="7" class="empty-message">Нет целей по выбранным фильтрам</td></tr>`;
    return;
  }

  $('goals-tbody').innerHTML = filtered.map(r => {
    const planDateFormatted = r.planDate ? new Date(r.planDate).toLocaleDateString('ru-RU') : '—';
    let cls = '';
    if (r.goalStatus === 'выполнено') cls = 'done';
    else if (r.goalStatus === 'в работе') cls = 'in-progress';
    else if (r.goalStatus === 'просрочено') cls = 'overdue';
    else if (r.goalStatus === 'не выполнено') cls = 'not-done';
    const overdue = r.overdueMonths > 0 ? `<span class="overdue-badge">${r.overdueMonths} мес</span>` : '—';
    return `<tr>
      <td>${escapeHtml(r.direction)}</td>
      <td>${escapeHtml(r.project)}</td>
      <td>${escapeHtml(r.projectStatus)}</td>
      <td>${escapeHtml(r.goalName)}</td>
      <td><span class="goal-status ${cls}">${escapeHtml(r.goalStatus)}</span></td>
      <td>${planDateFormatted}</td>
      <td>${overdue}</td>
    </tr>`;
  }).join('');
}

function renderAll() {
  renderDirections();
  renderProjects();
  renderGoalsTable();
}

// ================== DEEPSEEK API ==================
async function callDeepSeek(messages, { json = false, temperature = 0.2 } = {}) {
  if (!deepseekKey) throw new Error('Не задан API-ключ DeepSeek. Откройте настройки и сохраните ключ.');
  const body = {
    model: 'deepseek-chat',
    messages,
    temperature,
    stream: false
  };
  if (json) body.response_format = { type: 'json_object' };

  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekKey}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    let msg = `HTTP ${resp.status}`;
    try { const j = JSON.parse(text); msg += ' — ' + (j.error?.message || j.message || text); }
    catch { if (text) msg += ' — ' + text.slice(0, 300); }
    throw new Error(msg);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek вернул пустой ответ.');
  return content;
}

// ================== EXCEL → DEEPSEEK ==================
function readExcelRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false, dateNF: 'yyyy-mm-dd' });
        resolve(rows);
      } catch (err) { reject(new Error('Не удалось прочитать Excel: ' + err.message)); }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
    reader.readAsArrayBuffer(file);
  });
}

// Превращаем "сырые" строки Excel (заголовок + данные) в компактный текстовый вид для промпта
function rowsToPromptText(rows) {
  // Ограничим объём, чтобы не упереться в лимит токенов — берём до 400 строк
  const trimmed = rows.slice(0, 400);
  return trimmed.map(r => r.map(c => {
    if (c == null) return '';
    if (c instanceof Date) return c.toISOString().slice(0,10);
    return String(c).replace(/\t/g, ' ').replace(/\n/g, ' ');
  }).join('\t')).join('\n');
}

const DEEPSEEK_SCHEMA_PROMPT = `
Ты — ассистент, который преобразует таблицу Excel в JSON-структуру для дашборда ИТ-проектов.
Тебе на вход подаются строки Excel (разделитель — табуляция), где первая непустая строка — заголовки столбцов, а далее — данные.

Верни ТОЛЬКО валидный JSON-объект следующего вида (без markdown, без пояснений):
{
  "projects": [
{
  "direction": "строка",
  "leader": "строка",
  "project": "строка",
  "status": "открыт" | "закрыт",
  "openDate": "YYYY-MM-DD" | null,
  "planClose": "YYYY-MM-DD" | null,
  "factClose": "YYYY-MM-DD" | null,
  "planBudget": число,
  "factBudget": число,
  "goals": [
    { "name": "строка", "planDate": "YYYY-MM-DD" | null, "status": "выполнено" | "в работе" | "просрочено" | "не выполнено" }
  ]
}
  ]
}

Правила:
- Одна строка проекта может сопровождаться несколькими строками целей. Объединяй их в один объект проекта (goals — массив).
- Если в строке нет названия проекта — это продолжение целей предыдущего проекта.
- Бюджеты бери как числа (если в рублях — оставь как есть; если в млн — тоже оставь как есть, дашборд сам разделит на 1e6 при отображении; приведи к целому числу, если это возможно).
- Статусы приводи к указанным допустимым значениям. Если статус цели "выполнено" → "выполнено", "в работе" → "в работе", "просрочено" → "просрочено", "не выполнено" → "не выполнено".
- Даты — строго YYYY-MM-DD или null.
- direction — направление (например, "А", "Б", "В").
- leader — руководитель направления (ФИО или логин).
- Если чего-то не хватает — ставь null (для дат) или 0 (для чисел).
- Никаких комментариев, только JSON.
`;

async function convertExcelViaDeepSeek(rows) {
  const text = rowsToPromptText(rows);
  const messages = [
    { role: 'system', content: DEEPSEEK_SCHEMA_PROMPT },
    { role: 'user', content: 'Вот строки Excel (табуляция между колонками):\n\n' + text }
  ];
  const content = await callDeepSeek(messages, { json: true, temperature: 0 });
  let parsed;
  try { parsed = JSON.parse(content); }
  catch {
    // На случай, если модель обернула в ```json ... ```
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('DeepSeek вернул не-JSON: ' + content.slice(0, 200));
    parsed = JSON.parse(m[0]);
  }
  if (!parsed.projects || !Array.isArray(parsed.projects)) {
    throw new Error('DeepSeek вернул JSON без массива projects.');
  }
  // Нормализация
  return parsed.projects.map(p => ({
    direction: String(p.direction ?? ''),
    leader: String(p.leader ?? ''),
    project: String(p.project ?? ''),
    status: (p.status === 'закрыт' ? 'закрыт' : 'открыт'),
    openDate: p.openDate ?? null,
    planClose: p.planClose ?? null,
    factClose: p.factClose ?? null,
    planBudget: Number(p.planBudget) || 0,
    factBudget: Number(p.factBudget) || 0,
    goals: Array.isArray(p.goals) ? p.goals.map(g => ({
      name: String(g.name ?? ''),
      planDate: g.planDate ?? null,
      status: ['выполнено','в работе','просрочено','не выполнено'].includes(g.status) ? g.status : 'в работе'
    })) : []
  }));
}

// ================== UI: STATUS LINE ==================
function setStatus(el, type, text, loading = false) {
  el.className = 'status-line show ' + (type || '');
  el.innerHTML = (loading ? '<span class="spinner"></span>' : '') + escapeHtml(text);
}
function hideStatus(el) { el.className = 'status-line'; el.innerHTML = ''; }

// ================== MODAL ==================
const modal = $('settings-modal');
const apiKeyInput = $('api-key');

function openModal() {
  apiKeyInput.value = deepseekKey;
  hideStatus($('key-status'));
  hideStatus($('excel-status'));
  modal.classList.add('open');
}
function closeModal() { modal.classList.remove('open'); }

$('open-settings').addEventListener('click', openModal);
$('close-settings').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// API key
$('save-key').addEventListener('click', () => {
  const v = apiKeyInput.value.trim();
  if (!v) { setStatus($('key-status'), 'error', 'Ключ пустой.'); return; }
  deepseekKey = v;
  localStorage.setItem('deepseek_api_key', v);
  setStatus($('key-status'), 'success', '✅ Ключ сохранён в localStorage.');
});
$('clear-key').addEventListener('click', () => {
  deepseekKey = ''; apiKeyInput.value = '';
  localStorage.removeItem('deepseek_api_key');
  setStatus($('key-status'), 'success', 'Ключ удалён.');
});
$('test-key').addEventListener('click', async () => {
  if (!deepseekKey) { setStatus($('key-status'), 'error', 'Сначала сохраните ключ.'); return; }
  setStatus($('key-status'), 'loading', 'Проверяю ключ…', true);
  try {
    await callDeepSeek([{ role:'user', content:'Ответь одним словом: OK' }], { temperature:0 });
    setStatus($('key-status'), 'success', '✅ Ключ рабочий, DeepSeek отвечает.');
  } catch (e) {
    setStatus($('key-status'), 'error', '❌ ' + e.message);
  }
});

// File upload
const fileDrop = $('file-drop');
const fileInput = $('file-input');

fileDrop.addEventListener('click', () => fileInput.click());
fileDrop.addEventListener('dragover', (e) => { e.preventDefault(); fileDrop.classList.add('dragover'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop', (e) => {
  e.preventDefault(); fileDrop.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
  fileInput.value = '';
});

async function handleFile(file) {
  const statusEl = $('excel-status');
  if (!deepseekKey) { setStatus(statusEl, 'error', '❌ Сначала сохраните API-ключ DeepSeek.'); return; }
  if (!/\.(xlsx|xls)$/i.test(file.name)) { setStatus(statusEl, 'error', '❌ Поддерживаются только .xlsx / .xls'); return; }

  setStatus(statusEl, 'loading', `Читаю «${file.name}»…`, true);
  try {
    const rows = await readExcelRows(file);
    if (!rows.length) throw new Error('Файл пустой.');

    setStatus(statusEl, 'loading', 'Отправляю строки в DeepSeek для структурирования…', true);
    const projects = await convertExcelViaDeepSeek(rows);

    if (!projects.length) throw new Error('DeepSeek не вернул ни одного проекта.');

    rawProjects = projects;
    // сброс фильтров
    currentDirectionFilter = 'all';
    currentProjectFilter = 'all';
    populateAllSelects();
    renderAll();

    setStatus(statusEl, 'success', `✅ Готово: обновлено проектов — ${projects.length}.`);
  } catch (e) {
    console.error(e);
    setStatus(statusEl, 'error', '❌ ' + e.message);
  }
}

// Chat
const chatLog = $('chat-log');
const chatInput = $('chat-input');

function pushChat(role, text) {
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

$('clear-chat').addEventListener('click', () => { chatLog.innerHTML = ''; });

$('ask-deepseek').addEventListener('click', async () => {
  const q = chatInput.value.trim();
  if (!q) return;
  if (!deepseekKey) { pushChat('system', 'Сначала сохраните API-ключ DeepSeek в настройках.'); return; }
  pushChat('user', q);
  chatInput.value = '';
  const thinking = pushChat('assistant', '…думаю');
  try {
    const dataSummary = JSON.stringify(rawProjects, null, 2);
    const messages = [
      { role: 'system', content: 'Ты — аналитик ИТ-портфеля. Отвечай кратко и по делу на русском языке. Учитывай сегодняшнюю дату ' + TODAY.toISOString().slice(0,10) + '. Вот текущие данные дашборда в JSON:\n' + dataSummary },
      { role: 'user', content: q }
    ];
    const answer = await callDeepSeek(messages, { temperature: 0.3 });
    thinking.textContent = answer;
  } catch (e) {
    thinking.textContent = '❌ Ошибка: ' + e.message;
  }
  chatLog.scrollTop = chatLog.scrollHeight;
});

// ================== ФИЛЬТРЫ (главные) ==================
$('filter-direction').addEventListener('change', (e) => {
  currentDirectionFilter = e.target.value;
  if (currentProjectFilter !== 'all') {
    const proj = rawProjects.find(p => p.project === currentProjectFilter);
    if (proj && currentDirectionFilter !== 'all' && proj.direction !== currentDirectionFilter) {
      currentProjectFilter = 'all'; $('filter-project').value = 'all';
    }
  }
  renderAll();
});
$('filter-project').addEventListener('change', (e) => {
  currentProjectFilter = e.target.value;
  if (currentProjectFilter !== 'all') {
    const proj = rawProjects.find(p => p.project === currentProjectFilter);
    if (proj && currentDirectionFilter !== 'all' && proj.direction !== currentDirectionFilter) {
      currentDirectionFilter = 'all'; $('filter-direction').value = 'all';
    }
  }
  renderAll();
});

// Фильтры таблицы целей
['goal-filter-direction','goal-filter-project','goal-filter-project-status','goal-filter-goal','goal-filter-status']
  .forEach(id => $(id).addEventListener('change', renderGoalsTable));

// ================== СТАРТ ==================
populateAllSelects();
renderAll();
