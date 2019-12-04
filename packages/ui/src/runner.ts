import exec from 'execa';
import {
  Step,
  LogLevel,
  Loggable,
  LogOptions,
  StepRunner as NestedStepRunner,
} from '@sewing-kit/types';

import {Ui} from './ui';
import {DiagnosticError} from './errors';

type Arguments<T> = T extends (...args: infer U) => any ? U : never;

const symbols = '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆';

enum PersistentLineState {
  Default,
  Error,
}

interface PersistentLine {
  loggable: Loggable;
  state: PersistentLineState;
}

interface PersistentLineController {
  update(loggable: Loggable): void;
  remove(): void;
  fail(): void;
}

interface RunStepsOptions {
  readonly id: Loggable;
  readonly skip?: string[];
  readonly separator?: boolean;
}

interface StepsRunner {
  readonly persistentLine: PersistentLineController;
  log(loggable: Loggable, options?: LogOptions): void;
  stepRunner(step: Step): NestedStepRunner;
}

interface RunNestedOptions {
  readonly id: Loggable;
  readonly persistentLine: Loggable;
}

interface Runner {
  log(loggable: Loggable, options?: LogOptions): void;
  title(title: string): void;
  separator(): void;
  epilogue(loggable: Loggable): void;

  pre(steps: Step[], skip?: string[]): Promise<void>;
  post(steps: Step[], skip?: string[]): Promise<void>;
  steps(steps: Step[], options: RunStepsOptions): Promise<void>;
  nested<T>(
    options: RunNestedOptions,
    run: (runner: StepsRunner) => Promise<T>,
  ): Promise<T>;
}

