import {
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
  readonly sassIncludes?: readonly string[];
}

const PLUGIN = 'SewingKit.Sass';

export function sass({sassIncludes: baseSassIncludes = []}: Options = {}) {
  return createProjectPlugin<WebApp | Service>(
    PLUGIN,
    ({project, tasks: {build, dev, test}}) => {
      build.hook(({hooks, options: {sourceMaps, simulateEnv}}) => {
        hooks.configureHooks.hook((hooks: any) => ({
          ...hooks,
          sassIncludePaths: new WaterfallHook(),
        }));

        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook(async (rules) => {
              const sassIncludePaths = await configure.sassIncludePaths!.run(
                baseSassIncludes,
              );

              return [
                ...rules,
                {
                  test: /\.scss$/,
                  use: [
                    ...(await createCSSWebpackRuleSet({
                      configure,
                      project,
                      sourceMaps,
                      env: simulateEnv,
                    })),
                    {
                      path: 'sass-loader',
                      options: {
                        sourceMap: sourceMaps,
                        includePaths: sassIncludePaths,
                      },
                    },
                  ],
                },
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
            configure: Partial<
              import('@sewing-kit/hooks').DevWebAppConfigurationHooks &
                import('@sewing-kit/hooks').DevServiceConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook(async (rules) => {
              const sassIncludePaths = await configure.sassIncludePaths!.run(
                baseSassIncludes,
              );

              return [
                ...rules,
                {
                  test: /\.scss$/,
                  use: [
                    ...(await createCSSWebpackRuleSet({
                      configure,
                      project,
                      sourceMaps,
                    })),
                    {
                      path: 'sass-loader',
                      options: {
                        sourceMap: sourceMaps,
                        includePaths: sassIncludePaths,
                      },
                    },
                  ],
                },
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
