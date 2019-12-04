import {Readable, Writable} from 'stream';

import {AsyncSeriesHook} from 'tapable';
import arg, {Result} from 'arg';
import {LogLevel} from '@sewing-kit/types';

export function createCommand<Flags extends {[key: string]: any}>(
  flagSpec: Flags,
  run: (
    flags: Result<Flags>,
    workspace: import('@sewing-kit/core').Workspace,
    runner: import('@sewing-kit/core').Runner,
  ) => Promise<void>,
) {
  return async (
    argv: string[],
    {
      __internal: internalOptions = {},
    }: {
      __internal?: {
        stdin?: Readable;
        stdout?: Writable;
        stderr?: Writable;
      };
    } = {},
  ) => {
    const {Ui, DiagnosticError} = await import('@sewing-kit/ui');

    const {'--root': root, '--log-level': logLevel, ...flags} = arg(
      {...flagSpec, '--root': String, '--log-level': String},
      {argv},
    );

    const ui = new Ui({
      ...(internalOptions as any),
      level: mapLogLevel(logLevel as any),
    });

    const runner: import('@sewing-kit/core').Runner = {
      ui,
      tasks: {
        discovery: new AsyncSeriesHook<
          import('@sewing-kit/core').DiscoveryTask
        >(['workspaceTask']),
        build: new AsyncSeriesHook<import('@sewing-kit/core').BuildTask>([
          'buildTask',
        ]),
        dev: new AsyncSeriesHook<import('@sewing-kit/core').DevTask>([
          'devTask',
        ]),
        test: new AsyncSeriesHook<import('@sewing-kit/core').TestTask>([
          'testTask',
        ]),
        lint: new AsyncSeriesHook<import('@sewing-kit/core').LintTask>([
          'lintTask',
        ]),
        typeCheck: new AsyncSeriesHook<
          import('@sewing-kit/core').TypeCheckTask
        >(['typeCheckTask']),
      },
    };

    const {runDiscovery} = await import('@sewing-kit/core');

    try {
      const workspace = await runDiscovery({root: root as any}, runner);
      await run(flags as any, workspace, runner);
    } catch (error) {
      if (error instanceof DiagnosticError) {
        ui.log(error.message);
      } else {
        ui.log(
          'The following unexpected error occurred. Please raise an issue on [the sewing-kit repo](https://github.com/Shopify/sewing-kit).',
        );
        ui.log(error.message);
        ui.log(error.stack);
      }

      process.exitCode = 1;
    }
  };
}

function mapLogLevel(level?: string) {
  if (level == null) {
    return LogLevel.Info;
  }

  switch (level) {
    case 'errors':
      return LogLevel.Errors;
    case 'warnings':
      return LogLevel.Warnings;
    case 'info':
      return LogLevel.Info;
    case 'debug':
      return LogLevel.Debug;
    default:
      throw new Error(`Unrecognized --log-level option: ${level}`);
  }
}
