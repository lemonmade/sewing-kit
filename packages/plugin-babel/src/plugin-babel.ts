import {AsyncSeriesWaterfallHook} from 'tapable';
import {addHooks, createProjectPlugin} from '@sewing-kit/plugins';

import {BabelConfig} from './types';

interface BabelHooks {
  readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
  readonly babelIgnorePatterns: AsyncSeriesWaterfallHook<readonly string[]>;
}

interface BabelPackageBuildHooks extends BabelHooks {
  readonly babelExtensions: AsyncSeriesWaterfallHook<readonly string[]>;
}

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}

  interface BuildPackageConfigurationCustomHooks
    extends BabelPackageBuildHooks {}
  interface BuildBrowserConfigurationCustomHooks extends BabelHooks {}
  interface BuildServiceConfigurationCustomHooks extends BabelHooks {}

  interface DevPackageConfigurationCustomHooks extends BabelHooks {}
  interface DevWebAppConfigurationCustomHooks extends BabelHooks {}
  interface DevServiceConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.babel';

const addBabelHooks = addHooks(() => ({
  babelConfig: new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']),
  babelIgnorePatterns: new AsyncSeriesWaterfallHook<readonly string[]>([
    'babelIgnorePatterns',
  ]),
}));

const addPackageBabelHooks = addHooks(() => ({
  babelConfig: new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']),
  babelIgnorePatterns: new AsyncSeriesWaterfallHook<readonly string[]>([
    'babelIgnorePatterns',
  ]),
  babelExtensions: new AsyncSeriesWaterfallHook<readonly string[]>([
    'extensions',
  ]),
}));

export const babelProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test, dev}) {
    build.tap(PLUGIN, ({hooks}) => {
      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addPackageBabelHooks);
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });
    });

    dev.tap(PLUGIN, ({hooks}) => {
      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });
    });

    test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });
    });
  },
});
