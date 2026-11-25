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

// Skulpt's turtle module intentionally implements a smaller API than CPython's
// turtle.  Keep the compatibility layer in the runner so student programs can
// use the common Pong idioms without modifying the vendored Skulpt bundle.
// `onkeypress` is kept as a CPython-compatible alias for Skulpt's key-down
// handler. The runtime patch below also adds a real `onkeyrelease` callback.
const TURTLE_COMPAT = `
import turtle as _turtle_compat

def _turtle_compat_onkeypress(self, fun, key=None):
    return self.onkey(fun, key)

def _turtle_compat_module_onkeypress(fun, key=None):
    return _turtle_compat.Screen().onkey(fun, key)

_turtle_compat_original_bgcolor = _turtle_compat.Screen.bgcolor
_turtle_compat_original_setup = _turtle_compat.Screen.setup
_turtle_compat_last_bgcolor = None

def _turtle_compat_bgcolor(self, color=None, g=None, b=None):
    global _turtle_compat_last_bgcolor
    if color is not None:
        _turtle_compat_last_bgcolor = color
    return _turtle_compat_original_bgcolor(self, color, g, b)

def _turtle_compat_setup(self, width=None, height=None, startx=None, starty=None):
    result = _turtle_compat_original_setup(self, width, height, startx, starty)
    if _turtle_compat_last_bgcolor is not None:
        _turtle_compat_original_bgcolor(self, _turtle_compat_last_bgcolor)
    return result

_turtle_compat.Screen.onkeypress = _turtle_compat_onkeypress
_turtle_compat.onkeypress = _turtle_compat_module_onkeypress
_turtle_compat.Screen.bgcolor = _turtle_compat_bgcolor
_turtle_compat.Screen.setup = _turtle_compat_setup
`;

function patchTurtleRuntime() {
  const files = Sk.builtinFiles?.files;
  const path = 'src/lib/turtle.js';
  const source = files?.[path];
  if (!source || source.includes('$shapesize')) return;

  const replacements: Array<[string, string]> = [
    [
      'size:this._size,speed:this._computed_speed',
      'size:this._size,stretchWid:this._stretchWid,stretchLen:this._stretchLen,speed:this._computed_speed',
    ],
    [
      'this._size=1,this._filling=!1',
      'this._size=1,this._stretchWid=1,this._stretchLen=1,this._filling=!1',
    ],
    [
      'e.$setup=function(e,t,r,n){return isNaN(parseFloat(e))&&(e=getWidth()),isNaN(parseFloat(t))&&(t=getHeight()),1>=e&&(e=getWidth()*e),1>=t&&(t=getHeight()*t),this._width=e,this._height=t,',
      'e.$setup=function(e,t,r,n){var o=getWidth(),a=getHeight();return isNaN(parseFloat(e))&&(e=o),isNaN(parseFloat(t))&&(t=a),1>=e&&(e=o*e),1>=t&&(t=a*t),this._width=o,this._height=a,',
    ],
    [
      't.scale(p,g),s.nodeName',
      't.scale(p*e.stretchLen,g*e.stretchWid),s.nodeName',
    ],
    [
      'e.$shape=function(e){return e&&v[e]?(this._shape=e,this.addUpdate(void 0,this._shown,{shape:e})):this._shape},',
      'e.$shapesize=function(e,t,r){return void 0===e&&(e=1),void 0===t&&(t=1),this._stretchWid=e,this._stretchLen=t,this.addUpdate(void 0,this._shown,{stretchWid:e,stretchLen:t})},e.$shapesize.minArgs=0,e.$shapesize.co_varnames=["stretch_wid","stretch_len","outline"],e.$shape=function(e){return e&&v[e]?(this._shape=e,this.addUpdate(void 0,this._shown,{shape:e})):this._shape},',
    ],
    [
      'e._createKeyUpListener=function(){var t=this;this._keyUpListener||(this._keyUpListener=function(r){var e=t._keyLogger[r.charCode||r.keyCode];void 0!==e&&(r.preventDefault(),window.clearInterval(e),window.clearTimeout(e),delete t._keyLogger[r.charCode||r.keyCode])},getTarget().addEventListener("keyup",this._keyUpListener))},',
      'e._createKeyUpListener=function(){var i=this;this._keyUpListener||(this._keyUpListener=function(r){var e,n=r.charCode||r.keyCode,a=(r.key||String.fromCharCode(n)).toLowerCase(),s;if(i._keyReleaseListeners)for(s in i._keyReleaseListeners)if(s===a||1<s.length&&t[n]&&t[n].test(s)){i._keyReleaseListeners[s](),r.preventDefault();break}e=i._keyLogger[n],void 0!==e&&(r.preventDefault(),window.clearInterval(e),window.clearTimeout(e),delete i._keyLogger[n])},getTarget().addEventListener("keyup",this._keyUpListener))},',
    ],
    [
      'e.$onkey=function(e,t){if("function"==typeof t){var r=e;e=t,t=r}t=(t+"").toLowerCase(),e&&"function"==typeof e?(!this._keyListeners&&(this._keyListeners={}),this._keyListeners[t]=e):delete this._keyListeners[t]},',
      'e.$onkeyrelease=function(e,t){if("function"==typeof t){var r=e;e=t,t=r}t=(t+"").toLowerCase(),e&&"function"==typeof e?(!this._keyReleaseListeners&&(this._keyReleaseListeners={}),this._keyReleaseListeners[t]=e):delete this._keyReleaseListeners[t]},e.$onkeyrelease.minArgs=2,e.$onkeyrelease.co_varnames=["method","keyValue"],e.$onkey=function(e,t){if("function"==typeof t){var r=e;e=t,t=r}t=(t+"").toLowerCase(),e&&"function"==typeof e?(!this._keyListeners&&(this._keyListeners={}),this._keyListeners[t]=e):delete this._keyListeners[t]},',
    ],
  ];

  let patched = source;
  for (const [from, to] of replacements) {
    if (!patched.includes(from)) {
      throw new Error(`Не удалось применить совместимость Turtle: ${from}`);
    }
    patched = patched.replace(from, to);
  }
  files[path] = patched;
}

