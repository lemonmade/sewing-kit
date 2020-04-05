/* eslint require-atomic-updates: off */

import {cpus, freemem} from 'os';
import {cursorTo, clearScreenDown, emitKeypressEvents} from 'readline';

import exec from 'execa';
import signalExit from 'signal-exit';
import {Workspace} from '@sewing-kit/model';

import {
  Step,
  LogLevel,
  Loggable,
  LogOptions,
  StepResources,
  StepRunner as NestedStepRunner,
} from '@sewing-kit/core';

import {TaskContext, logError, StepInclusionFlag} from './common';
import {Ui} from './ui';
import {StreamController} from './streams';

type Arguments<T> = T extends (...args: infer U) => any ? U : never;

const symbols = '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆';

interface FlagNames {
  readonly skip?: string;
  readonly isolate?: string;
}

interface RunnerOptions {
  readonly flagNames?: FlagNames;
}

interface StepCounts {
  finished: number;
  fail: number;
  skip: number;
  total: number;
}

interface FocusedSubStep {
  readonly step: Step;
  content?: Loggable;
}

enum FocusedStepState {
  Running,
  Succeeded,
  Failed,
  Skipped,
}

interface FocusedStep {
  readonly step: Step;
  state: FocusedStepState;
  counts: StepCounts;
  content?: Loggable;
  subSteps?: Set<FocusedSubStep>;
}

enum ControlCharacter {
  ShowCursor = '\u001B[?25h',
  HideCursor = '\u001B[?25l',
  Clear = '\x1b[2J',
  Escape = '\u001b',
  ControlC = '\u0003',
}

class PersistentSection {
  get content() {
    return this.currentContent;
  }

  constructor(private currentContent: Loggable = '') {}

  update(content: Loggable) {
    this.currentContent = content;
  }
}

export type StepTarget =
  | import('@sewing-kit/model').Project
  | import('@sewing-kit/model').Workspace;

export interface StepDetails {
  readonly step: Step;
  readonly target: StepTarget;
}

export interface RunOptions {
  readonly title: string;
  readonly pre: readonly Step[];
  readonly post: readonly Step[];
  readonly steps: readonly StepDetails[];
  epilogue?(log: Ui['log']): any;
}

interface StepGroupDetails {
  readonly steps: readonly StepDetails[];
  readonly skip?: readonly string[];
  readonly isolate?: readonly string[];
  readonly flagNames?: FlagNames;
  readonly label: string;
  readonly separator: boolean;
}

interface IndefiniteStep {
  readonly run: Parameters<NestedStepRunner['indefinite']>[0];
  readonly step: Step;
  readonly group: string;
}

