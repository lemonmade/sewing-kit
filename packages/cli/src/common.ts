import {Readable, Writable} from 'stream';
import arg, {Result, Spec} from 'arg';

import {loadWorkspace, LoadedWorkspace} from '@sewing-kit/config/load';
import {AnyPlugin, PluginApi} from '@sewing-kit/plugins';
import {WaterfallHook, SeriesHook} from '@sewing-kit/hooks';
import {WorkspaceTasks, ProjectTasks} from '@sewing-kit/tasks';
import {Step, isDiagnosticError, Log, LogLevel} from '@sewing-kit/core';
import {Package, Service, WebApp} from '@sewing-kit/model';

import {Ui} from './ui';

export interface TaskContext extends LoadedWorkspace {
  readonly ui: Ui;
  readonly steps: StepTracker;
}

export enum StepInclusionFlag {
  SkipStep = '--skip-step',
  SkipPreStep = '--skip-pre-step',
  SkipPostStep = '--skip-post-step',
  IsolateStep = '--isolate-step',
  IsolatePreStep = '--isolate-pre-step',
  IsolatePostStep = '--isolate-post-step',
}

interface StepInclusionOptions {
  readonly skipSteps?: readonly string[];
  readonly skipPreSteps?: readonly string[];
  readonly skipPostSteps?: readonly string[];
  readonly isolateSteps?: readonly string[];
  readonly isolatePreSteps?: readonly string[];
  readonly isolatePostSteps?: readonly string[];
}

const defaultStepInclusionFlags = {
  [StepInclusionFlag.SkipStep]: [String] as [StringConstructor],
  [StepInclusionFlag.SkipPreStep]: [String] as [StringConstructor],
  [StepInclusionFlag.SkipPostStep]: [String] as [StringConstructor],
  [StepInclusionFlag.IsolateStep]: [String] as [StringConstructor],
  [StepInclusionFlag.IsolatePreStep]: [String] as [StringConstructor],
  [StepInclusionFlag.IsolatePostStep]: [String] as [StringConstructor],
};

export function createCommand<Flags extends Spec>(
  flagSpec: Flags,
  run: (flags: Result<Flags>, context: TaskContext) => Promise<void>,
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
    const {
      '--root': root = process.cwd(),
      '--log-level': logLevel,
      ...flags
    } = arg(
      {
        ...flagSpec,
        '--root': String,
        '--log-level': String,
        ...defaultStepInclusionFlags,
      },
      {argv},
    );

    const ui = new Ui({
      ...(internalOptions as any),
      level: mapLogLevel(logLevel as any),
    });

    const steps = new StepTracker(createInclusionOptions(flags as any));

    try {
      const {workspace, plugins} = await loadWorkspace(root as string);
      await run(flags as any, {workspace, ui, plugins, steps});
    } catch (error) {
      logError(error, ui.error);
      // eslint-disable-next-line require-atomic-updates
      process.exitCode = 1;
    }
  };
}

export async function createWorkspaceTasksAndApplyPlugins(
  context: TaskContext,
) {
  const {workspace, plugins: pluginSource} = context;

  const tasks: WorkspaceTasks = {
    build: new SeriesHook(),
    dev: new SeriesHook(),
    test: new SeriesHook(),
    lint: new SeriesHook(),
    typeCheck: new SeriesHook(),
  };

  const plugins = pluginSource.pluginsForWorkspace(workspace);

  for (const plugin of plugins) {
    const api = createPluginApi(plugin, context);
    await plugin.run?.({api, workspace, tasks: wrapValue(plugin, tasks)});
  }

  return tasks;
}

export async function createProjectTasksAndApplyPlugins<
  Type extends WebApp | Package | Service
>(project: Type, context: TaskContext) {
  const {workspace, plugins: pluginSource} = context;

  const tasks: ProjectTasks<Type> = {
    build: new SeriesHook(),
    dev: new SeriesHook(),
    test: new SeriesHook(),
  };

  const plugins = pluginSource.pluginsForProject(project);

  for (const plugin of plugins) {
    const api = createPluginApi(plugin, context);
    await plugin.run?.({
      api,
      project,
      workspace,
      tasks: wrapValue(plugin, tasks),
    });
  }

  return tasks;
}

