import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';

import { Blockly, pythonGenerator, TURTLE_TOOLBOX } from './turtleBlocks';
import { runPythonTurtle, PythonRunError } from './skulptRunner';

import './style.css';

// ?task=<id> — Codelab передаёт id элемента курса в URL iframe, чтобы разные
// задания "Черепашка" (разные уроки) не делили одно и то же сохранённое
// состояние в localStorage (без этого второе открытое задание показывало бы
// код/рисунок первого). Без параметра (прямое открытие, не из курса) —
// общий ключ, как раньше.
const taskId = new URLSearchParams(window.location.search).get('task');
const STORAGE_PREFIX = taskId ? `turtle:task:${taskId}:` : 'turtle:';
const STORAGE_BLOCKS = `${STORAGE_PREFIX}blocks-xml`;
const STORAGE_CODE = `${STORAGE_PREFIX}code`;

const TARGET_ID = 'turtle-canvas';

const DEFAULT_CODE = '';

type Mode = 'blocks' | 'code';

const blocklyDiv = document.getElementById('blockly-editor') as HTMLDivElement;
const codeDiv = document.getElementById('code-editor') as HTMLDivElement;
const targetDiv = document.getElementById(TARGET_ID) as HTMLDivElement;
const statusBar = document.getElementById('status-bar') as HTMLDivElement;
const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const modeBlocksBtn = document.getElementById('mode-blocks') as HTMLButtonElement;
const modeCodeBtn = document.getElementById('mode-code') as HTMLButtonElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const openBtn = document.getElementById('open-btn') as HTMLButtonElement;
const openFileInput = document.getElementById('open-file') as HTMLInputElement;

// Новый запуск всегда открывает редактор кода. Ранее сохранённый режим
// "blocks" не должен перебивать это значение при повторном входе в задание.
let mode: Mode = 'code';
let runToken = 0; // растёт при каждом запуске/остановке — обгоняет завершение отменённого запуска

// ── Blockly ────────────────────────────────────────────────────────────────
const workspace = Blockly.inject(blocklyDiv, {
  toolbox: TURTLE_TOOLBOX,
  trashcan: true,
  zoom: { controls: true, wheel: true, startScale: 0.9 },
  grid: { spacing: 24, length: 2, colour: '#e5e5e5', snap: true },
});

const savedBlocksXml = localStorage.getItem(STORAGE_BLOCKS);
const hadSavedState = savedBlocksXml !== null || localStorage.getItem(STORAGE_CODE) !== null;
if (savedBlocksXml) {
  try {
    const dom = Blockly.utils.xml.textToDom(savedBlocksXml);
    Blockly.Xml.domToWorkspace(dom, workspace);
  } catch {
    seedDefaultBlocks();
  }
} else {
  seedDefaultBlocks();
}

function seedDefaultBlocks() {
  const block = workspace.newBlock('turtle_forward');
  const numberShadow = workspace.newBlock('math_number');
  numberShadow.setFieldValue('50', 'NUM');
  numberShadow.setShadow(true);
  numberShadow.initSvg();
  numberShadow.render();
  const input = block.getInput('DIST');
  input?.connection?.connect(numberShadow.outputConnection!);
  block.initSvg();
  block.render();
}

workspace.addChangeListener(() => {
  if (workspace.isDragging && workspace.isDragging()) return;
  const dom = Blockly.Xml.workspaceToDom(workspace);
  localStorage.setItem(STORAGE_BLOCKS, Blockly.utils.xml.domToText(dom));
});

// ── CodeMirror (Python) ─────────────────────────────────────────────────────
const savedCode = localStorage.getItem(STORAGE_CODE) ?? DEFAULT_CODE;

const codeView = new EditorView({
  state: EditorState.create({
    doc: savedCode,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      python(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          localStorage.setItem(STORAGE_CODE, codeView.state.doc.toString());
        }
      }),
      EditorView.theme({ '&': { height: '100%', fontSize: '14px' } }),
    ],
  }),
  parent: codeDiv,
});

// ── Режим блоки/код ──────────────────────────────────────────────────────
function setMode(next: Mode) {
  mode = next;
  const isBlocks = mode === 'blocks';
  blocklyDiv.style.display = isBlocks ? 'block' : 'none';
  codeDiv.style.display = isBlocks ? 'none' : 'block';
  modeBlocksBtn.classList.toggle('active', isBlocks);
  modeCodeBtn.classList.toggle('active', !isBlocks);
  if (isBlocks) Blockly.svgResize(workspace);
}
setMode(mode);

modeBlocksBtn.addEventListener('click', () => setMode('blocks'));
modeCodeBtn.addEventListener('click', () => setMode('code'));

// ── Запуск ─────────────────────────────────────────────────────────────────
function setStatus(text: string, isError = false) {
  statusBar.textContent = text;
  statusBar.classList.toggle('error', isError);
}

