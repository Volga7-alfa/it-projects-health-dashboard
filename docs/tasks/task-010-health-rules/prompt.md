# Промпт для ИИ — TASK-010 «Настраиваемые правила светофора»

> Приложи `app.js`, `data.js`, `Дашборд_5.html`, `styles.css` и `payload.json`.

---

## Контекст

Сейчас `getProjectHealth(project)` в `app.js` использует жёстко зашитые правила:

```js
const overdueMonths = calcProjectOverdueMonths(project.planClose);
const budgetOverrun = project.factBudget > project.planBudget;

if (overdueMonths > 0 || budgetOverrun) return { status:'red', label:'🔴 Проблема' };
if (project.status === 'закрыт') return { status:'closed', label:'⚪ Закрыт' };

const monthsToClose = ...;
const hasDoneGoal = ...;
const hasOverdueGoal = ...;
const factGePlan = ...;

if (monthsToClose < 3 && !hasDoneGoal && (factGePlan || hasOverdueGoal)) {
  return { status:'yellow', label:'🟡 Внимание' };
}
return { status:'green', label:'🟢 В работе' };
```

Нужно сделать пороги настраиваемыми и сохраняемыми.

## Задача

Добавить модель правил, экран настроек, предпросмотр изменений и объяснение статуса.

## Требования

### 1. Модель

```json
{
  "overdueMonthsRed": 1,
  "budgetOverrunPercentRed": 0,
  "monthsToCloseYellow": 3,
  "minGoalProgressYellow": 0,
  "goalOverdueCountYellow": 0,
  "closedWithOverrunRed": true
}
```

- Все числа — неотрицательные.
- `budgetOverrunPercentRed` — допустимый перерасход в процентах (0 = любой перерасход красный).
- `monthsToCloseYellow` — порог приближения закрытия.
- `minGoalProgressYellow` — минимальный прогресс целей, ниже которого включается жёлтый.
- `goalOverdueCountYellow` — количество просроченных целей для жёлтого.
- `closedWithOverrunRed` — считать ли перерасход у закрытого проекта красным.

### 2. Функции

Создать `healthRules.js`:

- `DEFAULT_HEALTH_RULES`;
- `PRESETS` — `strict`, `standard`, `soft`;
- `normalizeRules(input)`;
- `validateRules(rules)` → массив ошибок;
- `explainHealth(project, rules, today)` → `{ status, label, reasons }`.

Изменить `getProjectHealth(project, rules = DEFAULT_HEALTH_RULES, today = TODAY)`.
Вернуть `reasons` с человеческими объяснениями.

Порядок:

1. если `closedWithOverrunRed` и проект закрыт, но перерасход выше порога → red;
2. просрочка > `overdueMonthsRed` → red;
3. перерасход > `budgetOverrunPercentRed` → red;
4. закрытый проект → closed;
5. скоро закрытие + прогресс ниже порога + (перерасход или просроченные цели) → yellow;
6. иначе green.

Проверь, что порядок не ломает текущее поведение при стандартных правилах.

### 3. UI

Экран «Правила светофора» в модальном окне настроек:

- поля для каждого параметра;
- подсказки с единицами измерения;
- три кнопки-пресета;
- блок предпросмотра: «Красных: 2 → 3, жёлтых: 1 → 1, зелёных: 5 → 4»;
- кнопки «Сохранить», «Сбросить», «Отмена»;
- валидация и понятные ошибки;
- сохранение в `localStorage` или в состояние из task-003;
- миграция старых данных без правил.

### 4. Объяснение статуса

- В карточке проекта показывать причины, включая сработавшее правило:
  «Красный: перерасход 12% (порог 10%)».
- В таблице целей — без изменений.
- Не дублировать причины, если их несколько.

## Ограничения

- Без фреймворков и сборки.
- Не ломать существующие карточки, фильтры, импорт и чат.
- Не менять стандартное поведение при стандартных правилах.
- Все строки экранировать.
- Стили — в духе дашборда, светлая/тёмная темы.

## Критерии приёмки

- [ ] Все параметры доступны в UI.
- [ ] Есть пресеты и сброс.
- [ ] Предпросмотр показывает изменение статусов.
- [ ] Правила сохраняются и восстанавливаются.
- [ ] `getProjectHealth` использует правила.
- [ ] В карточке видно, какое правило сработало.
- [ ] Некорректные значения не сохраняются.
- [ ] Старые данные мигрируют.
- [ ] Стандартные правила дают прежние статусы.
- [ ] Есть тесты на границы.

## Формат ответа

1. Список изменённых файлов.
2. `healthRules.js` с полным кодом.
3. Патчи для `app.js`, HTML, CSS.
4. Примеры правил и пресетов.
5. Чек-лист проверки, включая сравнение со старым поведением.
6. Открытые вопросы по правилам для разных направлений.