// @see https://github.com/sindresorhus/ora/blob/master/index.js (useful for implementing stdout/stdin things)
export async function run(
  context: TaskContext,
  {title, pre, post, steps, epilogue}: RunOptions,
) {
  const {ui, workspace, steps: stepTracker} = context;

  const isInteractive = ui.stdout.stream.isTTY;
  const logQueue: Arguments<Ui['log']>[] = [];
  const pastAlerts = new PersistentSection();
  const activeStepGroup = new PersistentSection();
  const indefiniteTaskSwitcher = new PersistentSection();
  const persistentSections = new Set<PersistentSection>([
    new PersistentSection(
      (fmt) => fmt`{subdued ${repeatWithTerminalWidth('=')}}`,
    ),
    pastAlerts,
    activeStepGroup,
    indefiniteTaskSwitcher,
  ]);

  const indefiniteSteps = new Set<IndefiniteStep>();

  let interval: any;
  let spinnerInterval: any;
  let tick = 0;
  let lastPersistentContentSize = 0;

  const start = () => {
    if (isInteractive) {
      hideCursor(ui.stdout.stream);
      interval = setInterval(update, 30);
      spinnerInterval = setInterval(() => {
        tick = (tick + 1) % symbols.length;
      }, 60);
    }
  };

  const clear = () => {
    if (!isInteractive) return;

    let line = 0;

    while (line < lastPersistentContentSize) {
      if (line > 0) {
        ui.stdout.stream.moveCursor(0, -1);
      }

      ui.stdout.stream.clearLine(0);
      ui.stdout.stream.cursorTo(0);

      line += 1;
    }

    for (const queued of logQueue) {
      ui.log(...queued);
    }

    logQueue.length = 0;
    lastPersistentContentSize = 0;
  };

  const update = () => {
    if (!isInteractive) return;

    clear();

    const persistentContent = [...persistentSections]
      .map(({content}) => ui.stdout.stringify(content).trim())
      .filter(Boolean)
      .join('\n');

    lastPersistentContentSize = persistentContent.split('\n').length;

    if (persistentContent.length > 0) {
      ui.stdout.write(persistentContent);
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

  start();

  const logSeparator = (symbol = '~') => {
    log((fmt) => fmt`{subdued ${repeatWithTerminalWidth(symbol)}}`);
  };

  const repeatWithTerminalWidth = (content: string) =>
    content.repeat(process.stdout.columns ?? 80);

  const runSteps = async ({
    label,
    skip,
    steps,
    isolate,
    separator,
    flagNames,
  }: StepGroupDetails) => {
    if (steps.length === 0) {
      return;
    }

    const stepQueue = new StepQueue();
    const focusedSteps = new Set<FocusedStep>();
    const uiTimeouts = new Set<ReturnType<typeof setTimeout>>();

    let skippedSteps = 0;
    let finishedSteps = 0;
    let failedSteps = 0;
    let hasLogged = false;

    const checkStep = createChecker(skip, isolate);

    const groupLog: typeof log = (loggable, options) => {
      if (!hasLogged) {
        hasLogged = true;
        log((fmt) => fmt`{emphasis [${label}]}`);
      }

      log((fmt) => fmt`{subdued [${timestamp()}]} ${loggable}`, options);
    };

    activeStepGroup.update((fmt) => {
      const resolvedSteps = skippedSteps + finishedSteps + failedSteps;
      const remainingSteps = steps.length - resolvedSteps;

      const errorPart =
        failedSteps > 0
          ? fmt`{error ${failedSteps.toLocaleString()} ✕}`
          : false;
      const finishedPart =
        finishedSteps > 0
          ? fmt`{success ${finishedSteps.toLocaleString()} ✓}`
          : false;
      const skippedPart =
        skippedSteps > 0
          ? fmt`{subdued ${skippedSteps.toLocaleString()} ⌦}`
          : false;
      const remainingPart =
        remainingSteps > 0
          ? fmt`{subdued ${remainingSteps.toLocaleString()} …}`
          : false;

      const runningPart =
        // eslint-disable-next-line no-nested-ternary
        failedSteps > 0
          ? `failed while running ${steps.length.toLocaleString()}`
          : remainingSteps > 0
          ? `running ${steps.length.toLocaleString()}`
          : 'finished running';

      const title: Loggable =
        failedSteps > 0
          ? (fmt) => fmt`{error ✕ {emphasis [${label}]}}`
          : (fmt) => fmt`{info ${symbols[tick]}} {emphasis [${label}]}`;

      const stepCounts: Loggable =
        steps.length > 1
          ? (fmt) =>
              fmt` {subdued (}${[
                errorPart,
                finishedPart,
                skippedPart,
                remainingPart,
              ]
                .filter(Boolean)
                .join(fmt`{subdued , }`)}{subdued )}`
          : '';

      return fmt`${title} ${runningPart} ${
        steps.length === 1 ? 'step' : 'steps'
      }${stepCounts}${focusedSteps.size > 0 ? '\n' : ''}${[...focusedSteps]
        .map(
          ({step, content, state}) =>
            fmt`  {subdued └} ${(fmt) => {
              switch (state) {
                case FocusedStepState.Failed:
                  return fmt`{error ✕}`;
                case FocusedStepState.Succeeded:
                  return fmt`{success ✓}`;
                default:
                  return fmt`{info ${symbols[tick]}}`;
              }
            }} ${step.label}${content ? fmt`\n  ${content}` : ''}`,
        )
        .join('\n')}`;
    });

    const createStepRunner = (
      parent: Step,
      target: StepTarget,
      focused: FocusedStep,
    ): NestedStepRunner => {
      const subStepLog: typeof groupLog = (loggable, options = {}) =>
        groupLog(
          (fmt) => fmt`${loggable} {subdued (started by "${parent.label}")}`,
          {level: LogLevel.Debug, ...options},
        );

      async function runNested(steps: readonly Step[], target: StepTarget) {
        if (steps.length === 0) {
          return;
        }

        focused.counts.total += steps.length;

        for (const step of steps) {
          stepTracker.setStepParent(step, parent);
          subStepLog((fmt) => fmt`starting sub-step {info ${step.label}}`);
          groupLog(createStepDebugLog(step, target, context, {flagNames}), {
            level: LogLevel.Debug,
          });

          const permission = checkStep(step);

          if (
            permission === StepRunPermission.Excluded ||
            permission === StepRunPermission.Skipped
          ) {
            focused.counts.skip += 1;

            subStepLog((fmt) => fmt`skipped sub-step {info ${step.label}}`);

            groupLog(
              (fmt) =>
                `skip reason: ${
                  permission === StepRunPermission.Excluded
                    ? fmt`not isolated in isolate patterns: {code ${isolate!.join(
                        ' ',
                      )}}`
                    : fmt`omitted by skip patterns: {code ${skip!.join(' ')}}`
                }`,
              {level: LogLevel.Debug},
            );
          }

          const stepLog = (loggable: Loggable, options?: LogOptions) => {
            groupLog((fmt) => fmt`log from {info ${parent.label}}`, options);
            log(loggable, options);
          };

          try {
            await step.run({
              exec: (...args) => {
                stepLog(
                  (fmt) =>
                    fmt`executing command: {subdued ${args[0]}${
                      Array.isArray(args[1])
                        ? ` ${(args[1] as any[]).join(' ')}`
                        : ''
                    }}`,
                );

                return exec(...(args as [any]));
              },
              indefinite(run) {
                indefiniteSteps.add({step, run, group: label});
              },
              status(_status: Loggable) {},
              log: stepLog,
              runNested: (steps) => runNested(steps, target),
            });

            focused.counts.finished += 1;

            if (step.label) {
              subStepLog((fmt) => fmt`finished sub-step {info ${step.label}}`);
            }
          } catch (error) {
            focused.counts.fail += 1;

            subStepLog(
              (fmt) => fmt`failed during sub-step {error ${step.label}}`,
            );

            throw error;
          }
        }
      }

      const stepLog = (loggable: Loggable, options?: LogOptions) => {
        groupLog((fmt) => fmt`log from {info ${parent.label}}`, options);
        log(loggable, options);
      };

      return {
        exec: (...args) => {
          stepLog(
            (fmt) =>
              fmt`executing command: {subdued ${args[0]}${
                Array.isArray(args[1]) ? ` ${(args[1] as any[]).join(' ')}` : ''
              }}`,
          );

          return exec(...(args as [any]));
        },
        indefinite(run) {
          indefiniteSteps.add({step: parent, run, group: label});
        },
        status(_status: Loggable) {},
        log: stepLog,
        runNested: (steps) => runNested(steps, target),
      };
    };

    if (separator) {
      logSeparator();
    }

    const stepPromises = steps.map(({step, target}) =>
      stepQueue.enqueue(step, async () => {
        const focusedStep: FocusedStep = {
          step,
          state: FocusedStepState.Running,
          counts: {fail: 0, skip: 0, finished: 0, total: 0},
        };

        groupLog((fmt) => fmt`starting step {info ${step.label}}`);
        groupLog(createStepDebugLog(step, target, context, {flagNames}), {
          level: LogLevel.Debug,
        });

        const permission = checkStep(step);

        if (
          permission === StepRunPermission.Excluded ||
          permission === StepRunPermission.Skipped
        ) {
          skippedSteps += 1;
          focusedStep.state = FocusedStepState.Succeeded;

          groupLog((fmt) => fmt`skipped step: {info ${step.label}}`);
          groupLog(
            (fmt) =>
              `skip reason: ${
                permission === StepRunPermission.Excluded
                  ? fmt`not isolated in isolate patterns: {code ${isolate!.join(
                      ' ',
                    )}}`
                  : fmt`omitted by skip patterns: {code ${skip!.join(' ')}}`
              }`,
            {level: LogLevel.Debug},
          );

          return;
        }

        // Should change step to have mandatory ID + label, source is a real plugin.
        // Then, have plugins save their ancestors.
        // Then, for every step, we can log:
        // - Project: {project id, usable for --focus}
        // - Step ancestry (parents and children, highlight this step)
        // - Plugin hierarchy for the source plugin (leads them back to the plugin
        //   they actually isolated that did something weird!)
        // - Resource usage/ waited for other tasks

        // Something like:

        //   project: web (web-app:web if needs specificity)
        //   steps: SewingKit.BuildPackage > _Webpack.BuildWebApp_
        //   from plugins: Quilt.WebApp > _Webpack.WebApp_

        focusedSteps.add(focusedStep);

        try {
          await step.run(createStepRunner(step, target, focusedStep));

          finishedSteps += 1;
          focusedStep.state = FocusedStepState.Succeeded;
          focusedSteps.delete(focusedStep);

          if (step.label) {
            groupLog((fmt) => fmt`finished step {info ${step.label}}`);
          }
        } catch (error) {
          failedSteps += 1;
          focusedStep.state = FocusedStepState.Failed;

          groupLog((fmt) => fmt`failed during step {info ${step.label}}`);

          throw error;
        }
      }),
    );

    try {
      await Promise.all(stepPromises);
    } finally {
      for (const timeout of uiTimeouts) {
        clearTimeout(timeout);
      }
    }
  };

  try {
    log((fmt) => fmt`🧵 {title ${title}}\n`);

    await runSteps({
      label: 'pre',
      separator: false,
      steps: pre.map((step) => ({target: workspace, step})),
      skip: stepTracker.inclusion.skipPreSteps,
      isolate: stepTracker.inclusion.isolatePreSteps,
      flagNames: {
        skip: StepInclusionFlag.SkipPreStep,
        isolate: StepInclusionFlag.IsolatePreStep,
      },
    });

    await runSteps({
      label: title,
      separator: pre.length > 0,
      steps,
      skip: stepTracker.inclusion.skipSteps,
      isolate: stepTracker.inclusion.isolateSteps,
      flagNames: {
        skip: StepInclusionFlag.SkipStep,
        isolate: StepInclusionFlag.IsolateStep,
      },
    });

    await runSteps({
      label: 'post',
      separator: steps.length + pre.length > 0,
      steps: post.map((step) => ({target: workspace, step})),
      skip: stepTracker.inclusion.skipPostSteps,
      isolate: stepTracker.inclusion.isolatePostSteps,
      flagNames: {
        skip: StepInclusionFlag.SkipPostStep,
        isolate: StepInclusionFlag.IsolatePostStep,
      },
    });

    if (epilogue) {
      logSeparator('=');
      await epilogue(log);
    }

    clear();
    ui.stdout.write('\n');
  } catch (error) {
    update();
    ui.stdout.write('\n\n');
    logError(error, ui.error.bind(ui));
    process.exitCode = 1;
  } finally {
    if (interval) clearInterval(interval);
    if (spinnerInterval) clearInterval(spinnerInterval);
  }

  if (indefiniteSteps.size === 0) {
    return;
  }

  let activeController: StreamController | null = null;
  const indefiniteTasks: {
    controller: StreamController;
    step: Step;
    group: string;
  }[] = [];

  const print = () => {
    showCursor(ui.stdout.stream);
    cursorTo(ui.stdout.stream, 0, 0);
    clearScreenDown(ui.stdout.stream);
    hideCursor(ui.stdout.stream);

    ui.stdout.write(
      (fmt) =>
        fmt`🧵 {title sewing-kit interactive mode}\n{subdued (press a number to see that step’s output)}\n\n`,
    );

    for (const [index, {step}] of indefiniteTasks.entries()) {
      ui.stdout.write(
        (fmt) =>
          fmt`{emphasis ${String(index + 1)}.} ${step.label} {subdued [${
            step.id
          }]}\n`,
      );
    }
  };

  process.stdin.setRawMode(true);
  emitKeypressEvents(process.stdin);
  process.stdin.on(
    'keypress',
    (_: Buffer, {name: key, ctrl}: {name: string; ctrl: boolean}) => {
      if (key === 'c' && ctrl) {
        process.emit('SIGINT' as any);
      } else if (key === 'escape') {
        activeController?.background();
        activeController = null;
        print();
      } else {
        const parsed = Number.parseInt(key, 10);
        if (Number.isNaN(parsed)) {
          return;
        }

        const task = indefiniteTasks[parsed - 1];

        if (task == null) {
          return;
        }

        activeController = task.controller;

        showCursor(ui.stdout.stream);
        cursorTo(ui.stdout.stream, 0, 0);
        clearScreenDown(ui.stdout.stream);
        hideCursor(ui.stdout.stream);

        activeController.foreground();
        ui.stdout.write(
          (fmt) =>
            fmt`\n\n🧵 {emphasis note:} sewing-kit has restored the output for {info ${task.step.label}}.\n{subdued press <escape> to return to the list of all active steps}\n\n`,
        );
      }
    },
  );

  for (const {step, run, group} of indefiniteSteps) {
    const controller = new StreamController(ui.stdout.stream, ui.stderr.stream);

    indefiniteTasks.push({controller, step, group});

    run({stdio: controller});
  }

  print();
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

interface StepQueueRunner {
  run(run: () => Promise<void>): Promise<void>;
}

class StepQueue {
  private readonly cpus: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  private readonly memory: number;
  private readonly runners = new Set<StepQueueRunner>();
  private readonly availableRunners: StepQueueRunner[] = [];
  private readonly queue: (() => Promise<void>)[] = [];

  private get isUnderinitialized() {
    return this.runners.size < this.cpus;
  }

  constructor({cpu = cpus().length, memory = freemem()}: StepResources = {}) {
    this.cpus = cpu;
    this.memory = memory;
  }

  enqueue(_step: Step, run: () => Promise<void>) {
    // const {resources: {cpu: defaultCpu, memory} = {}} = step;
    // const cpu = defaultCpu ?? 1;

    // if (cpu > this.cpus || memory > this.memory) {
    //   `The step asked for the following resources:\n\n  cpu: ${
    //     memory == null ? '' : '   '
    //   }${cpu}${defaultCpu == null ? ' (default)' : ''}${
    //     memory == null ? '' : `\n  memory: ${memory}`
    //   }\n\nBut the user has only allocated the following resources:\n\n  cpu:    ${
    //     this.cpus
    //   }\n  memory: ${this.memory}`,
    // }

    let runner: StepQueueRunner;

    if (this.isUnderinitialized) {
      runner = {
        run: async (run) => {
          try {
            await run();
          } finally {
            this.release(runner);
          }
        },
      };

      this.runners.add(runner);
      return runner.run(run);
    } else if (this.availableRunners.length > 0) {
      return this.availableRunners.pop()!.run(run);
    } else {
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            await run();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  private release(runner: StepQueueRunner) {
    if (this.queue.length > 0) {
      const work = this.queue.shift()!;
      process.nextTick(() => runner.run(work));
    } else {
      this.availableRunners.push(runner);
    }
  }
}

enum StepRunPermission {
  Default,
  Skipped,
  NotSkipped,
  Excluded,
  Isolated,
  IsolatedAndNotSkipped,
}

function createChecker(skip?: readonly string[], isolate?: readonly string[]) {
  const isExplicitlySkipped = skip?.length
    ? createCheckerFromIds(skip)
    : undefined;

  const isExplicitlyIsolated = isolate?.length
    ? createCheckerFromIds(isolate)
    : undefined;

  return (step: Step) => {
    if (isCoreId(step.id)) {
      return StepRunPermission.Default;
    }

    if (isExplicitlyIsolated && !isExplicitlyIsolated(step))
      return StepRunPermission.Excluded;

    if (isExplicitlySkipped) {
      if (isExplicitlySkipped(step)) return StepRunPermission.Skipped;
      return isExplicitlyIsolated
        ? StepRunPermission.IsolatedAndNotSkipped
        : StepRunPermission.NotSkipped;
    }

    return isExplicitlyIsolated
      ? StepRunPermission.Isolated
      : StepRunPermission.Default;
  };
}

function createCheckerFromIds(ids: readonly string[]) {
  const regex = new RegExp(
    `^${ids
      .map((id) =>
        id
          .toLowerCase()
          .split(/\.+/g)
          .map((part) => (part === '*' ? '[^\\.]+' : part))
          .join('\\.'),
      )
      .join('|')}$`,
    'i',
  );

  return (step: Step) => regex.test(step.id);
}

function createStepDebugLog(
  step: Step,
  target: StepTarget,
  context: TaskContext,
  {flagNames: {skip, isolate} = {}}: RunnerOptions = {},
): Loggable {
  const targetPart: Loggable =
    target instanceof Workspace
      ? (fmt) =>
          fmt`workspace {emphasis ${target.name}} {subdued (${target.root})}`
      : (fmt) => fmt`${target.id} {subdued (${target.root})}`;
  const sourcePart = createStepDebugSourceLog(step, context);

  let flagsPart: Loggable;

  const isolateContent = [
    step.id,
    ...context.steps
      .getStepAncestors(step)
      .map((ancestor) => (isCoreId(ancestor.id) ? false : ancestor.id))
      .filter(Boolean),
  ];

  if (!isCoreId(step.id)) {
    if (skip && isolate) {
      flagsPart = (fmt) =>
        fmt`\n\nto skip this step, add {code ${skip} ${
          step.id
        }} to your command.\nto isolate this step, add {code ${isolate} ${isolateContent.join(
          ',',
        )}} to your command.`;
    } else if (skip) {
      flagsPart = (fmt) =>
        fmt`\n\nto skip this step, add {code ${skip} ${step.id}} to your command.`;
    } else if (isolate) {
      flagsPart = (fmt) =>
        fmt`\n\nto isolate this step, add {code ${isolate} ${isolateContent.join(
          ',',
        )}} to your command.`;
    }
  }

  return (fmt) =>
    fmt`reason for step {info ${step.label}} {subdued (${
      step.id
    })}:\n\n  {subdued ${label('target')}}${targetPart}\n  {subdued ${label(
      'source',
    )}}${sourcePart}${flagsPart}\n`;
}

function isCoreId(id: string) {
  return id.startsWith('SewingKit.');
}

function label(text: string): Loggable {
  return `${text}:`.padEnd(8, ' ');
}

function createStepDebugSourceLog(
  step: Step,
  {plugins, steps}: TaskContext,
): Loggable {
  const source = steps.getSource(step);

  if (source == null)
    return (fmt) => fmt`created by Sewing Kit {subdued (can’t be skipped)}`;

  const stack = [
    source.id,
    ...plugins.ancestorsForPlugin(source).map(({id}) => id),
  ];

  const [userAdded, ...rest] = stack.reverse();
  const restPart = rest.length > 0 ? ` > ${rest.join(' > ')}` : '';

  return (fmt) =>
    fmt`${
      rest.length > 0 ? 'plugin chain' : 'plugin'
    } {emphasis ${userAdded}}${restPart}`;
}

let listeningToReshowCursor = false;

// @see https://github.com/sindresorhus/cli-cursor/blob/master/index.js
// @see https://github.com/sindresorhus/restore-cursor/blob/master/index.js
function hideCursor(stream: NodeJS.WriteStream) {
  if (!listeningToReshowCursor) {
    listeningToReshowCursor = true;
    signalExit(
      () => {
        stream.write(ControlCharacter.ShowCursor);
      },
      {alwaysLast: true},
    );
  }

  stream.write(ControlCharacter.HideCursor);
}

function showCursor(stream: NodeJS.WriteStream) {
  stream.write(ControlCharacter.ShowCursor);
}
