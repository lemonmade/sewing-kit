import {createProjectPlugin, Service, WebApp, Env} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.GraphQL';

export function graphql() {
  return createProjectPlugin<Service | WebApp>(
    PLUGIN,
    ({api, project, tasks: {build, dev, test}}) => {
      build.hook(({hooks, options: {simulateEnv}}) => {
        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks &
                import('@sewing-kit/hooks').BuildPackageConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook(async (rules) => {
              const {createCacheLoaderRule} = await import(
                '@sewing-kit/plugin-webpack'
              );

              return [
                ...rules,
                {
                  test: /\.graphql$/,
                  use: [
                    await createCacheLoaderRule({
                      env: simulateEnv,
                      api,
                      project,
                      configuration: configure,
                      cachePath: 'graphql',
                      dependencies: ['graphql'],
                    }),
                    {
                      loader: require.resolve(
                        'graphql-mini-transforms/webpack',
                      ),
                    },
                  ],
                } as import('webpack').RuleSetRule,
              ];
            });
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
            configure.webpackRules?.hook(async (rules) => {
              const {createCacheLoaderRule} = await import(
                '@sewing-kit/plugin-webpack'
              );

              return [
                ...rules,
                {
                  test: /\.graphql$/,
                  use: [
                    await createCacheLoaderRule({
                      env: Env.Development,
                      api,
                      project,
                      configuration: configure,
                      cachePath: 'graphql',
                      dependencies: ['graphql'],
                    }),
                    {
                      loader: require.resolve(
                        'graphql-mini-transforms/webpack',
                      ),
                    },
                  ],
                } as import('webpack').RuleSetRule,
              ];
            });
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
