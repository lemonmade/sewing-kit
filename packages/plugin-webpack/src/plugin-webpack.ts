import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  Configuration as WebpackConfiguration,
  Plugin as WebpackPlugin,
} from 'webpack';
import {
  addHooks,
  createPlugin,
  PluginTarget,
} from '@sewing-kit/plugin-utilities';

interface WebpackHooks {
  readonly webpackRules: AsyncSeriesWaterfallHook<any[]>;
  readonly webpackPlugins: AsyncSeriesWaterfallHook<WebpackPlugin[]>;
  readonly webpackConfig: AsyncSeriesWaterfallHook<WebpackConfiguration>;
  readonly webpackPublicPath: AsyncSeriesWaterfallHook<string>;
}

declare module '@sewing-kit/types' {
  interface BuildBrowserConfigurationCustomHooks extends WebpackHooks {}
  interface BuildServiceConfigurationCustomHooks extends WebpackHooks {}
}

const PLUGIN = 'SewingKit.webpack';

const addWebpackHooks = addHooks<Partial<WebpackHooks>>(() => ({
  webpackRules: new AsyncSeriesWaterfallHook(['webpackRules']),
  webpackConfig: new AsyncSeriesWaterfallHook(['webpackConfig']),
  webpackPlugins: new AsyncSeriesWaterfallHook(['webpackPlugins']),
  webpackPublicPath: new AsyncSeriesWaterfallHook(['webpackPublicPath']),
}));

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({hooks}) => {
      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackHooks);
      });
    });
  },
);
