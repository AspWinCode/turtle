import { buildRuntimeApi, TurtleEngine, TurtleLimitError } from './turtleEngine';

export class RunError extends Error {}

/** Выполняет JS-код ученика синхронно в изолированной функции с явным
 * набором глобальных имён (turtle-API), без доступа к window/document —
 * это не полноценная песочница (Function() всё ещё исполняется в главном
 * потоке страницы), но и не требуется больше, чем у Snap!/GDevelop: код
 * запускается только в браузере самого ученика, над собственным холстом. */
export function runTurtleCode(code: string, engine: TurtleEngine) {
  engine.reset();
  const api = buildRuntimeApi(engine);
  const argNames = Object.keys(api);
  const argValues = Object.values(api);

  let fn: Function;
  try {
    fn = new Function(...argNames, '"use strict";\n' + code);
  } catch (e) {
    throw new RunError(describeSyntaxError(e));
  }

  try {
    fn(...argValues);
  } catch (e) {
    if (e instanceof TurtleLimitError) throw e;
    throw new RunError(describeRuntimeError(e));
  }

  return engine.ops;
}

function describeSyntaxError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return `Ошибка в коде: ${msg}`;
}

function describeRuntimeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return `Ошибка при выполнении: ${msg}`;
}
