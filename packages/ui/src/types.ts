import {ExecaChildProcess, Options as ExecaOptions} from 'execa';

export type Formatter = (
  strings: TemplateStringsArray,
  ...interpolated: Loggable[]
) => string;

export type Loggable = ((format: Formatter) => string) | string;

export enum LogLevel {
  Errors,
  Warnings,
  Info,
  Debug,
}

export interface LogOptions {
  level?: LogLevel;
}

export interface StepResources {
  readonly cpu?: number;
  readonly memory?: number;
}

export interface StepStdio {
  readonly stdout: NodeJS.WriteStream;
  readonly stderr: NodeJS.WriteStream;
  readonly stdin: NodeJS.ReadStream;
}

// We probably need to add some sort of listener system so the step can
// listen for types of events (close, switch to another stdio stream?),
// primarily for cleaning up spawned processes and the like
export interface StepRunner {
  readonly stdio: StepStdio;
  indefinite(run: () => void): void;
  log(arg: Loggable, options?: LogOptions): void;
  status(status: Loggable): void;
  exec(
    file: string,
    args?: readonly string[] | ExecaOptions,
    options?: ExecaOptions,
  ): ExecaChildProcess;
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
