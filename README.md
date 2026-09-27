# Черепашка (turtle.tirskix.space)

Standalone-редактор для задач по черепашьей графике — встраивается через
`iframe` в Codelab (`type=turtle_task`, тот же паттерн, что Snap! и GDevelop:
статичная панель редактора справа, пошаговая инструкция слева, листается
без перезагрузки iframe). Без бэкенда, без автопроверки — состояние проекта
живёт в `localStorage` браузера ученика.

## Возможности

- Переключатель **Блоки / Код** — оба режима работают через один и тот же
  Python-интерпретатор.
- Код-редактор — CodeMirror 6 с подсветкой Python; код выполняется
  **настоящим Python** через [Skulpt](https://skulpt.org) (см.
  `src/skulptRunner.ts`), а не имитацией. Модуль `turtle` — родная реализация
  Skulpt, поэтому доступен весь стандартный API turtle (`forward/right/
  circle/dot/write/speed/pencolor/fillcolor/begin_fill/end_fill/Screen/
  bgcolor/...`), а не только то, что явно обёрнуто в блоки. Скрипт вида
  `import turtle; turtle.Screen().setup(...); turtle.write(...)` запускается
  как есть, один в один с настоящим Python.
- Блочный редактор — [Blockly](https://developers.google.com/blockly) с
  категориями «Черепашка», «Перо и цвет», «Прочее» — генерирует тот же
  Python-код (`src/turtleBlocks.ts`, `pythonGenerator`), что можно написать
  руками в код-режиме.
- Skulpt-файлы (`skulpt.min.js`, `skulpt-stdlib.js`) вендорятся локально в
  `public/vendor/skulpt/` — раздаются вместе со статикой, без зависимости от
  внешнего CDN в рантайме (важно для школьных сетей с фильтрацией трафика).
- Защита от бесконечного цикла — `Sk.execLimit` (см. `EXEC_LIMIT_MS` в
  `src/skulptRunner.ts`): Skulpt сам прерывает выполнение по таймауту и
  бросает ошибку, понятную ребёнку — работает для любого зависания, не
  только с вызовами черепашки внутри цикла.

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
домен `turtle.tirskix.space`.

## Структура

- `src/skulptRunner.ts` — конфигурация и запуск Skulpt (Python-интерпретатор
  в браузере), включая защиту от бесконечного цикла.
- `src/skulpt.d.ts` — минимальные типы для глобального `Sk` (Skulpt грузится
  как обычный `<script>`, не ES-модуль).
- `src/turtleBlocks.ts` — кастомные блоки Blockly + генератор в Python.
- `src/main.ts` — UI: тулбар, переключение режимов блоки/код, запуск/стоп.
- `public/vendor/skulpt/` — вендоренные сборки Skulpt (не редактировать
  руками; обновлять скачиванием новой версии с cdn.jsdelivr.net/npm/skulpt).
