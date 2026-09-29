/** Запуск настоящего Python-кода ученика через Skulpt — модуль `turtle` у
 * Skulpt уже реализует весь стандартный API (forward/circle/write/Screen/
 * bgcolor/onkey/...), поэтому здесь просто конфигурация интерпретатора, а
 * не переизобретение функций черепашки. execLimit — встроенная защита от
 * бесконечного цикла (Skulpt сам прерывает выполнение и бросает ошибку). */

// execLimit считает ПОЛНОЕ время выполнения, включая анимацию черепашки —
// не только вычисления. Настоящая скорость Python turtle по умолчанию (3 из
// 10) рисует медленно: даже обычный квадрат из четырёх сторон занимает
// больше 15 секунд и раньше упирался в лимит с ложным "бесконечный цикл" —
// см. память. Поэтому: лимит подняли с запасом, а скорость по умолчанию
// ускорили ниже (turtle.speed(6)), чтобы типичные учебные рисунки не
// упирались в потолок вовсе.
const EXEC_LIMIT_MS = 60000;

function builtinRead(filename: string): string {
  if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[filename] === undefined) {
    throw new Error(`Файл не найден: ${filename}`);
  }
  return Sk.builtinFiles.files[filename];
}

export class PythonRunError extends Error {}

/** targetId — id пустого div'а, куда Skulpt сам вставит свой canvas
 * (Sk.TurtleGraphics.target). Он же чистит предыдущий рисунок при новом
 * запуске — вручную canvas очищать не нужно. */
export function runPythonTurtle(code: string, targetId: string, onOutput: (text: string) => void): Promise<void> {
  Sk.configure({
    output: onOutput,
    read: builtinRead,
    __future__: Sk.python3,
    execLimit: EXEC_LIMIT_MS,
  });
  Sk.TurtleGraphics = { target: targetId, width: 800, height: 600 };

  // Всегда добавляем свой "import turtle" + speed(6) сверху, даже если в
  // коде уже есть свой import — повторный import в Python безопасен (модуль
  // не переимпортируется), а вставлять speed(6) ПОСЛЕ чужого import текстовым
  // поиском ненадёжно (например, если он не на первой строке). speed(6) —
  // по умолчанию у Skulpt/настоящего Python скорость 3 ("slow"), рисование
  // за разумное время выглядит как "ничего не происходит"; 6 ("normal") —
  // то, что большинство туториалов и так считают дефолтом. Ученик может
  // переопределить своим turtle.speed(...) — он просто выполнится позже.
  const fullCode = `import turtle\nturtle.speed(6)\n${code}`;

  return Sk.misceval
    .asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, fullCode, true))
    .then(() => undefined)
    .catch((err: unknown) => {
      throw new PythonRunError(formatError(err));
    });
}

function formatError(err: unknown): string {
  if (err && typeof err === 'object' && 'toString' in err) {
    const msg = String(err);
    if (msg.includes('Program exceeded run time limit')) {
      return 'Слишком долго выполняется — похоже, бесконечный цикл. Проверь условие остановки.';
    }
    return msg;
  }
  return String(err);
}
