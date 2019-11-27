import {AsyncSeriesWaterfallHook} from 'tapable';
import {
  addHooks,
  createPlugin,
  PluginTarget,
} from '@sewing-kit/plugin-utilities';
import {BabelConfig} from './types';

interface BabelHooks {
  readonly babelConfig: AsyncSeriesWaterfallHook<BabelConfig>;
}

declare module '@sewing-kit/types' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}

  interface BuildPackageConfigurationCustomHooks extends BabelHooks {}
  interface BuildBrowserConfigurationCustomHooks extends BabelHooks {}
  interface BuildServiceConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.babel';

const addBabelHooks = addHooks(() => ({
  babelConfig: new AsyncSeriesWaterfallHook<BabelConfig>(['babelConfig']),
}));

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({hooks}) => {
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

    tasks.test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addBabelHooks);
      });
    });
  },
);