function createPluginApi(
  plugin: AnyPlugin,
  {steps, workspace}: TaskContext,
): PluginApi {
  const resolvePath: PluginApi['resolvePath'] = (...parts) =>
    workspace.fs.resolvePath('.sewing-kit', ...parts);

  return {
    createStep,
    resolvePath,
    read: (path) => workspace.fs.read(resolvePath(path)),
    write: (path, contents) => workspace.fs.write(resolvePath(path), contents),
    configPath: (...parts) => resolvePath('config', ...parts),
    cachePath: (...parts) => resolvePath('cache', ...parts),
    tmpPath: (...parts) => resolvePath('tmp', ...parts),
  };

  function createStep(
    options: Omit<Step, 'run' | 'source'>,
    run: Step['run'],
  ): Step {
    const step = {run, source: plugin, ...normalizeOptions(options)};
    steps.setSource(step, plugin);
    return step;
  }
}

export function createStep(
  options: Omit<Step, 'run' | 'source'>,
  run: Step['run'],
): Step {
  return {run, ...normalizeOptions(options)};
}

function createInclusionOptions(
  flags: Result<typeof defaultStepInclusionFlags>,
): StepInclusionOptions {
  return {
    skipSteps: flags[StepInclusionFlag.SkipStep],
    skipPreSteps: flags[StepInclusionFlag.SkipPreStep],
    skipPostSteps: flags[StepInclusionFlag.SkipPostStep],
    isolateSteps: flags[StepInclusionFlag.IsolateStep],
    isolatePreSteps: flags[StepInclusionFlag.IsolatePreStep],
    isolatePostSteps: flags[StepInclusionFlag.IsolatePostStep],
  };
}

function wrapValue<T>(plugin: AnyPlugin, value: T): T {
  if (typeof value !== 'object' || value == null) {
    return value;
  }

  const updatedParts: {[key: string]: any} = {};

  for (const [key, propValue] of Object.entries(value)) {
    if (propValue instanceof WaterfallHook || propValue instanceof SeriesHook) {
      updatedParts[key] = new Proxy(propValue, {
        get(target, key, receiver) {
          const realValue = Reflect.get(target, key, receiver);

          if (key !== 'hook') {
            return realValue;
          }

          return function hook(
            hookOrId: string | Function,
            maybeHook?: Function,
          ) {
            return typeof hookOrId === 'string'
              ? realValue.call(
                  propValue,
                  hookOrId,
                  wrapHook(plugin, maybeHook!),
                )
              : realValue.call(
                  propValue,
                  plugin.id,
                  wrapHook(plugin, hookOrId),
                );
          };
        },
      });
    } else {
      const updatedValue = wrapValue(plugin, propValue);
      if (updatedValue !== propValue) updatedParts[key] = updatedValue;
    }
  }

  return Object.keys(updatedParts).length > 0
    ? {...value, ...updatedParts}
    : value;
}

function wrapHook(plugin: AnyPlugin, hook: Function) {
  return (first: any, ...rest: any[]) =>
    hook(wrapValue(plugin, first), ...rest);
}

function normalizeOptions(
  step: Parameters<typeof createStep>[0],
): Omit<Step, 'run' | 'source'> {
  return step;
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

export function logError(error: any, log: Log) {
  if (isDiagnosticError(error)) {
    log((fmt) => fmt`{error ${error.title || 'An unexpected error occurred'}}`);

    if (error.content) {
      log('');
      log(error.content);
    }

    if (error.suggestion) {
      log('');
      log((fmt) => fmt`{emphasis What do I do next?}`);
      log(error.suggestion);
    }
  } else {
    log(
      (fmt) =>
        fmt`🧵 The following unexpected error occurred. We want to provide more useful suggestions when errors occur, so please open an issue on {link the sewing-kit repo https://github.com/Shopify/sewing-kit} so that we can improve this message.`,
    );

    if (error.all != null) {
      log(error.all);
      log(error.stack);
    } else if (error.stderr != null) {
      log(error.stderr);
      log(error.stack);
    } else if (error.stdout == null) {
      log(error.stack);
    } else {
      log(error.stdout);
      log(error.stack);
    }
  }
}

class StepTracker {
  private sources = new WeakMap<Step, AnyPlugin>();
  private parents = new WeakMap<Step, Step>();

  constructor(public readonly inclusion: StepInclusionOptions) {}

  setSource(step: Step, plugin: AnyPlugin) {
    this.sources.set(step, plugin);
  }

  getSource(step: Step) {
    return this.sources.get(step);
  }

  setStepParent(step: Step, parent: Step) {
    this.parents.set(step, parent);
  }

  getStepAncestors(step: Step): readonly Step[] {
    const parent = this.parents.get(step);
    return parent ? [parent, ...this.getStepAncestors(parent)] : [];
  }
}
