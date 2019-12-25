import {
  Task,
  Service,
  WebApp,
  Project,
  WaterfallHook,
  createProjectPlugin,
} from '@sewing-kit/plugins';

interface WebpackHooks {
  readonly webpackRules: WaterfallHook<readonly any[]>;
  readonly webpackPlugins: WaterfallHook<readonly import('webpack').Plugin[]>;
  readonly webpackConfig: WaterfallHook<
    Readonly<import('webpack').Configuration>
  >;
  readonly webpackPublicPath: WaterfallHook<string>;

  readonly webpackOutputDirectory: WaterfallHook<string>;
  readonly webpackOutputFilename: WaterfallHook<string>;
  readonly webpackEntries: WaterfallHook<readonly string[]>;
  readonly webpackExtensions: WaterfallHook<readonly string[]>;
  readonly webpackAliases: WaterfallHook<{[key: string]: string}>;
}

interface WebpackDevContext {
  readonly webpackBuildManager: BuildManager;
}

interface WebpackBuildContext {
  readonly webpackBuildManager: BuildManager;
}

declare module '@sewing-kit/hooks' {
  interface BuildWebAppConfigurationCustomHooks extends WebpackHooks {}
  interface BuildServiceConfigurationCustomHooks
    extends Omit<WebpackHooks, 'webpackPublicPath'> {}

  interface DevWebAppConfigurationCustomHooks extends WebpackHooks {}
  interface DevServiceConfigurationCustomHooks
    extends Omit<WebpackHooks, 'webpackPublicPath'> {}

  interface BuildWebAppStepContext extends WebpackBuildContext {}
  interface BuildServiceStepContext extends WebpackBuildContext {}

  interface DevWebAppStepContext extends WebpackDevContext {}
  interface DevServiceStepContext extends WebpackDevContext {}
}

const PLUGIN = 'SewingKit.Webpack';

const addWebpackHooks = (hooks: any) => ({
  ...hooks,
  webpackRules: new WaterfallHook(),
  webpackConfig: new WaterfallHook(),
  webpackPlugins: new WaterfallHook(),
  webpackPublicPath: new WaterfallHook(),
  webpackOutputDirectory: new WaterfallHook(),
  webpackOutputFilename: new WaterfallHook(),
  webpackEntries: new WaterfallHook(),
  webpackExtensions: new WaterfallHook(),
  webpackAliases: new WaterfallHook(),
});

export function webpack() {
  return createProjectPlugin<Service | WebApp>(
    PLUGIN,
    ({tasks: {build, dev}}) => {
      build.hook(({hooks}) => {
        hooks.configureHooks.hook(addWebpackHooks);
        hooks.context.hook((context: any) => ({
          ...context,
          webpackBuildManager: new BuildManager(),
        }));
      });

      dev.hook(({hooks}) => {
        hooks.configureHooks.hook(addWebpackHooks);
        hooks.context.hook((context: any) => ({
          ...context,
          webpackBuildManager: new BuildManager(),
        }));
      });
    },
  );
}

interface WebpackConfigurationChangePluginOptions {
  id?: string;
  include?: (Task.Dev | Task.Build)[];
}

type ValueOrArray<Value> = Value | Value[];
type ValueOrGetter<Value> = Value | (() => Value | Promise<Value>);

export function webpackRules(
  rules: ValueOrGetter<ValueOrArray<import('webpack').Rule>>,
  options: WebpackConfigurationChangePluginOptions = {},
) {
  return createWebpackConfigurationChangePlugin(
    {id: `${PLUGIN}.AddWebpackRules`, ...options},
    (configure) => {
      configure.webpackRules?.hook(async (existingRules) => [
        ...existingRules,
        ...(await unwrapPossibleArrayGetter(rules)),
      ]);
    },
  );
}

export function webpackPlugins(
  plugins: ValueOrGetter<ValueOrArray<import('webpack').Plugin>>,
  options: WebpackConfigurationChangePluginOptions = {},
) {
  return createWebpackConfigurationChangePlugin(
    {id: `${PLUGIN}.AddWebpackPlugins`, ...options},
    (configure) => {
      configure.webpackPlugins?.hook(async (existingPlugins) => [
        ...existingPlugins,
        ...(await unwrapPossibleArrayGetter(plugins)),
      ]);
    },
  );
}

export function webpackAliases(
  aliases: ValueOrGetter<{[key: string]: string}>,
  options: WebpackConfigurationChangePluginOptions = {},
) {
  return createWebpackConfigurationChangePlugin(
    {id: `${PLUGIN}.AddWebpackAliases`, ...options},
    (configure) => {
      configure.webpackAliases?.hook(async (existingAliases) => ({
        ...existingAliases,
        ...unwrapPossibleGetter(aliases),
      }));
    },
  );
}

export function noopModuleWithWebpack(
  module: RegExp,
  options?: WebpackConfigurationChangePluginOptions,
) {
  return webpackPlugins(
    async () =>
      new (await import('webpack')).NormalModuleReplacementPlugin(
        module,
        require.resolve('./noop'),
      ),
    options,
  );
}

function createWebpackConfigurationChangePlugin(
  {
    id,
    include = [Task.Build, Task.Dev],
  }: WebpackConfigurationChangePluginOptions & {id: string},
  run: (
    hooks:
      | import('@sewing-kit/hooks').BuildWebAppConfigurationHooks
      | import('@sewing-kit/hooks').BuildServiceConfigurationHooks
      | import('@sewing-kit/hooks').DevWebAppConfigurationHooks
      | import('@sewing-kit/hooks').DevServiceConfigurationHooks,
  ) => void,
) {
  return createProjectPlugin<WebApp | Service>(id, ({tasks: {build, dev}}) => {
    if (include.includes(Task.Build)) {
      build.hook(({hooks}) => {
        hooks.configure.hook(run);
      });
    }

    if (include.includes(Task.Dev)) {
      dev.hook(({hooks}) => {
        hooks.configure.hook(run);
      });
    }
  });
}

type Handler = (stats: import('webpack').Stats) => any;

export class BuildManager {
  private readonly listeners = new Map<Project, Set<Handler>>();

  on(project: Project, handler: Handler) {
    const listeners = this.listeners.get(project) ?? new Set();
    listeners.add(handler);
    this.listeners.set(project, listeners);
    return () => listeners.delete(handler);
  }

  emit(project: Project, stats: import('webpack').Stats) {
    const listeners = this.listeners.get(project);

    if (listeners == null) return;

    for (const listener of listeners) {
      listener(stats);
    }
  }
}

function unwrapPossibleGetter<T>(
  maybeGetter: ValueOrGetter<T>,
): T | Promise<T> {
  return typeof maybeGetter === 'function'
    ? (maybeGetter as any)()
    : maybeGetter;
}

async function unwrapPossibleArrayGetter<T>(
  maybeGetter: ValueOrGetter<ValueOrArray<T>>,
) {
  const result = await unwrapPossibleGetter(maybeGetter);
  return Array.isArray(result) ? result : [result];
}
