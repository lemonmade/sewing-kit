import {AsyncSeriesHook} from 'tapable';
import {Ui} from '@sewing-kit/ui';
import {PluginApi, WorkspacePlugin, ProjectPlugin} from '@sewing-kit/plugins';
import {WorkspaceTasks, ProjectTasks} from '@sewing-kit/tasks';
import {Workspace, Project} from '@sewing-kit/model';

export interface SewingKitDelegate {
  pluginsForProject(
    project: Project,
  ): readonly ProjectPlugin[] | Promise<readonly ProjectPlugin[]>;
  pluginsForWorkspace(
    workspace: Workspace,
  ): readonly WorkspacePlugin[] | Promise<readonly WorkspacePlugin[]>;
}

export interface TaskContext {
  readonly ui: Ui;
  readonly delegate: SewingKitDelegate;
  readonly workspace: Workspace;
}

export async function createWorkspaceTasksAndApplyPlugins(
  workspace: Workspace,
  delegate: SewingKitDelegate,
) {
  const api = createPluginApi(workspace);
  const tasks: WorkspaceTasks = {
    build: new AsyncSeriesHook(['buildTask']),
    dev: new AsyncSeriesHook(['devTask']),
    test: new AsyncSeriesHook(['testTask']),
    lint: new AsyncSeriesHook(['lintTask']),
    typeCheck: new AsyncSeriesHook(['typeCheckTask']),
  };

  const plugins = await delegate.pluginsForWorkspace(workspace);

  for (const plugin of plugins) {
    await handlePlugin(plugin, tasks, api);
  }

  return tasks;
}

export async function createProjectTasksAndApplyPlugins(
  project: Project,
  workspace: Workspace,
  delegate: SewingKitDelegate,
) {
  const api = createPluginApi(workspace);
  const tasks: ProjectTasks = {
    build: new AsyncSeriesHook(['buildTask']),
    dev: new AsyncSeriesHook(['devTask']),
    test: new AsyncSeriesHook(['testTask']),
  };

  const plugins = await delegate.pluginsForProject(project);

  for (const plugin of plugins) {
    await handlePlugin(plugin, tasks, api);
  }

  return tasks;
}

async function handlePlugin<Plugin extends ProjectPlugin | WorkspacePlugin>(
  plugin: Plugin,
  tasks: Plugin extends ProjectPlugin ? ProjectTasks : WorkspaceTasks,
  api: PluginApi,
) {
  const children = new Set<Plugin>();

  await plugin.compose?.({
    use(...plugins: any[]) {
      for (const plugin of plugins) children.add(plugin);
    },
  });

  for (const child of children) {
    await handlePlugin(child, tasks, api);
  }

  await plugin.run?.(tasks as any, api);
}

function createPluginApi(workspace: Workspace): PluginApi {
  const resolvePath: PluginApi['resolvePath'] = (...parts) =>
    workspace.fs.resolvePath('.sewing-kit', ...parts);

  return {
    resolvePath,
    read: (path) => workspace.fs.read(resolvePath(path)),
    write: (path, contents) => workspace.fs.write(resolvePath(path), contents),
    configPath: (...parts) => resolvePath('config', ...parts),
    cachePath: (...parts) => resolvePath('cache', ...parts),
    tmpPath: (...parts) => resolvePath('tmp', ...parts),
  };
}
