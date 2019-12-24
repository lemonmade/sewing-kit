import {Ui} from '@sewing-kit/ui';
import {
  PluginApi,
  WorkspacePlugin,
  ProjectPlugin,
  ProjectPluginContext,
  WorkspacePluginContext,
} from '@sewing-kit/plugins';
import {WorkspaceTasks, ProjectTasks} from '@sewing-kit/tasks';
import {SeriesHook} from '@sewing-kit/hooks';
import {Workspace, WebApp, Package, Service, Project} from '@sewing-kit/model';

export interface SewingKitDelegate {
  pluginsForProject<Type extends WebApp | Package | Service>(
    project: Project,
  ): readonly ProjectPlugin<Type>[] | Promise<readonly ProjectPlugin<Type>[]>;
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
    build: new SeriesHook(),
    dev: new SeriesHook(),
    test: new SeriesHook(),
    lint: new SeriesHook(),
    typeCheck: new SeriesHook(),
  };

  const plugins = await delegate.pluginsForWorkspace(workspace);

  for (const plugin of plugins) {
    await handleWorkspacePlugin(plugin, {api, tasks, workspace});
  }

  return tasks;
}

async function handleWorkspacePlugin(
  plugin: WorkspacePlugin,
  context: WorkspacePluginContext,
) {
  const children = new Set<WorkspacePlugin>();

  await plugin.compose?.({
    use(...plugins: any[]) {
      for (const plugin of plugins) {
        if (plugin) children.add(plugin);
      }
    },
  });

  for (const child of children) {
    await handleWorkspacePlugin(child, context);
  }

  await plugin.run?.(context);
}

export async function createProjectTasksAndApplyPlugins<
  Type extends WebApp | Package | Service
>(project: Type, workspace: Workspace, delegate: SewingKitDelegate) {
  const api = createPluginApi(workspace);
  const tasks: ProjectTasks<Type> = {
    build: new SeriesHook(),
    dev: new SeriesHook(),
    test: new SeriesHook(),
  };

  const plugins = await delegate.pluginsForProject(project);

  for (const plugin of plugins) {
    await handleProjectPlugin(plugin, {tasks, api, workspace, project});
  }

  return tasks;
}

async function handleProjectPlugin<Type extends WebApp | Package | Service>(
  plugin: ProjectPlugin<Type>,
  context: ProjectPluginContext<Type>,
) {
  const children = new Set<ProjectPlugin<Type>>();

  await plugin.compose?.({
    use(...plugins: any[]) {
      for (const plugin of plugins) {
        if (plugin) children.add(plugin);
      }
    },
  });

  for (const child of children) {
    await handleProjectPlugin(child, context);
  }

  await plugin.run?.(context);
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