// eslint-disable-next-line consistent-return
export async function run<T>(ui: Ui, run: (runner: Runner) => T) {
  let tick = 0;
  let hasLoggedSection = false;
  let lastPersistentContentSize = 0;

  const isInteractive = process.stdout.isTTY;
  const logQueue: Arguments<Ui['log']>[] = [];
  const persistentLines = new Set<PersistentLine>();

  const update = () => {
    if (lastPersistentContentSize > 0) {
      ui.stdout.moveCursor(0, -1 * Math.max(0, lastPersistentContentSize - 1));
      ui.stdout.clearDown();
    }

    for (const queued of logQueue) {
      ui.log(...queued);
    }

    logQueue.length = 0;

    const persistentLineText = [...persistentLines]
      .map(({loggable, state}) =>
        ui.stdout.stringify(
          (fmt) =>
            fmt`${
              state === PersistentLineState.Default
                ? fmt`{info ${symbols[tick % symbols.length]}}`
                : fmt`{error ✕}`
            } ${loggable}`,
        ),
      )
      .join('\n');
    lastPersistentContentSize = persistentLineText.split('\n').length;

    if (persistentLineText.length > 0) {
      ui.stdout.write(persistentLineText);
    }
  };

  const log = (loggable: Loggable, options?: LogOptions) => {
    if (!ui.canLogLevel(options?.level ?? LogLevel.Info)) {
      return;
    }

    if (isInteractive) {
      logQueue.push([loggable, options]);
    } else {
      ui.log(loggable, options);
    }
  };

  const frame = () => {
    update();
    tick += 1;
  };

  const addPersistentLine = (loggable: Loggable): PersistentLineController => {
    if (!isInteractive) {
      log(loggable);
      return {remove: () => {}, fail: () => {}, update: () => {}};
    }

    const persistentLine: PersistentLine = {
      loggable,
      state: PersistentLineState.Default,
    };
    persistentLines.add(persistentLine);

    return {
      remove: () => persistentLines.delete(persistentLine),
      fail: () => {
        persistentLine.state = PersistentLineState.Error;
      },
      update: (loggable: Loggable) => {
        persistentLine.loggable = loggable;
      },
    };
  };

  const logSeparator = () => {
    if (!hasLoggedSection) {
      return;
    }

    log(
      (fmt) =>
        fmt`{subdued ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~}`,
    );
  };

  const runNested = async <T>(
    {id, persistentLine: initialPersistentLine}: RunNestedOptions,
    run: (runner: StepsRunner) => Promise<T>,
  ): Promise<T> => {
    const nestedLog = (loggable: Loggable, options?: LogOptions) => {
      log(
        (fmt) => fmt`{emphasis [${id}]} {subdued [${timestamp()}]} ${loggable}`,
        options,
      );
    };

    const persistentLine = addPersistentLine(initialPersistentLine);

    try {
      const result = await run({
        log: nestedLog,
        persistentLine,
        stepRunner: () => ({
          exec,
          log(loggable: Loggable, options?: LogOptions) {
            log(
              (fmt) =>
                fmt`{emphasis [${id}]} {subdued [${timestamp()}]} {info info}`,
              options,
            );
            log((fmt) => fmt`{subdued └} ${loggable}`, options);
          },
        }),
      });

      persistentLine.remove();
      return result;
    } catch (error) {
      persistentLine.fail();
      throw error;
    } finally {
      hasLoggedSection = true;
    }
  };

  const runSteps: Runner['steps'] = async (steps, {id, skip, separator}) => {
    if (steps.length === 0) {
      return;
    }

    const stepOrSteps = steps.length === 1 ? 'step' : 'steps';

    let skippedPreSteps = 0;
    let finishedPreSteps = 0;
    let failedPreSteps = 0;

    const createPersistentLabel = (): Loggable => {
      const resolvedSteps = skippedPreSteps + finishedPreSteps + failedPreSteps;

      if (resolvedSteps === 0) {
        return (fmt) =>
          fmt`{emphasis [${id}]} running ${steps.length.toLocaleString()} ${stepOrSteps}`;
      }

      return (fmt) => {
        const remainingSteps = steps.length - resolvedSteps;
        const errorPart =
          failedPreSteps > 0
            ? fmt`{error ${failedPreSteps.toLocaleString()} failed}`
            : false;
        const finishedPart =
          finishedPreSteps > 0
            ? fmt`{success ${finishedPreSteps.toLocaleString()} finished}`
            : false;
        const skippedPart =
          skippedPreSteps > 0
            ? fmt`{subdued ${skippedPreSteps.toLocaleString()} skipped}`
            : false;

        const runningPart =
          remainingSteps > 0
            ? `running ${remainingSteps.toLocaleString()}`
            : 'finished running';

        return fmt`{emphasis [${id}]} ${runningPart} ${
          remainingSteps === 1 ? 'step' : 'steps'
        } {subdued (}${[errorPart, finishedPart, skippedPart]
          .filter(Boolean)
          .join(fmt`{subdued , }`)}{subdued )}`;
      };
    };

    await runNested(
      {id, persistentLine: createPersistentLabel()},
      async ({log, stepRunner, persistentLine}) => {
        if (separator) {
          logSeparator();
        }

        log(`starting ${stepOrSteps}`);

        for (const step of steps) {
          if (skip && step.skip?.(skip)) {
            skippedPreSteps += 1;

            if (step.label) {
              log((fmt) => fmt`skipped step: {info ${step.label!}}`);
            } else {
              log(`skipped unlabeled step`);
            }

            persistentLine.update(createPersistentLabel());

            continue;
          }

          if (step.label) {
            log((fmt) => fmt`starting step: {info ${step.label!}}`);
          } else {
            log(`starting unlabeled step`);
          }

          try {
            await step.run(stepRunner(step));

            finishedPreSteps += 1;

            persistentLine.update(createPersistentLabel());

            if (step.label) {
              log((fmt) => fmt`finished step: {info ${step.label!}}`);
            }
          } catch (error) {
            failedPreSteps += 1;

            persistentLine.update(createPersistentLabel());

            if (step.label) {
              log((fmt) => fmt`failed during step: {info ${step.label!}}`);
            } else {
              log(`failed during unlabeled step`);
            }

            throw error;
          }
        }

        log(`finished ${stepOrSteps}`);
      },
    );
  };

  const interval: any = setInterval(frame, 60);

  try {
    const result = await run({
      log,
      nested: runNested,
      steps: runSteps,
      separator: logSeparator,
      epilogue: (loggable) => {
        logSeparator();
        log(loggable);
      },
      title: (title) => log((fmt) => fmt`🧵 {title ${title}}\n`),
      pre: (steps, skip) =>
        runSteps(steps, {id: 'pre', skip, separator: false}),
      post: (steps, skip) =>
        runSteps(steps, {id: 'post', skip, separator: true}),
    });

    update();

    return result;
  } catch (error) {
    update();

    if (error instanceof DiagnosticError) {
      ui.error('\n');
      ui.error(
        (fmt) =>
          fmt`{error Error} ${error.title || 'An unexpected error occurred'}`,
      );

      if (error.content) {
        ui.error('\n');
        ui.error(error.content);
      }

      if (error.suggestion) {
        ui.error('\n');
        ui.error((fmt) => fmt`{emphasis What do I do next?}`);
        ui.error(error.suggestion);
      }

      if (error.stack) {
        ui.error('\n');
        ui.error((fmt) => fmt`{subdued ${error.stack}}`);
      }
    } else {
      ui.error(
        (fmt) =>
          fmt`🧵 The following unexpected error occurred. We want to provide more useful suggestions when errors occur, so please open an issue on {link the sewing-kit repo https://github.com/Shopify/sewing-kit} so that we can improve this message.`,
      );
      // ui.log(error.message);

      if (error.all != null) {
        ui.error(error.all);
        ui.error(error.stack);
      } else if (error.stderr != null) {
        ui.error(error.stderr);
        ui.error(error.stack);
      } else if (error.stdout == null) {
        ui.error(error.stack);
      } else {
        ui.error(error.stdout);
        ui.error(error.stack);
      }
    }

    process.exitCode = 1;
  } finally {
    clearInterval(interval);
  }
}

function timestamp(date = new Date()) {
  const milliseconds = date.getMilliseconds();
  return `${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date
    .getSeconds()
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}
