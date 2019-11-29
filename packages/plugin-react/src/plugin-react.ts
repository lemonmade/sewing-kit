import {produce} from 'immer';
import {Env} from '@sewing-kit/types';
import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {BabelConfig} from '@sewing-kit/plugin-babel';

const PLUGIN = 'SewingKit.react';

function createBabelConfigAdjuster({development = false} = {}) {
  return produce((babelConfig: BabelConfig) => {
    babelConfig.presets = babelConfig.presets ?? [];
    babelConfig.presets.push([
      '@babel/preset-react',
      {development, useBuiltIns: true},
    ]);
  });
}

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({hooks, options}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: options.simulateEnv !== Env.Development,
      });

      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, addReactBabelConfig);
          }
        });
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, addReactBabelConfig);
          }
        });
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, addReactBabelConfig);
          }
        });
      });
    });

    tasks.test.tap(PLUGIN, ({hooks}) => {
      const addBabelPreset = createBabelConfigAdjuster({development: true});

      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          hooks.babelConfig?.tap(PLUGIN, addBabelPreset);
        });
      });
    });
  },
);
