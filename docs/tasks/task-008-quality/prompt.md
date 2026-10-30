# Промпт для ИИ — TASK-008 «Тесты, модульная структура и CI»

> Приложи `app.js`, `data.js`, `Дашборд_5.html`, `styles.css` и `payload.json`.

---

## Контекст

Проект — статический дашборд на чистом HTML/CSS/JS без сборки. `app.js` содержит
и расчёты, и рендер, и работу с API. Дашборд открывается как локальный файл
`Дашборд_5.html`, поэтому нельзя ломать загрузку скриптов через `file://`.

Ключевые функции в `app.js`:
- `calcProjectOverdueMonths(planCloseStr)`
- `calcGoalOverdueMonths(planDateStr)`
- `isGoalOverdue(goal)`
- `getProjectHealth(project)`
- `buildReasons(project)`
- фильтрация в `renderDirections`, `renderProjects`, `renderGoalsTable`

## Задача

Вынести чистую логику в отдельные файлы, покрыть её тестами, добавить CI
и сделать ошибки API/Excel понятными пользователю.

## Требования

### 1. Модули

Создать:

- `health.js` — расчёты просрочки, здоровья, причин;
- `filters.js` — фильтрация проектов и строк целей;
- `errors.js` — преобразование ошибок в человеческий текст;
- `tests/health.test.js`, `tests/filters.test.js`, `tests/errors.test.js`.

**Важно:** сохранить совместимость с `file://`. Не использовать `import`/`export`
в браузерных файлах. Применить UMD-обёртку:

```js
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Health = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // функции
  return { calcProjectOverdueMonths, calcGoalOverdueMonths, isGoalOverdue, getProjectHealth, buildReasons };
});
```

- В `Дашборд_5.html` подключить `health.js`, `filters.js`, `errors.js` **до** `app.js`.
- В `app.js` использовать глобальные `Health`, `Filters`, `Errors` и удалить дубли.

### 2. Параметризация даты

- `getProjectHealth(project, today = TODAY)` — чтобы тесты не зависели от текущей даты.
- `buildReasons(project, today = TODAY)`.
- `calcProjectOverdueMonths(planCloseStr, today = TODAY)`.
- `calcGoalOverdueMonths(planDateStr, today = TODAY)`.

### 3. Тесты

Использовать `node:test` и `node:assert/strict`, без внешних зависимостей.

Покрыть:

- просрочку: прошлое, сегодня, будущее, граница дня, `null`, невалидная дата;
- здоровье: red из-за просрочки, red из-за перерасхода, closed, yellow
  (скоро закрытие + нет выполненных целей), green;
- причины: просрочка, перерасход, просроченные цели, пустой массив;
- фильтры: направление, проект, комбинация, пустой результат;
- ошибки: 401, 402, 429, 5xx, network, не-JSON.

### 4. Ошибки

Создать `errors.js` с функцией `toUserMessage(error, context)`:

| Ситуация | Сообщение |
|---|---|
| Нет ключа | «Сначала сохраните API-ключ DeepSeek в настройках.» |
| 401 | «Ключ не подошёл. Проверьте его в настройках DeepSeek.» |
| 402 | «На балансе DeepSeek недостаточно средств.» |
| 429 | «Слишком много запросов. Подождите минуту и попробуйте снова.» |
| 5xx | «Сервис DeepSeek временно недоступен. Попробуйте позже.» |
| Network | «Нет соединения. Проверьте интернет и повторите.» |
| Excel | «Не удалось прочитать файл. Убедитесь, что это .xlsx или .xls.» |
| Пустой файл | «Файл пустой. Загрузите Excel с проектами и целями.» |
| Не-JSON | «AI вернул неожиданный ответ. Попробуйте ещё раз.» |

### 5. package.json и CI

Создать `package.json`:

```json
{
  "private": true,
  "scripts": {
    "test": "node --test tests/",
    "check": "node --check app.js && node --check health.js && node --check filters.js && node --check errors.js"
  }
}
```

Создать `.github/workflows/ci.yml`:

- триггеры: `push`, `pull_request`;
- Node 20;
- шаги: checkout, setup-node, `npm test`, `npm run check`.

### 6. Документация

- Обновить `README` или `TASK.md`: как запустить тесты.
- Добавить запись в `CHANGELOG.md`.
- Указать, что тесты не требуют установки зависимостей.

## Ограничения

- Не добавлять фреймворки, сборщики и тяжёлые зависимости.
- Не ломать открытие через `file://`.
- Не менять бизнес-логику — только перенос и параметризация даты.
- Не удалять существующие функции, пока не добавлены тесты и замены.
- Код и сообщения — на русском.

## Критерии приёмки

- [ ] `health.js`, `filters.js`, `errors.js` созданы.
- [ ] `app.js` использует их и стал короче.
- [ ] `npm test` проходит.
- [ ] `npm run check` проходит.
- [ ] CI-workflow добавлен.
- [ ] Ошибки API/Excel показываются понятным текстом.
- [ ] Дашборд работает при открытии через `file://`.
- [ ] Поведение не изменилось.
- [ ] `CHANGELOG.md` обновлён.

## Формат ответа

1. Список новых и изменённых файлов.
2. Полный код модулей и тестов.
3. Патчи для `app.js`, HTML, `package.json`, CI.
4. Команды для локального запуска.
5. Чек-лист проверки, включая `file://`.
6. Что осталось за рамками задачи.
