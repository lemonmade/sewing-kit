import {
  Service,
  WebApp,
  WaterfallHook,
  createProjectPlugin,
  createWorkspaceLintPlugin,
} from '@sewing-kit/plugins';

import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-stylelint';
import {} from '@sewing-kit/plugin-webpack';

import {CSSWebpackHooks, CSSWebpackLoaderOptions} from './types';
import {createCSSWebpackRuleSet, shouldUseProductionAssets} from './utilities';

const PLUGIN = 'SewingKit.CSS';

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks {
    readonly cssModuleIdentityProxyExtensions: WaterfallHook<readonly string[]>;
  }

  interface BuildProjectConfigurationCustomHooks extends CSSWebpackHooks {}
  interface DevProjectConfigurationCustomHooks extends CSSWebpackHooks {}
}

export function css() {
  return createProjectPlugin<Service | WebApp>(
    PLUGIN,
    ({project, tasks: {dev, build, test}}) => {
      test.hook(({hooks}) => {
        hooks.configureHooks.hook((hooks) => ({
          ...hooks,
          cssModuleIdentityProxyExtensions: new WaterfallHook(),
        }));

        hooks.configure.hook((configure) => {
          configure.jestModuleMapper?.hook(async (moduleMapper) => {
            const extensions = await configure.cssModuleIdentityProxyExtensions!.run(
              ['.css'],
            );

            return extensions.length === 0
              ? moduleMapper
              : {
                  ...moduleMapper,
                  [`\\.(${extensions
                    .map((ext) => ext.replace(/^\./, ''))
                    .join('|')})$`]: require.resolve('./jest-module-mapper'),
                };
          });
        });
      });

      build.hook(({hooks, options: {simulateEnv, sourceMaps}}) => {
        hooks.configureHooks.hook((hooks) => ({
          ...hooks,
          cssWebpackFileName: new WaterfallHook(),
          cssModuleClassNamePattern: new WaterfallHook(),
          cssWebpackLoaderOptions: new WaterfallHook(),
          cssWebpackMiniExtractOptions: new WaterfallHook(),
        }));

        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildPackageConfigurationHooks &
                import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks
            >,
          ) => {
            if (shouldUseProductionAssets(simulateEnv)) {
              configure.webpackPlugins?.hook(async (plugins) => {
                const [
                  {default: MiniCssExtractPlugin},
                  {FilterWarningsPlugin},
                  cssWebpackFileName,
                ] = await Promise.all([
                  import('mini-css-extract-plugin'),
                  import('webpack-filter-warnings-plugin'),
                  configure.cssWebpackFileName!.run('[name]-[contenthash].css'),
                ] as const);

                return [
                  ...plugins,
                  new FilterWarningsPlugin({
                    exclude: /Conflicting order between:.*\* css/s,
                  }),
                  new MiniCssExtractPlugin(
                    await configure.cssWebpackMiniExtractOptions!.run({
                      filename: cssWebpackFileName,
                      chunkFilename: cssWebpackFileName.replace(
                        /\[name\]/,
                        '[id]',
                      ),
                    }),
                  ),
                ];
              });
            }

            configure.webpackRules?.hook(async (rules) => {
              return [
                ...rules,
                {
                  test: /\.css$/,
                  use: await createCSSWebpackRuleSet({
                    configure,
                    project,
                    sourceMaps,
                    env: simulateEnv,
                  }),
                },
              ];
            });
          },
        );
      });

      dev.hook(({hooks, options: {sourceMaps}}) => {
        (hooks as import('@sewing-kit/hooks').DevWebAppHooks).configureHooks.hook(
          (hooks) => ({
            ...hooks,
            cssModuleClassNamePattern: new WaterfallHook(),
            cssWebpackLoaderOptions: new WaterfallHook(),
          }),
        );

        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildPackageConfigurationHooks &
                import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook(async (rules) => {
              return [
                ...rules,
                {
                  test: /\.css$/,
                  use: await createCSSWebpackRuleSet({
                    configure,
                    project,
                    sourceMaps,
                  }),
                },
              ];
            });
          },
        );
      });
    },
  );
}

export function cssModuleExtensions(extensions: string | string[]) {
  return createProjectPlugin(
    `${PLUGIN}.AddCSSModuleExtensions`,
    ({tasks: {test}}) => {
      test.hook(({hooks}) => {
        hooks.configure.hook(({cssModuleIdentityProxyExtensions}) => {
          cssModuleIdentityProxyExtensions?.hook(
            (oldExtensions: readonly string[]) => [
              ...oldExtensions,
              ...(typeof extensions === 'string' ? [extensions] : extensions),
            ],
          );
        });
      });
    },
  );
}

export function cssModuleClassNamePattern(
  pattern: string | NonNullable<CSSWebpackLoaderOptions['getLocalIdent']>,
) {
  return createProjectPlugin(
    `${PLUGIN}.SetCSSModuleClassNamePattern`,
    ({tasks: {dev, build}}) => {
      build.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          if (typeof pattern === 'string') {
            configure.cssModuleClassNamePattern?.hook(() => pattern);
          } else {
            configure.cssWebpackLoaderOptions?.hook((options) => ({
              ...options,
              getLocalIdent: pattern,
            }));
          }
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          if (typeof pattern === 'string') {
            configure.cssModuleClassNamePattern?.hook(() => pattern);
          } else {
            configure.cssWebpackLoaderOptions?.hook((options) => ({
              ...options,
              getLocalIdent: pattern,
            }));
          }
        });
      });
    },
  );
}

export function cssWebpackLoaderOptions(options: CSSWebpackLoaderOptions) {
  return createProjectPlugin(
    `${PLUGIN}.SetCSSModuleClassNamePattern`,
    ({tasks: {dev, build}}) => {
      const setLoaderOptions = (currentOptions: CSSWebpackLoaderOptions) => ({
        ...currentOptions,
        ...options,
      });

      build.hook(({hooks}) => {
        hooks.configure.hook(({cssWebpackLoaderOptions}) => {
          cssWebpackLoaderOptions?.hook(setLoaderOptions);
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({cssWebpackLoaderOptions}) => {
          cssWebpackLoaderOptions?.hook(setLoaderOptions);
        });
      });
    },
  );
}

export function workspaceCSS() {
  return createWorkspaceLintPlugin(PLUGIN, ({hooks}) => {
    hooks.configure.hook((hooks) => {
      hooks.stylelintExtensions?.hook((extensions) => [...extensions, '.css']);
    });
  });
}
