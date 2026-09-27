import { TurtleOp } from './turtleEngine';

/** Координаты черепашки — в логической системе (0,0) это центр канваса,
 * ось Y растёт вверх. Переводим в экранные пиксели канваса при отрисовке. */
export class TurtleRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private animationHandle: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    this.ctx = ctx;
  }

  private toScreen(x: number, y: number): [number, number] {
    return [this.canvas.width / 2 + x, this.canvas.height / 2 - y];
  }

  stop() {
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = null;
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Рисует все операции сразу, без анимации (для мгновенного превью). */
  renderAll(ops: TurtleOp[]) {
    this.stop();
    this.clear();
    for (const op of ops) this.applyOp(op);
    const last = lastPosition(ops);
    if (last) this.drawCursor(last.x, last.y, last.heading);
  }

  /** Анимированное воспроизведение — по несколько операций за кадр, чтобы
   * даже крупные рисунки (тысячи отрезков) не рисовались одним кадром, но и
   * не тянулись минутами. onDone вызывается после последнего кадра. */
  animate(ops: TurtleOp[], onDone: () => void) {
    this.stop();
    this.clear();
    let i = 0;
    const opsPerFrame = Math.max(1, Math.ceil(ops.length / 240));
    let heading = 0;
    let x = 0;
    let y = 0;

    const step = () => {
      const end = Math.min(ops.length, i + opsPerFrame);
      // Стираем предыдущий курсор-перерисовкой всего кадра дешевле, чем
      // отслеживать грязный прямоугольник — рисунков немного, полотно 2D.
      for (; i < end; i++) {
        const op = ops[i];
        this.applyOp(op);
        if (op.kind === 'line') {
          x = op.x1;
          y = op.y1;
          heading = Math.atan2(op.x1 - op.x0, -(op.y1 - op.y0)) * (180 / Math.PI);
        } else if (op.kind === 'move') {
          x = op.x;
          y = op.y;
        }
      }
      this.drawCursor(x, y, heading);
      if (i < ops.length) {
        this.animationHandle = requestAnimationFrame(() => {
          // Убираем курсор предыдущего кадра, дорисовывая полотно заново
          // только линиями — дешёвая альтернатива полной перерисовке.
          this.redrawWithoutCursor(ops, i);
          step();
        });
      } else {
        this.animationHandle = null;
        onDone();
      }
    };
    step();
  }

  private redrawWithoutCursor(ops: TurtleOp[], upTo: number) {
    this.clear();
    for (let j = 0; j < upTo; j++) this.applyOp(ops[j]);
  }

  private applyOp(op: TurtleOp) {
    if (op.kind === 'clear') {
      this.clear();
      return;
    }
    if (op.kind === 'line') {
      const [sx0, sy0] = this.toScreen(op.x0, op.y0);
      const [sx1, sy1] = this.toScreen(op.x1, op.y1);
      this.ctx.strokeStyle = op.color;
      this.ctx.lineWidth = op.width;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(sx0, sy0);
      this.ctx.lineTo(sx1, sy1);
      this.ctx.stroke();
    }
  }

  private drawCursor(x: number, y: number, headingDeg: number) {
    const [sx, sy] = this.toScreen(x, y);
    const rad = (headingDeg * Math.PI) / 180;
    this.ctx.save();
    this.ctx.translate(sx, sy);
    this.ctx.rotate(rad);
    this.ctx.fillStyle = '#2f9e44';
    this.ctx.strokeStyle = '#1a5c27';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -12);
    this.ctx.lineTo(8, 10);
    this.ctx.lineTo(0, 5);
    this.ctx.lineTo(-8, 10);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }
}

function lastPosition(ops: TurtleOp[]): { x: number; y: number; heading: number } | null {
  let x = 0;
  let y = 0;
  let heading = 0;
  let found = false;
  for (const op of ops) {
    if (op.kind === 'line') {
      heading = Math.atan2(op.x1 - op.x0, -(op.y1 - op.y0)) * (180 / Math.PI);
      x = op.x1;
      y = op.y1;
      found = true;
    } else if (op.kind === 'move') {
      x = op.x;
      y = op.y;
      found = true;
    }
  }
  return found ? { x, y, heading } : { x: 0, y: 0, heading: 0 };
}
