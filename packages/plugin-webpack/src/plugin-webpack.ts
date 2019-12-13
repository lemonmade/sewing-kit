import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  Configuration as WebpackConfiguration,
  Plugin as WebpackPlugin,
} from 'webpack';
import {addHooks, createProjectPlugin} from '@sewing-kit/plugins';

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

declare module '@sewing-kit/hooks' {
  interface BuildBrowserConfigurationCustomHooks extends WebpackHooks {}
  interface BuildServiceWorkerConfigurationCustomHooks extends WebpackHooks {}
  interface BuildServiceConfigurationCustomHooks
    extends Omit<WebpackHooks, 'webpackPublicPath'> {}

  interface DevWebAppConfigurationCustomHooks extends WebpackHooks {}
  interface DevServiceConfigurationCustomHooks
    extends Omit<WebpackHooks, 'webpackPublicPath'> {}
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
        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });
    });

    dev.tap(PLUGIN, ({hooks}) => {
      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });
    });
  },
});
