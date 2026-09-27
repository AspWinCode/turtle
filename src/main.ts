import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';

import { Blockly, javascriptGenerator, TURTLE_TOOLBOX } from './turtleBlocks';
import { TurtleEngine, TurtleLimitError } from './turtleEngine';
import { TurtleRenderer } from './renderer';
import { runTurtleCode, RunError } from './runner';

import './style.css';

const STORAGE_BLOCKS = 'turtle:blocks-xml';
const STORAGE_CODE = 'turtle:code';
const STORAGE_MODE = 'turtle:mode';

const DEFAULT_CODE = `// Нарисуем квадрат
setColor('#1a7f37');
for (let i = 0; i < 4; i++) {
  forward(100);
  right(90);
}
`;

type Mode = 'blocks' | 'code';

const blocklyDiv = document.getElementById('blockly-editor') as HTMLDivElement;
const codeDiv = document.getElementById('code-editor') as HTMLDivElement;
const canvas = document.getElementById('turtle-canvas') as HTMLCanvasElement;
const statusBar = document.getElementById('status-bar') as HTMLDivElement;
const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const modeBlocksBtn = document.getElementById('mode-blocks') as HTMLButtonElement;
const modeCodeBtn = document.getElementById('mode-code') as HTMLButtonElement;

const engine = new TurtleEngine();
const renderer = new TurtleRenderer(canvas);
engine.reset();
renderer.renderAll(engine.ops);

let mode: Mode = (localStorage.getItem(STORAGE_MODE) as Mode) || 'blocks';

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

// ── CodeMirror ─────────────────────────────────────────────────────────────
const savedCode = localStorage.getItem(STORAGE_CODE) ?? DEFAULT_CODE;

const codeView = new EditorView({
  state: EditorState.create({
    doc: savedCode,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      javascript(),
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
    return javascriptGenerator.workspaceToCode(workspace);
  }
  return codeView.state.doc.toString();
}

function run() {
  const code = currentCode();
  runBtn.disabled = true;
  stopBtn.disabled = false;
  setStatus('Выполняется…');
  try {
    const ops = runTurtleCode(code, engine);
    renderer.animate(ops, () => {
      runBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus(`Готово — ${Math.max(0, ops.length - 1)} шагов`);
    });
  } catch (e) {
    runBtn.disabled = false;
    stopBtn.disabled = true;
    if (e instanceof TurtleLimitError || e instanceof RunError) {
      setStatus(e.message, true);
    } else {
      setStatus(`Неожиданная ошибка: ${e instanceof Error ? e.message : String(e)}`, true);
    }
    renderer.renderAll(engine.ops);
  }
}

function stop() {
  renderer.stop();
  runBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus('Остановлено');
}

function clearCanvas() {
  engine.reset();
  renderer.renderAll(engine.ops);
  setStatus('Холст очищен');
}

runBtn.addEventListener('click', run);
stopBtn.addEventListener('click', stop);
clearBtn.addEventListener('click', clearCanvas);

window.addEventListener('resize', () => {
  if (mode === 'blocks') Blockly.svgResize(workspace);
});
