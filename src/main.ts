import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';

import { Blockly, pythonGenerator, TURTLE_TOOLBOX } from './turtleBlocks';
import { runPythonTurtle, PythonRunError } from './skulptRunner';

import './style.css';

const STORAGE_BLOCKS = 'turtle:blocks-xml';
const STORAGE_CODE = 'turtle:code';
const STORAGE_MODE = 'turtle:mode';

const TARGET_ID = 'turtle-canvas';

const DEFAULT_CODE = `import turtle

# Нарисуем квадрат
turtle.pencolor('#1a7f37')
for i in range(4):
    turtle.forward(100)
    turtle.right(90)
`;

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

let mode: Mode = (localStorage.getItem(STORAGE_MODE) as Mode) || 'blocks';
let runToken = 0; // растёт при каждом запуске/остановке — обгоняет завершение отменённого запуска

// ── Blockly ────────────────────────────────────────────────────────────────
const workspace = Blockly.inject(blocklyDiv, {
  toolbox: TURTLE_TOOLBOX,
  trashcan: true,
  zoom: { controls: true, wheel: true, startScale: 0.9 },
  grid: { spacing: 24, length: 2, colour: '#e5e5e5', snap: true },
});

const savedBlocksXml = localStorage.getItem(STORAGE_BLOCKS);
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
  localStorage.setItem(STORAGE_MODE, mode);
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
