import {produce} from 'immer';

import {Env} from '@sewing-kit/tasks';
import {createProjectPlugin} from '@sewing-kit/plugins';
import {BabelConfig} from '@sewing-kit/plugin-babel';

const PLUGIN = 'SewingKit.react';

export const reactProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test, dev}) {
    build.tap(PLUGIN, ({hooks, options}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: options.simulateEnv !== Env.Development,
      });

      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelConfig?.tap(PLUGIN, addReactBabelConfig);
        });
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelConfig?.tap(PLUGIN, addReactBabelConfig);
        });
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelConfig?.tap(PLUGIN, addReactBabelConfig);
        });
      });
    });

    dev.tap(PLUGIN, ({hooks}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: true,
      });

      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelConfig?.tap(PLUGIN, addReactBabelConfig);
        });
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelConfig?.tap(PLUGIN, addReactBabelConfig);
        });
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelConfig?.tap(PLUGIN, addReactBabelConfig);
        });
      });
    });

    test.tap(PLUGIN, ({hooks}) => {
      const addBabelPreset = createBabelConfigAdjuster({development: true});

      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          hooks.babelConfig?.tap(PLUGIN, addBabelPreset);
        });
      });
    });
  },
});

function createBabelConfigAdjuster({development = false} = {}) {
  return produce((babelConfig: BabelConfig) => {
    babelConfig.presets = babelConfig.presets ?? [];
    babelConfig.presets.push([
      '@babel/preset-react',
      {development, useBuiltIns: true},
    ]);
  });
}
