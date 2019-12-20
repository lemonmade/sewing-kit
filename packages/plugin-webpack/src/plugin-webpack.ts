import {AsyncSeriesWaterfallHook} from 'tapable';
import {addHooks, createProjectPlugin} from '@sewing-kit/plugins';
import {Project} from '@sewing-kit/model';

interface WebpackHooks {
  readonly webpackRules: AsyncSeriesWaterfallHook<readonly any[]>;
  readonly webpackPlugins: AsyncSeriesWaterfallHook<
    readonly import('webpack').Plugin[]
  >;
  readonly webpackConfig: AsyncSeriesWaterfallHook<
    Readonly<import('webpack').Configuration>
  >;
  readonly webpackPublicPath: AsyncSeriesWaterfallHook<string>;

  readonly webpackOutputDirectory: AsyncSeriesWaterfallHook<string>;
  readonly webpackOutputFilename: AsyncSeriesWaterfallHook<string>;
  readonly webpackEntries: AsyncSeriesWaterfallHook<readonly string[]>;
  readonly webpackExtensions: AsyncSeriesWaterfallHook<readonly string[]>;
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

const PLUGIN = 'SewingKit.webpack';

const addWebpackHooks = addHooks<Partial<WebpackHooks>>(() => ({
  webpackRules: new AsyncSeriesWaterfallHook(['webpackRules']),
  webpackConfig: new AsyncSeriesWaterfallHook(['webpackConfig']),
  webpackPlugins: new AsyncSeriesWaterfallHook(['webpackPlugins']),
  webpackPublicPath: new AsyncSeriesWaterfallHook(['webpackPublicPath']),
  webpackOutputDirectory: new AsyncSeriesWaterfallHook([
    'webpackOutputDirectory',
  ]),
  webpackOutputFilename: new AsyncSeriesWaterfallHook([
    'webpackOutputFilename',
  ]),
  webpackEntries: new AsyncSeriesWaterfallHook(['webpackEntries']),
  webpackExtensions: new AsyncSeriesWaterfallHook(['webpackExtensions']),
}));

export const webpackProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, dev}) {
    build.tap(PLUGIN, ({hooks}) => {
      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.context.tap(PLUGIN, (context) => ({
          ...context,
          webpackBuildManager: new BuildManager(),
        }));

        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.context.tap(PLUGIN, (context) => ({
          ...context,
          webpackBuildManager: new BuildManager(),
        }));

        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });
    });

    dev.tap(PLUGIN, ({hooks}) => {
      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.context.tap(PLUGIN, (context) => ({
          ...context,
          webpackBuildManager: new BuildManager(),
        }));

        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.context.tap(PLUGIN, (context) => ({
          ...context,
          webpackBuildManager: new BuildManager(),
        }));

        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });
    });
  },
});

interface WebpackConfigurationChangePluginOptions {
  id?: string;
  dev?: boolean;
  build?: boolean;
}

export function noopModuleWithWebpack(
  module: RegExp,
  options?: WebpackConfigurationChangePluginOptions,
) {
  return addWebpackPlugin(
    async () =>
      new (await import('webpack')).NormalModuleReplacementPlugin(
        module,
        require.resolve('./noop'),
      ),
    options,
  );
}

type ValueOrArray<Value> = Value | Value[];
type ValueOrGetter<Value> = Value | (() => Value | Promise<Value>);
type PluginsOrPluginGetter = ValueOrGetter<
  ValueOrArray<import('webpack').Plugin>
>;

export function addWebpackPlugin(
  pluginGetter: PluginsOrPluginGetter,
  {
    id: pluginId = `${PLUGIN}.AddWebpackPlugin`,
    dev: applyToDev = true,
    build: applyToBuild = true,
  }: WebpackConfigurationChangePluginOptions = {},
) {
  async function addPlugins(existingPlugins: readonly any[]) {
    const pluginOrPlugins =
      typeof pluginGetter === 'function' ? await pluginGetter() : pluginGetter;

    const plugins = Array.isArray(pluginOrPlugins)
      ? pluginOrPlugins
      : [pluginOrPlugins];

    return [...existingPlugins, ...plugins];
  }

  return createProjectPlugin({
    id: pluginId,
    run({build, dev}) {
      if (applyToBuild) {
        build.tap(pluginId, ({hooks}) => {
          hooks.webApp.tap(pluginId, ({hooks}) => {
            hooks.configure.tap(pluginId, (configure) => {
              configure.webpackPlugins?.tapPromise(pluginId, addPlugins);
            });
          });

          hooks.service.tap(pluginId, ({hooks}) => {
            hooks.configure.tap(pluginId, (configure) => {
              configure.webpackPlugins?.tapPromise(pluginId, addPlugins);
            });
          });
        });
      }

      if (applyToDev) {
        dev.tap(pluginId, ({hooks}) => {
          hooks.webApp.tap(pluginId, ({hooks}) => {
            hooks.configure.tap(pluginId, (configure) => {
              configure.webpackPlugins?.tapPromise(pluginId, addPlugins);
            });
          });

          hooks.service.tap(pluginId, ({hooks}) => {
            hooks.configure.tap(pluginId, (configure) => {
              configure.webpackPlugins?.tapPromise(pluginId, addPlugins);
            });
          });
        });
      }
    },
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
