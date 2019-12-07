import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  Configuration as WebpackConfiguration,
  Plugin as WebpackPlugin,
} from 'webpack';
import {addHooks, createProjectBuildPlugin} from '@sewing-kit/plugins';

interface WebpackHooks {
  readonly webpackRules: AsyncSeriesWaterfallHook<readonly any[]>;
  readonly webpackPlugins: AsyncSeriesWaterfallHook<readonly WebpackPlugin[]>;
  readonly webpackConfig: AsyncSeriesWaterfallHook<
    Readonly<WebpackConfiguration>
  >;
  readonly webpackPublicPath: AsyncSeriesWaterfallHook<string>;
}

declare module '@sewing-kit/hooks' {
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

export const webpackProjectBuildPlugin = createProjectBuildPlugin(
  PLUGIN,
  ({hooks}) => {
    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, addWebpackHooks);
    });

    hooks.service.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, addWebpackHooks);
    });
  },
);
