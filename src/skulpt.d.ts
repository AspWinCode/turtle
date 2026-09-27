/** Skulpt грузится обычными <script> из /vendor/skulpt (UMD, не ES-модуль) —
 * поэтому здесь только минимальные типы для того, чем мы пользуемся, не
 * полное покрытие API. */
declare const Sk: {
  configure(opts: {
    output?: (text: string) => void;
    read?: (filename: string) => string;
    __future__?: unknown;
    execLimit?: number;
    yieldLimit?: number;
  }): void;
  python3: unknown;
  builtinFiles?: { files: Record<string, string> };
  TurtleGraphics?: { target: string; width?: number; height?: number };
  importMainWithBody(name: string, dumpJS: boolean, body: string, canSuspend: boolean): unknown;
  misceval: {
    asyncToPromise(fn: () => unknown): Promise<unknown>;
  };
};
