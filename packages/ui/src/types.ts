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

export interface StepRunner {
  log(arg: Loggable, options?: LogOptions): void;
  exec(
    file: string,
    args?: readonly string[] | ExecaOptions,
    options?: ExecaOptions,
  ): ExecaChildProcess;
}

export interface Step {
  readonly label?: Loggable;
  readonly indefinite?: boolean;
  skip?(skipped: readonly string[]): boolean;
  run(runner: StepRunner): void | Promise<void>;
}
