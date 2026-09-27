/** Движок черепашки: не рисует напрямую во время выполнения кода ученика —
 * копит список операций (`ops`), затем воспроизводит их с анимацией. Это
 * защищает от подвисания при `while(true)` с рисованием внутри (запись
 * операций обрывается по лимиту MAX_OPS) и даёт одинаковый результат
 * независимо от источника кода (блоки или текст). */

export type TurtleOp =
  | { kind: 'line'; x0: number; y0: number; x1: number; y1: number; color: string; width: number }
  | { kind: 'move'; x: number; y: number }
  | { kind: 'clear' };

const MAX_OPS = 20000;

export class TurtleLimitError extends Error {
  constructor() {
    super('Слишком много шагов — похоже, бесконечный цикл. Проверь условие остановки.');
    this.name = 'TurtleLimitError';
  }
}

export class TurtleEngine {
  x = 0;
  y = 0;
  heading = 0; // градусы, 0 = вверх, по часовой стрелке
  penDown = true;
  color = '#1a7f37';
  lineWidth = 2;
  visible = true;
  ops: TurtleOp[] = [];

  reset() {
    this.x = 0;
    this.y = 0;
    this.heading = 0;
    this.penDown = true;
    this.color = '#1a7f37';
    this.lineWidth = 2;
    this.visible = true;
    this.ops = [{ kind: 'clear' }];
  }

  private guard() {
    if (this.ops.length >= MAX_OPS) throw new TurtleLimitError();
  }

  forward(dist: number) {
    this.guard();
    const rad = (this.heading * Math.PI) / 180;
    const nx = this.x + Math.sin(rad) * dist;
    const ny = this.y - Math.cos(rad) * dist;
    if (this.penDown) {
      this.ops.push({ kind: 'line', x0: this.x, y0: this.y, x1: nx, y1: ny, color: this.color, width: this.lineWidth });
    } else {
      this.ops.push({ kind: 'move', x: nx, y: ny });
    }
    this.x = nx;
    this.y = ny;
  }

  backward(dist: number) {
    this.forward(-dist);
  }

  right(deg: number) {
    this.guard();
    this.heading = (this.heading + deg) % 360;
  }

  left(deg: number) {
    this.right(-deg);
  }

  penUp() {
    this.penDown = false;
  }

  penDownCmd() {
    this.penDown = true;
  }

  setColor(color: string) {
    this.guard();
    this.color = color;
  }

  setWidth(w: number) {
    this.guard();
    this.lineWidth = Math.max(1, w);
  }

  goto(x: number, y: number) {
    this.guard();
    if (this.penDown) {
      this.ops.push({ kind: 'line', x0: this.x, y0: this.y, x1: x, y1: y, color: this.color, width: this.lineWidth });
    } else {
      this.ops.push({ kind: 'move', x, y });
    }
    this.x = x;
    this.y = y;
  }

  setVisible(v: boolean) {
    this.visible = v;
  }
}

/** API, которую видит код ученика (и в код-режиме, и как результат генерации
 * из блоков) — плоские глобальные функции, привычные по учебной черепашке. */
export function buildRuntimeApi(engine: TurtleEngine) {
  return {
    forward: (d: number) => engine.forward(Number(d) || 0),
    backward: (d: number) => engine.backward(Number(d) || 0),
    right: (d: number) => engine.right(Number(d) || 0),
    left: (d: number) => engine.left(Number(d) || 0),
    penUp: () => engine.penUp(),
    penDown: () => engine.penDownCmd(),
    setColor: (c: string) => engine.setColor(String(c)),
    setWidth: (w: number) => engine.setWidth(Number(w) || 1),
    goto: (x: number, y: number) => engine.goto(Number(x) || 0, Number(y) || 0),
    hideTurtle: () => engine.setVisible(false),
    showTurtle: () => engine.setVisible(true),
  };
}
