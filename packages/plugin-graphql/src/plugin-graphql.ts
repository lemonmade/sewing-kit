import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';
import {AsyncSeriesWaterfallHook} from 'tapable';

const PLUGIN = 'SewingKit.graphql';

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({hooks}) => {
      function addWebpackRule(configurationHooks: {
        webpackRules?: AsyncSeriesWaterfallHook<any[]>;
      }) {
        if (configurationHooks.webpackRules) {
          configurationHooks.webpackRules.tap(PLUGIN, (rules) => [
            ...rules,
            {
              test: /\.graphql$/,
              use: [
                {loader: require.resolve('graphql-mini-transforms/webpack')},
              ],
            },
          ]);
        }
      }

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackRule);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackRule);
      });
    });

    tasks.test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          if (hooks.jestTransforms) {
            hooks.jestTransforms.tap(PLUGIN, (transforms) => ({
              ...transforms,
              '\\.(gql|graphql)$': require.resolve(
                'graphql-mini-transforms/jest',
              ),
            }));
          }
        });
      });
    });
  },
);
