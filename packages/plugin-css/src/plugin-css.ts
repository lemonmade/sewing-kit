import {
  Service,
  WebApp,
  WaterfallHook,
  createProjectPlugin,
  createWorkspaceLintPlugin,
  Env,
} from '@sewing-kit/plugins';

import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-stylelint';
import {} from '@sewing-kit/plugin-webpack';

import {
  CSSWebpackHooks,
  CSSWebpackLoaderOptions,
  CSSWebpackLoaderModule,
} from './types';
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
    ({api, project, tasks: {dev, build, test}}) => {
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
          cssWebpackLoaderModule: new WaterfallHook(),
          cssWebpackOptimizeOptions: new WaterfallHook(),
          cssWebpackPostcssLoaderOptions: new WaterfallHook(),
          cssWebpackPostcssLoaderContext: new WaterfallHook(),
          cssWebpackCacheDependencies: new WaterfallHook(),
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
              configure.webpackOptimizeMinizers?.hook(async (minimizers) => {
                const [
                  {default: OptimizeCssAssetsPlugin},
                  optimizeOptions,
                ] = await Promise.all([
                  import('optimize-css-assets-webpack-plugin'),
                  configure.cssWebpackOptimizeOptions!.run({
                    cssProcessorOptions: {
                      map: {inline: false, annotations: true},
                    },
                    cssProcessorPluginOptions: {
                      preset: [
                        'default',
                        {
                          // This rule has an issue where multiple declarations
                          // for the same property are merged into one, which can
                          // change the semantics of code like:
                          //
                          // .klass {
                          //   padding-left: 4rem;
                          //   padding-left: calc(4rem + event(safe-area-inset-left));
                          // }
                          mergeLonghand: false,
                        },
                      ],
                    },
                    canPrint: false,
                  }),
                ] as const);

                return [
                  ...minimizers,
                  new OptimizeCssAssetsPlugin(optimizeOptions),
                ];
              });

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
                  // TODO determine if this is still needed
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
                    api,
                    configuration: configure,
                    project,
                    sourceMaps,
                    env: simulateEnv,
                    cacheDependencies: [],
                    cacheDirectory: 'css',
                  }),
                } as import('webpack').RuleSetRule,
              ];
            });
          },
        );
      });

      dev.hook(({hooks, options: {sourceMaps}}) => {
        (hooks as import('@sewing-kit/hooks').DevWebAppHooks).configureHooks.hook(
          (hooks) => ({
            ...hooks,
            cssWebpackFileName: new WaterfallHook(),
            cssModuleClassNamePattern: new WaterfallHook(),
            cssWebpackLoaderOptions: new WaterfallHook(),
            cssWebpackMiniExtractOptions: new WaterfallHook(),
            cssWebpackLoaderModule: new WaterfallHook(),
            cssWebpackOptimizeOptions: new WaterfallHook(),
            cssWebpackPostcssLoaderOptions: new WaterfallHook(),
            cssWebpackPostcssLoaderContext: new WaterfallHook(),
            cssWebpackCacheDependencies: new WaterfallHook(),
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
                    api,
                    configuration: configure,
                    project,
                    sourceMaps,
                    env: Env.Development,
                    cacheDependencies: [],
                    cacheDirectory: 'css',
                  }),
                } as import('webpack').RuleSetRule,
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
  pattern: string | NonNullable<CSSWebpackLoaderModule['getLocalIdent']>,
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

export function postcssPlugins(plugins: string[]) {
  return createProjectPlugin(
    `${PLUGIN}.SetPostcssPlugins`,
    ({tasks: {dev, build}}) => {
      build.hook(({hooks}) => {
        hooks.configure.hook(({cssWebpackCacheDependencies}) => {
          cssWebpackCacheDependencies?.hook((dependencies) => [
            ...dependencies,
            ...plugins,
          ]);
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({cssWebpackCacheDependencies}) => {
          cssWebpackCacheDependencies?.hook((dependencies) => [
            ...dependencies,
            ...plugins,
          ]);
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