function currentCode(): string {
  if (mode === 'blocks') {
    return `import turtle\n\n${pythonGenerator.workspaceToCode(workspace)}`;
  }
  return codeView.state.doc.toString();
}

type TurtleProjectFile = {
  format: 'codelab-turtle-project';
  version: 1;
  savedAt: string;
  taskId: string | null;
  mode: Mode;
  code: string;
  blocksXml: string;
};

function projectFileName() {
  const suffix = taskId ? `-${taskId}` : '';
  return `turtle-project${suffix}-${new Date().toISOString().slice(0, 10)}.json`;
}

function saveProject() {
  const project: TurtleProjectFile = {
    format: 'codelab-turtle-project',
    version: 1,
    savedAt: new Date().toISOString(),
    taskId,
    mode,
    code: codeView.state.doc.toString(),
    blocksXml: Blockly.utils.xml.domToText(Blockly.Xml.workspaceToDom(workspace)),
  };
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = projectFileName();
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus('Проект сохранён в файл');
}

function isTurtleProject(value: unknown): value is TurtleProjectFile {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<TurtleProjectFile>;
  return project.format === 'codelab-turtle-project'
    && project.version === 1
    && (project.mode === 'blocks' || project.mode === 'code')
    && typeof project.code === 'string'
    && typeof project.blocksXml === 'string';
}

async function openProject(file: File) {
  try {
    const parsed: unknown = JSON.parse(await file.text());
    if (!isTurtleProject(parsed)) throw new Error('Файл не является проектом Черепашки');

    const dom = Blockly.utils.xml.textToDom(parsed.blocksXml);
    runToken++;
    targetDiv.innerHTML = '';
    workspace.clear();
    Blockly.Xml.domToWorkspace(dom, workspace);
    codeView.dispatch({ changes: { from: 0, to: codeView.state.doc.length, insert: parsed.code } });
    localStorage.setItem(STORAGE_BLOCKS, parsed.blocksXml);
    localStorage.setItem(STORAGE_CODE, parsed.code);
    setMode(parsed.mode);
    setStatus('Проект открыт');
    void run();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Не удалось открыть проект', true);
  } finally {
    openFileInput.value = '';
  }
}

saveBtn.addEventListener('click', saveProject);
openBtn.addEventListener('click', () => openFileInput.click());
openFileInput.addEventListener('change', () => {
  const file = openFileInput.files?.[0];
  if (file) void openProject(file);
});

function containerSize(): { width: number; height: number } {
  const rect = targetDiv.getBoundingClientRect();
  // Резервные значения — на случай нулевого размера (контейнер ещё не
  // отрисован/скрыт в этот момент), чтобы Skulpt не пытался создать canvas
  // 0x0.
  return {
    width: Math.max(200, Math.floor(rect.width) || 800),
    height: Math.max(150, Math.floor(rect.height) || 600),
  };
}

async function run() {
  const code = currentCode();
  const myToken = ++runToken;
  runBtn.disabled = true;
  stopBtn.disabled = false;
  setStatus('Выполняется…');
  try {
    await runPythonTurtle(code, TARGET_ID, () => {}, containerSize());
    if (myToken !== runToken) return; // отменено кнопкой "Стоп" — не перетираем её статус
    runBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Готово');
  } catch (e) {
    if (myToken !== runToken) return;
    runBtn.disabled = false;
    stopBtn.disabled = true;
    if (e instanceof PythonRunError) {
      setStatus(e.message, true);
    } else {
      setStatus(`Неожиданная ошибка: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }
}

function stop() {
  // Skulpt не даёт прервать уже запущенный интерпретатор напрямую — считаем
  // текущий прогон отменённым (runToken) и убираем рисунок, к которому он
  // больше не должен что-либо дорисовывать.
  runToken++;
  targetDiv.innerHTML = '';
  runBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus('Остановлено');
}

function clearCanvas() {
  runToken++;
  targetDiv.innerHTML = '';
  setStatus('Холст очищен');
}

runBtn.addEventListener('click', run);
stopBtn.addEventListener('click', stop);
clearBtn.addEventListener('click', clearCanvas);

window.addEventListener('resize', () => {
  if (mode === 'blocks') Blockly.svgResize(workspace);
});

// Прогресс (код/блоки) и так лежит в localStorage и переживает перезагрузку
// страницы — но раньше сам РИСУНОК не восстанавливался: ученик возвращался
// на задание (например, после перехода на другой пункт курса и обратно — а
// iframe при этом монтируется заново, см. StepIframeTaskView в Codelab) и
// видел пустой холст, пока не нажимал "Запустить" ещё раз. Выглядело как
// "прогресс слетел", хотя код был цел. Автозапуск последнего сохранённого
// состояния сразу при открытии чинит именно это — но только если состояние
// действительно было сохранено (не дёргаем Skulpt на пустом месте у
// первого открывшего задание ученика).
if (hadSavedState) {
  run();
}
