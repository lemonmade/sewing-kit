import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  Configuration as WebpackConfiguration,
  Plugin as WebpackPlugin,
} from 'webpack';
import {addHooks, createProjectPlugin} from '@sewing-kit/plugins';
import {Project} from '@sewing-kit/model';

interface WebpackHooks {
  readonly webpackRules: AsyncSeriesWaterfallHook<readonly any[]>;
  readonly webpackPlugins: AsyncSeriesWaterfallHook<readonly WebpackPlugin[]>;
  readonly webpackConfig: AsyncSeriesWaterfallHook<
    Readonly<WebpackConfiguration>
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
