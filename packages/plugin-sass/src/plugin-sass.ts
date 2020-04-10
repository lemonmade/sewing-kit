import {
  Env,
  WebApp,
  Service,
  WaterfallHook,
  createProjectPlugin,
} from '@sewing-kit/plugins';
import {createCSSWebpackRuleSet} from '@sewing-kit/plugin-css';

import {} from '@sewing-kit/plugin-webpack';

declare module '@sewing-kit/hooks' {
  interface BuildProjectConfigurationCustomHooks {
    readonly sassIncludePaths: WaterfallHook<readonly string[]>;
  }

  interface DevProjectConfigurationCustomHooks {
    readonly sassIncludePaths: WaterfallHook<readonly string[]>;
  }
}

interface Options {
  readonly id?: string;
  readonly postcss?: Parameters<typeof createCSSWebpackRuleSet>[0]['postcss'];
  readonly sassIncludes?: readonly string[];
}

const PLUGIN = 'SewingKit.Sass';

export function sass({
  id = 'sass',
  postcss = true,
  sassIncludes: baseSassIncludes = [],
}: Options = {}) {
  return createProjectPlugin<WebApp | Service>(
    PLUGIN,
    ({api, project, tasks: {build, dev, test}}) => {
      build.hook(({hooks, options: {sourceMaps, simulateEnv}}) => {
        hooks.configureHooks.hook((hooks: any) => ({
          ...hooks,
          sassIncludePaths: new WaterfallHook(),
        }));

        hooks.configure.hook(
          (
            configuration: Partial<
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks
            >,
          ) => {
            configuration.cssWebpackCacheDependencies?.hook((dependencies) => [
              ...dependencies,
              'node-sass',
            ]);

            configuration.webpackRules?.hook(async (rules) => {
              const sassIncludePaths = await configuration.sassIncludePaths!.run(
                baseSassIncludes,
              );

              return [
                ...rules,
                {
                  test: /\.scss$/,
                  use: [
                    ...(await createCSSWebpackRuleSet({
                      id,
                      api,
                      env: simulateEnv,
                      configuration,
                      project,
                      postcss,
                      sourceMaps,
                      cacheDirectory: 'sass',
                      cacheDependencies: ['node-sass'],
                    })),
                    {
                      path: 'sass-loader',
                      options: {
                        sourceMap: sourceMaps,
                        includePaths: sassIncludePaths,
                      },
                    },
                  ],
                } as import('webpack').RuleSetRule,
              ];
            });
          },
        );
      });

      dev.hook(({hooks, options: {sourceMaps}}) => {
        hooks.configureHooks.hook((hooks: any) => ({
          ...hooks,
          sassIncludePaths: new WaterfallHook(),
        }));

        hooks.configure.hook(
          (
            configuration: Partial<
              import('@sewing-kit/hooks').DevWebAppConfigurationHooks &
                import('@sewing-kit/hooks').DevServiceConfigurationHooks
            >,
          ) => {
            configuration.cssWebpackCacheDependencies?.hook((dependencies) => [
              ...dependencies,
              'node-sass',
            ]);

            configuration.webpackRules?.hook(async (rules) => {
              const sassIncludePaths = await configuration.sassIncludePaths!.run(
                baseSassIncludes,
              );

              return [
                ...rules,
                {
                  test: /\.scss$/,
                  use: [
                    ...(await createCSSWebpackRuleSet({
                      api,
                      env: Env.Development,
                      configuration,
                      project,
                      sourceMaps,
                      cacheDirectory: 'sass',
                      cacheDependencies: ['node-sass'],
                    })),
                    {
                      path: 'sass-loader',
                      options: {
                        sourceMap: sourceMaps,
                        includePaths: sassIncludePaths,
                      },
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
          hooks.cssModuleIdentityProxyExtensions?.hook((extensions) => [
            ...extensions,
            '.scss',
          ]);
        });
      });
    },
  );
}
