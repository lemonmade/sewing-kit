import {AsyncSeriesWaterfallHook} from 'tapable';
import {addHooks, createProjectPlugin} from '@sewing-kit/plugins';

import {BabelConfig} from './types';

interface BabelHooks {
  readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
  readonly babelIgnorePatterns: AsyncSeriesWaterfallHook<string[]>;
}

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}

  interface BuildPackageConfigurationCustomHooks extends BabelHooks {}
  interface BuildBrowserConfigurationCustomHooks extends BabelHooks {}
  interface BuildServiceConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.babel';

const addBabelHooks = addHooks(() => ({
  babelConfig: new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']),
  babelIgnorePatterns: new AsyncSeriesWaterfallHook<string[]>([
    'babelIgnorePatterns',
  ]),
}));

export const babelProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test}) {
    build.tap(PLUGIN, ({hooks}) => {
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
