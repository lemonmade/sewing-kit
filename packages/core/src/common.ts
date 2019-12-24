import {Ui} from '@sewing-kit/ui';
import {
  AnyPlugin,
  PluginApi,
  createStep,
  WorkspacePlugin,
  ProjectPlugin,
  ProjectPluginContext,
  WorkspacePluginContext,
} from '@sewing-kit/plugins';
import {WorkspaceTasks, ProjectTasks} from '@sewing-kit/tasks';
import {SeriesHook, WaterfallHook} from '@sewing-kit/hooks';
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

  await plugin.run?.({...context, tasks: wrapValue(plugin, context.tasks)});
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

  await plugin.run?.({...context, tasks: wrapValue(plugin, context.tasks)});
}

function createPluginApi(workspace: Workspace): PluginApi {
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
