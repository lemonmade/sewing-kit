import {createProjectPlugin} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';
import {AsyncSeriesWaterfallHook} from 'tapable';

const PLUGIN = 'SewingKit.graphql';

export const graphqlProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test}) {
    build.tap(PLUGIN, ({hooks}) => {
      function addWebpackRule(configurationHooks: {
        webpackRules?: AsyncSeriesWaterfallHook<readonly any[]>;
      }) {
        configurationHooks.webpackRules?.tap(PLUGIN, (rules) => [
          ...rules,
          {
            test: /\.graphql$/,
            use: [{loader: require.resolve('graphql-mini-transforms/webpack')}],
          },
        ]);
      }

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackRule);
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, addWebpackRule);
      });
    });

    test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          hooks.jestTransforms?.tap(PLUGIN, (transforms) => ({
            ...transforms,
            '\\.(gql|graphql)$': require.resolve(
              'graphql-mini-transforms/jest',
            ),
          }));
        });
      });
    });
  },
});
