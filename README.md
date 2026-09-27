# Черепашка (turtle.tirskix.space)

Standalone-редактор для задач по черепашьей графике — встраивается через
`iframe` в Codelab (`type=turtle_task`, тот же паттерн, что Snap! и GDevelop:
статичная панель редактора справа, пошаговая инструкция слева, листается
без перезагрузки iframe). Без бэкенда, без автопроверки — состояние проекта
живёт в `localStorage` браузера ученика.

## Возможности

- Переключатель **Блоки / Код** — один и тот же движок под обоими режимами.
- Блочный редактор — [Blockly](https://developers.google.com/blockly) с
  категорией «Черепашка» (`forward/backward/right/left/penUp/penDown/
  setColor/setWidth/goto`) + стандартные «Повторение», «Логика», «Числа»,
  «Переменные».
- Код-редактор — CodeMirror 6 с подсветкой JS; та же плоская API, что и
  генерирует Blockly (`forward(100); right(90);` …).
- Выполнение: код запускается один раз целиком (не пошагово — см.
  `src/runner.ts`), операции рисования копятся в список и затем
  воспроизводятся анимацией на `<canvas>` (`src/renderer.ts`).
- Защита от бесконечного цикла — жёсткий лимит операций
  (`MAX_OPS` в `src/turtleEngine.ts`); при превышении показывается понятная
  ошибка, а не зависание вкладки. Чистый `while(true){}` без вызовов
  черепашки внутри всё равно подвесит вкладку — та же оговорка, что у любого
  клиентского исполнения кода (как в Snap!/GDevelop).

## Разработка

```bash
npm install
npm run dev
```

## Сборка и деплой

Статический SPA, собирается в `dist/` и раздаётся nginx (см. `Dockerfile`,
`nginx.conf`) — без прокси на backend, в отличие от `codelab/frontend`.

```bash
docker compose up -d --build
```

На проде — по аналогии с `gdevelop.tirskix.space` (см. server_infra в памяти
проекта learning-portal): контейнер `web` за host nginx с TLS через certbot,
домен `turtle.tirskix.space`. Порт в `docker-compose.yml` (`8091`) —
черновой, перед первым деплоем свериться, что он свободен на хосте
`80.87.201.25`.

## Структура

- `src/turtleEngine.ts` — состояние черепашки и плоская API команд.
- `src/runner.ts` — исполнение JS-кода ученика (`Function(...)`, без доступа
  к window/document по умолчанию).
- `src/renderer.ts` — отрисовка списка операций на canvas с анимацией.
- `src/turtleBlocks.ts` — кастомные блоки Blockly + генератор в JS.
- `src/main.ts` — UI: тулбар, переключение режимов, запуск/остановка.
