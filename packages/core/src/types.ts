export type LogFormatter = (
  strings: TemplateStringsArray,
  ...interpolated: Loggable[]
) => string;

export type Loggable = ((format: LogFormatter) => string) | string;

export enum LogLevel {
  Errors,
  Warnings,
  Info,
  Debug,
}

export interface LogOptions {
  level?: LogLevel;
}

export type Log = (loggable: Loggable, options?: LogOptions) => void;

export interface StepResources {
  readonly cpu?: number;
  readonly memory?: number;
}

export interface StepStdio {
  readonly stdout: import('stream').Writable;
  readonly stderr: import('stream').Writable;
  readonly stdin: import('stream').Readable;
}

interface IndefiniteStepRunner {
  readonly stdio: StepStdio;
}

// We probably need to add some sort of listener system so the step can
// listen for types of events (close, switch to another stdio stream?),
// primarily for cleaning up spawned processes and the like
export interface StepRunner {
  indefinite(run: (runner: IndefiniteStepRunner) => void): void;
  log(arg: Loggable, options?: LogOptions): void;
  status(status: Loggable): void;
  exec(
    file: string,
    args?: readonly string[] | import('execa').Options,
    options?: import('execa').Options,
  ): import('execa').ExecaChildProcess;
  runNested(steps: readonly Step[]): Promise<void>;
}

export interface Step {
  readonly id: string;
  readonly label: Loggable;
  readonly source?: any;
  readonly resources?: StepResources;
  needs?(step: Step): boolean;
  run(runner: StepRunner): void | Promise<void>;
}
