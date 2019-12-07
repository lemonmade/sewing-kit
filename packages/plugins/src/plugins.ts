import {AsyncSeriesHook} from 'tapable';
import {ProjectTasks, WorkspaceTasks} from '@sewing-kit/tasks';

import {PluginApi} from './api';

export const PLUGIN_MARKER = Symbol('SewingKit.Plugin');

export enum PluginTarget {
  Project,
  Workspace,
}

interface BasePlugin {
  readonly id: string;
  readonly target: PluginTarget;
  readonly [PLUGIN_MARKER]: true;
}

export interface PluginComposer<Plugin extends BasePlugin> {
  use(...plugins: Plugin[]): void;
}

export interface ProjectPlugin extends BasePlugin {
  readonly target: PluginTarget.Project;
  run?(tasks: ProjectTasks, api: PluginApi): any;
  compose?(composer: PluginComposer<ProjectPlugin>): any;
}

export interface WorkspacePlugin extends BasePlugin {
  readonly target: PluginTarget.Workspace;
  run?(tasks: WorkspaceTasks, api: PluginApi): any;
  compose?(composer: PluginComposer<WorkspacePlugin>): any;
}

export type AnyPlugin = ProjectPlugin | WorkspacePlugin;

export function createProjectPlugin(
  plugin: Omit<ProjectPlugin, typeof PLUGIN_MARKER | 'target'>,
): ProjectPlugin {
  return {...plugin, target: PluginTarget.Project, [PLUGIN_MARKER]: true};
}

export function createComposedProjectPlugin(
  id: BasePlugin['id'],
  pluginsOrCompose:
    | readonly ProjectPlugin[]
    | NonNullable<ProjectPlugin['compose']>,
) {
  const compose: NonNullable<ProjectPlugin['compose']> =
    typeof pluginsOrCompose === 'function'
      ? pluginsOrCompose
      : (composer) => {
          for (const plugin of pluginsOrCompose) {
            composer.use(plugin);
          }
        };

  return createProjectPlugin({
    id,
    compose,
  });
}

export function createWorkspacePlugin(
  plugin: Omit<WorkspacePlugin, typeof PLUGIN_MARKER | 'target'>,
): WorkspacePlugin {
  return {...plugin, target: PluginTarget.Workspace, [PLUGIN_MARKER]: true};
}

export function createComposedWorkspacePlugin(
  id: BasePlugin['id'],
  plugins: readonly WorkspacePlugin[],
) {
  return createWorkspacePlugin({
    id,
    compose(composer) {
      for (const plugin of plugins) {
        composer.use(plugin);
      }
    },
  });
}

type IndividualTaskRunner<
  Tasks extends WorkspaceTasks | ProjectTasks,
  Task extends keyof Tasks
> = Tasks[Task] extends AsyncSeriesHook<infer Context>
  ? (task: Context, api: PluginApi) => void | Promise<void>
  : never;

const createProjectTaskPluginCreator = <Task extends keyof ProjectTasks>(
  task: Task,
) => (id: ProjectPlugin['id'], run: IndividualTaskRunner<ProjectTasks, Task>) =>
  createProjectPlugin({
    id,
    run(tasks, api) {
      tasks[task].tapPromise(id, (task: any) =>
        Promise.resolve(run(task, api)),
      );
    },
  });

export const createProjectBuildPlugin = createProjectTaskPluginCreator('build');
export const createProjectDevPlugin = createProjectTaskPluginCreator('dev');
export const createProjectTestPlugin = createProjectTaskPluginCreator('test');

const createWorkspaceTaskPluginCreator = <Task extends keyof WorkspaceTasks>(
  task: Task,
) => (
  id: WorkspacePlugin['id'],
  run: IndividualTaskRunner<WorkspaceTasks, Task>,
) =>
  createWorkspacePlugin({
    id,
    run(tasks, api) {
      tasks[task].tapPromise(id, (task: any) =>
        Promise.resolve(run(task, api)),
      );
    },
  });

export const createWorkspaceBuildPlugin = createWorkspaceTaskPluginCreator(
  'build',
);
export const createWorkspaceDevPlugin = createWorkspaceTaskPluginCreator('dev');
export const createWorkspaceLintPlugin = createWorkspaceTaskPluginCreator(
  'lint',
);
export const createWorkspaceTypeCheckPlugin = createWorkspaceTaskPluginCreator(
  'typeCheck',
);
export const createWorkspaceTestPlugin = createWorkspaceTaskPluginCreator(
  'test',
);