/** targetId — id div'а, куда Skulpt вставляет свои canvas (Sk.TurtleGraphics.
 * target). Чистим его руками перед КАЖДЫМ запуском (не полагаясь на
 * внутреннюю очистку Skulpt) и заставляем пересоздать оба canvas-слоя с
 * нуля — задание встроено в iframe, который никогда не перемонтируется
 * между запусками (см. Codelab StepIframeTaskView), поэтому Skulpt иначе
 * может переиспользовать старые canvas-элементы, отрисованные под другую
 * геометрию контейнера, и слой с линией рисования съезжает относительно
 * слоя черепашки (репорт: "съехало, рисует не там, где сама черепашка"). */
export function runPythonTurtle(
  code: string,
  targetId: string,
  onOutput: (text: string) => void,
  size: { width: number; height: number },
): Promise<void> {
  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    targetEl.innerHTML = '';
    // Skulpt's turtle module (src/lib/turtle.js) кэширует свой инстанс ПРЯМО
    // НА DOM-ЭЛЕМЕНТЕ (targetEl.turtleInstance) — и если он уже есть, при
    // следующем "import turtle" просто вызывает turtleInstance.reset()
    // вместо создания нового canvas с актуальными Sk.TurtleGraphics.width/
    // height. targetEl.innerHTML='' этого свойства не трогает (оно не
    // ребёнок DOM, а поле самого объекта), поэтому canvas навсегда
    // застревал на размере САМОГО ПЕРВОГО запуска за всё время жизни
    // страницы/iframe — сколько ни меняй size здесь. Без этого удаления
    // перезапуск при ресайзе контейнера (см. ResizeObserver в main.ts)
    // ничего не решает.
    delete (targetEl as unknown as { turtleInstance?: unknown }).turtleInstance;
  }

  Sk.configure({
    output: onOutput,
    read: builtinRead,
    __future__: Sk.python3,
    execLimit: EXEC_LIMIT_MS,
  });
  // Размер canvas — реальный размер контейнера на момент запуска, а не
  // фиксированный 800x600: иначе там, где панель уже отдана под задание
  // меньше 600px в высоту (например, свёрнутый вид в курсе, не "на весь
  // экран"), центр (0,0) черепашки физически оказывается ниже видимой
  // области — снаружи выглядит так, будто рисунок "съезжает вверх"/обрезан.
  Sk.TurtleGraphics = { target: targetId, width: size.width, height: size.height };
  patchTurtleRuntime();

  // Всегда добавляем свой "import turtle" + speed(6) сверху, даже если в
  // коде уже есть свой import — повторный import в Python безопасен (модуль
  // не переимпортируется), а вставлять speed(6) ПОСЛЕ чужого import текстовым
  // поиском ненадёжно (например, если он не на первой строке). speed(6) —
  // по умолчанию у Skulpt/настоящего Python скорость 3 ("slow"), рисование
  // за разумное время выглядит как "ничего не происходит"; 6 ("normal") —
  // то, что большинство туториалов и так считают дефолтом. Ученик может
  // переопределить своим turtle.speed(...) — он просто выполнится позже.
  const fullCode = `${TURTLE_COMPAT}\nimport turtle\nturtle.speed(6)\n${code}`;

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
