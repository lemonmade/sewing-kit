import {cpus, freemem} from 'os';
import exec from 'execa';
import {Workspace} from '@sewing-kit/model';

import {
  Step,
  LogLevel,
  Loggable,
  LogOptions,
  StepResources,
  StepRunner as NestedStepRunner,
} from './types';
import {Ui} from './ui';
import {logError} from './errors';

type Arguments<T> = T extends (...args: infer U) => any ? U : never;

const symbols = '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆';

interface FlagNames {
  readonly skip?: string;
  readonly include?: string;
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

interface FocusedStep {
  readonly step: Step;
  counts: StepCounts;
  content?: Loggable;
  subSteps?: Set<FocusedSubStep>;
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

export interface StepGroupDetails {
  readonly steps: readonly StepDetails[];
  readonly skip?: readonly string[];
  readonly include?: readonly string[];
  readonly flagNames?: FlagNames;
}

export interface RunOptions {
  readonly title: string;
  readonly pre: StepGroupDetails;
  readonly post: StepGroupDetails;
  readonly steps: StepGroupDetails;
  epilogue?(log: Ui['log']): any;
}

export async function run(
  ui: Ui,
  {title, pre, post, steps, epilogue}: RunOptions,
) {
  let tick = 0;
  let lastPersistentContentSize = 0;

  const isInteractive = process.stdout.isTTY;
  const logQueue: Arguments<Ui['log']>[] = [];

  const pastAlerts = new PersistentSection();
  const activeStepGroup = new PersistentSection();
  const persistentSections = new Set<PersistentSection>([
    new PersistentSection(
      (fmt) => fmt`{subdued ${repeatWithTerminalWidth('=')}}`,
    ),
    pastAlerts,
    activeStepGroup,
  ]);

  const update = () => {
    if (!isInteractive) return;

    if (lastPersistentContentSize > 0) {
      ui.stdout.moveCursor(0, -1 * Math.max(0, lastPersistentContentSize - 1));
      ui.stdout.clearDown();
    }

    for (const queued of logQueue) {
      ui.log(...queued);
    }

    logQueue.length = 0;

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

  const logSeparator = () => {
    log((fmt) => fmt`{subdued ${repeatWithTerminalWidth('~')}}`);
  };

  const repeatWithTerminalWidth = (content: string) =>
    content.repeat(process.stdout.columns ?? 30);

  const runSteps = async ({
    label,
    skip,
    steps,
    include,
    separator,
    flagNames,
  }: StepGroupDetails & {
    readonly label: string;
    readonly separator: boolean;
  }) => {
    if (steps.length === 0) {
      return;
    }

    const stepQueue = new StepQueue();

    const focusedSteps = new Set<FocusedStep>();

    let skippedSteps = 0;
    let finishedSteps = 0;
    let failedSteps = 0;
    let hasLogged = false;

    const checkStep = createChecker(skip, include);

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
        remainingSteps > 0
          ? `running ${steps.length.toLocaleString()}`
          : 'finished running';

      return fmt`{info ${
        symbols[tick % symbols.length]
      }} {emphasis [${label}]} ${runningPart} ${
        steps.length === 1 ? 'step' : 'steps'
      } {subdued (}${[errorPart, finishedPart, skippedPart, remainingPart]
        .filter(Boolean)
        .join(fmt`{subdued , }`)}{subdued )}${
        focusedSteps.size > 0 ? '\n' : ''
      }${[...focusedSteps]
        .map(
          ({step, content}) =>
            fmt`  {subdued └} runnning step {emphasis ${step.label!}}${
              content ? fmt`\n  ${content}` : ''
            }`,
        )
        .join('\n')}`;
    });

    const createStepRunner = (
      parent: Step,
      target: StepTarget,
      focused: FocusedStep,
    ): NestedStepRunner => {
      const subStepLog: typeof groupLog = (loggable) =>
        groupLog(
          (fmt) => fmt`${loggable} {subdued (started by "${parent.label}")}`,
        );

      async function runNested(
        steps: readonly Step[],
        target: StepTarget,
        parents: readonly Step[],
      ) {
        if (steps.length === 0) {
          return;
        }

        focused.counts.total += steps.length;

        for (const step of steps) {
          subStepLog((fmt) => fmt`starting sub-step {info ${step.label!}}`);
          groupLog(createStepDebugLog(step, parents, target, flagNames));

          const permission = checkStep(step);

          if (
            permission === StepRunPermission.Excluded ||
            permission === StepRunPermission.Skipped
          ) {
            focused.counts.skip += 1;

            subStepLog((fmt) => fmt`skipped sub-step: {info ${step.label!}}`);

            groupLog(
              (fmt) =>
                `skip reason: ${
                  permission === StepRunPermission.Excluded
                    ? fmt`not included in include patterns: {code ${include!.join(
                        ' ',
                      )}}`
                    : fmt`omitted by skip patterns: {code ${skip!.join(' ')}}`
                }`,
              {level: LogLevel.Debug},
            );
          }

          try {
            await step.run({
              exec,
              indefinite(run) {
                // need to indicate there is an indefinite task
                run();
              },
              stdio: {
                stdout: {} as any,
                stderr: {} as any,
                stdin: {} as any,
              },
              status(_status: Loggable) {},
              log(loggable: Loggable, options?: LogOptions) {
                groupLog(
                  (fmt) => fmt`log from {info ${parent.label}}`,
                  options,
                );
                log(loggable, options);
              },
              runNested: (steps) =>
                runNested(steps, target, [...parents, step]),
            });

            // eslint-disable-next-line require-atomic-updates
            focused.counts.finished += 1;

            if (step.label) {
              subStepLog((fmt) => fmt`finished sub-step {info ${step.label!}}`);
            }
          } catch (error) {
            // eslint-disable-next-line require-atomic-updates
            focused.counts.fail += 1;

            subStepLog(
              (fmt) => fmt`failed during sub-step {error ${step.label!}}`,
            );

            throw error;
          }
        }
      }

      return {
        exec,
        indefinite(run) {
          // need to indicate there is an indefinite task
          run();
        },
        stdio: {stdout: {} as any, stderr: {} as any, stdin: {} as any},
        status(_status: Loggable) {},
        log(loggable: Loggable, options?: LogOptions) {
          groupLog((fmt) => fmt`log from ${parent.label}`, options);
          log(loggable, options);
        },
        runNested: (steps) => runNested(steps, target, [parent]),
      };
    };

    if (separator) {
      logSeparator();
    }

    const stepPromises = steps.map(({step, target}) =>
      stepQueue.enqueue(step, async () => {
        const focusedStep: FocusedStep = {
          step,
          counts: {fail: 0, skip: 0, finished: 0, total: 0},
        };

        groupLog((fmt) => fmt`starting step {info ${step.label}}`);
        groupLog(createStepDebugLog(step, [], target, flagNames), {
          level: LogLevel.Debug,
        });

        const permission = checkStep(step);

        if (
          permission === StepRunPermission.Excluded ||
          permission === StepRunPermission.Skipped
        ) {
          skippedSteps += 1;

          groupLog((fmt) => fmt`skipped step: {info ${step.label}}`);
          groupLog(
            (fmt) =>
              `skip reason: ${
                permission === StepRunPermission.Excluded
                  ? fmt`not included in include patterns: {code ${include!.join(
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
        //   they actually included that did something weird!)
        // - Resource usage/ waited for other tasks

        // Something like:

        //   project: web (web-app:web if needs specificity)
        //   steps: SewingKit.BuildPackage > _Webpack.BuildWebApp_
        //   from plugins: Quilt.WebApp > _Webpack.WebApp_

        focusedSteps.add(focusedStep);

        try {
          await step.run(createStepRunner(step, target, focusedStep));

          finishedSteps += 1;
          focusedSteps.delete(focusedStep);

          if (step.label) {
            groupLog((fmt) => fmt`finished step {info ${step.label!}}`);
          }
        } catch (error) {
          failedSteps += 1;

          groupLog((fmt) => fmt`failed during step {info ${step.label!}}`);

          throw error;
        }
      }),
    );

    await Promise.all(stepPromises);
  };

  let interval: any;
  let spinnerInterval: any;

  if (isInteractive) {
    interval = setInterval(update, 16);
    spinnerInterval = setInterval(() => {
      tick += 1;
    }, 60);
  }

  try {
    log((fmt) => fmt`🧵 {title ${title}}\n`);

    await runSteps({label: 'pre', separator: false, ...pre});
    await runSteps({label: title, separator: true, ...steps});
    await runSteps({label: 'post', separator: true, ...post});

    if (epilogue) {
      logSeparator();
      await epilogue(log);
    }

    update();
  } catch (error) {
    update();
    logError(error, ui);
    // eslint-disable-next-line require-atomic-updates
    process.exitCode = 1;
  } finally {
    if (interval) clearInterval(interval);
    if (spinnerInterval) clearInterval(spinnerInterval);
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
  NotExcluded,
  NotExcludedAndNotSkipped,
}

function createChecker(skip?: readonly string[], include?: readonly string[]) {
  const isExplicitlySkipped = skip?.length
    ? createCheckerFromIds(skip)
    : undefined;

  const isExplicitlyIncluded = include?.length
    ? createCheckerFromIds(include)
    : undefined;

  return (step: Step) => {
    if (isCorePluginId(step.id)) {
      return StepRunPermission.Default;
    }

    if (isExplicitlyIncluded && !isExplicitlyIncluded(step))
      return StepRunPermission.Excluded;

    if (isExplicitlySkipped) {
      if (isExplicitlySkipped(step)) return StepRunPermission.Skipped;
      return isExplicitlyIncluded
        ? StepRunPermission.NotExcludedAndNotSkipped
        : StepRunPermission.NotSkipped;
    }

    return isExplicitlyIncluded
      ? StepRunPermission.NotExcluded
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

interface Plugin {
  readonly id: string;
  readonly package: string;
  readonly parent?: Plugin;
}

function createStepDebugLog(
  step: Step,
  ancestors: readonly Step[],
  target: StepTarget,
  {skip, include}: FlagNames = {},
): Loggable {
  const source = step.source as Plugin | undefined;

  // const projectPart =
  const targetPart: Loggable =
    target instanceof Workspace
      ? (fmt) =>
          fmt`workspace {emphasis ${target.name}} {subdued (${target.root})}`
      : (fmt) => fmt`${target.id} {subdued (${target.root})}`;
  const sourcePart = createStepDebugSourceLog(step);

  let flagsPart: Loggable;

  if (source != null) {
    const includeContent = [
      step.id,
      ...ancestors
        .map((ancestor) => (isCorePluginId(ancestor.id) ? false : ancestor.id))
        .filter(Boolean),
    ];

    if (skip && include) {
      flagsPart = (fmt) =>
        fmt`\n\nto skip this step, add {code --${skip} ${
          step.id
        }} to your command.\nto isolate this step, add {code --${include} ${includeContent.join(
          ',',
        )}} to your command.`;
    } else if (skip) {
      flagsPart = (fmt) =>
        fmt`\n\nto skip this step, add {code --${skip} ${step.id}} to your command.`;
    } else if (include) {
      flagsPart = (fmt) =>
        fmt`\n\nto isolate this step, add {code --${include} ${includeContent.join(
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

function isCorePluginId(id: string) {
  return id.startsWith('SewingKit.');
}

function label(text: string): Loggable {
  return `${text}:`.padEnd(8, ' ');
}

function createStepDebugSourceLog(step: Step): Loggable {
  const source = step.source as Plugin;

  const stack: string[] = source ? [source.id] : [];

  let currentParent = source?.parent;

  while (currentParent != null) {
    stack.push(currentParent.id);
    currentParent = currentParent.parent;
  }

  const [userAdded, ...rest] = stack.reverse();
  const restPart = rest.length > 0 ? ` > ${rest.join(' > ')}` : '';

  if (source == null)
    return (fmt) => fmt`created by Sewing Kit {subdued (can’t be skipped)}`;

  return (fmt) =>
    fmt`${
      rest.length > 0 ? 'plugin chain' : 'plugin'
    } {emphasis ${userAdded}}${restPart}`;
}
