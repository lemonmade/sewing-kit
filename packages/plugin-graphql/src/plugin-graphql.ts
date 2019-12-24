import {createProjectPlugin, Service, WebApp} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.graphql';

export function graphql() {
  return createProjectPlugin<Service | WebApp>(
    PLUGIN,
    ({tasks: {build, dev, test}}) => {
      build.hook(({hooks}) => {
        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks &
                import('@sewing-kit/hooks').BuildPackageConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook((rules) => [
              ...rules,
              {
                test: /\.graphql$/,
                use: [
                  {loader: require.resolve('graphql-mini-transforms/webpack')},
                ],
              },
            ]);
          },
        );
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').DevWebAppConfigurationHooks &
                import('@sewing-kit/hooks').DevServiceConfigurationHooks &
                import('@sewing-kit/hooks').DevPackageConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook((rules) => [
              ...rules,
              {
                test: /\.graphql$/,
                use: [
                  {loader: require.resolve('graphql-mini-transforms/webpack')},
                ],
              },
            ]);
          },
        );
      });

      test.hook(({hooks}) => {
        hooks.configure.hook((hooks) => {
          hooks.jestTransforms?.hook((transforms) => ({
            ...transforms,
            '\\.(gql|graphql)$': require.resolve(
              'graphql-mini-transforms/jest',
            ),
          }));
        });
      });
    },
  );
}
