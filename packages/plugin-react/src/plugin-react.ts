import {produce} from 'immer';
import {Env} from '@sewing-kit/types';
import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {BabelConfig} from '@sewing-kit/plugin-babel';

const PLUGIN = 'SewingKit.react';

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({hooks, options}) => {
      function addReactPreset(babelConfig: BabelConfig) {
        return produce(babelConfig, (babelConfig) => {
          babelConfig.presets = babelConfig.presets || [];
          babelConfig.presets.push([
            'babel-preset-shopify/react',
            {hot: options.simulateEnv === Env.Development},
          ]);
        });
      }

      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, addReactPreset);
          }
        });
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, addReactPreset);
          }
        });
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, addReactPreset);
          }
        });
      });
    });

    tasks.test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          if (hooks.babelConfig) {
            hooks.babelConfig.tap(PLUGIN, (babelConfig) => {
              return produce(babelConfig, (babelConfig) => {
                babelConfig.presets = babelConfig.presets || [];
                babelConfig.presets.push([
                  'babel-preset-shopify/react',
                  {hot: false},
                ]);
              });
            });
          }
        });
      });
    });
  },
);
