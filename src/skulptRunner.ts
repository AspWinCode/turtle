/** Запуск настоящего Python-кода ученика через Skulpt — модуль `turtle` у
 * Skulpt уже реализует весь стандартный API (forward/circle/write/Screen/
 * bgcolor/onkey/...), поэтому здесь просто конфигурация интерпретатора, а
 * не переизобретение функций черепашки. execLimit — встроенная защита от
 * бесконечного цикла (Skulpt сам прерывает выполнение и бросает ошибку). */

const EXEC_LIMIT_MS = 15000;

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

  // Кода без `import turtle` быть не должно (или он лишний) — добавляем сами,
  // повторный import в Python безопасен (модуль не переимпортируется).
  const fullCode = code.includes('import turtle') ? code : `import turtle\n${code}`;

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
