import {
  Env,
  Service,
  WebApp,
  addHooks,
  WaterfallHook,
  createProjectPlugin,
  ValueOrGetter,
  unwrapPossibleGetter,
  ValueOrArray,
  unwrapPossibleArrayGetter,
  TargetRuntime,
} from '@sewing-kit/plugins';

import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';

import {
  PostcssPlugins,
  CSSWebpackHooks,
  CSSTestingHooks,
  CSSWebpackLoaderOptions,
  CSSWebpackLoaderModule,
} from './types';
import {createCSSWebpackRuleSet, usesRealCss, ENV_PRESET} from './utilities';
import type {Features as PostcssFeatures, ImportFrom} from './postcss-preset';

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends CSSTestingHooks {}
  interface BuildProjectConfigurationCustomHooks extends CSSWebpackHooks {}
  interface DevProjectConfigurationCustomHooks extends CSSWebpackHooks {}
}

const addWebpackHooks = addHooks<CSSWebpackHooks>(() => ({
  postcssPlugins: new WaterfallHook(),
  postcssEnvFeatures: new WaterfallHook(),
  postcssEnvStage: new WaterfallHook(),
  postcssEnvPreserve: new WaterfallHook(),
  postcssEnvGrid: new WaterfallHook(),
  cssCustomValues: new WaterfallHook(),
  cssWebpackIgnoreOrder: new WaterfallHook(),
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

const PLUGIN = 'SewingKit.CSS';

interface Options {
  readonly id?: string;
  readonly postcss?: boolean | PostcssPlugins;
  readonly cssModules?: boolean;
}

export function css({
  id = 'css',
  postcss = true,
  cssModules = true,
}: Options = {}) {
  return createProjectPlugin<Service | WebApp>(
    PLUGIN,
    ({api, project, tasks: {dev, build, test}}) => {
      test.hook(({hooks}) => {
        hooks.configureHooks.hook(
          addHooks<CSSTestingHooks>(() => ({
            cssModuleIdentityProxyExtensions: new WaterfallHook(),
          })),
        );

        hooks.configure.hook((configure) => {
          configure.jestModuleMapper?.hook(async (moduleMapper) => {
            const extensions = await configure.cssModuleIdentityProxyExtensions!.run(
              ['.css'],
            );

            // For all the "CSS-like" files, we map it to a module that will treat
            // every import as the imported name in string form. This is close enough
            // to the actual behavior of CSS modules in dev/ production for the purposes
            // of Jest, where we do not typically see CSS tested directly.
            return extensions.length === 0
              ? moduleMapper
              : {
                  ...moduleMapper,
                  [`\\.(${extensions
                    .map((ext) => ext.replace(/^\./, ''))
                    .join('|')})$`]: require.resolve(
                    './jest-parts/module-mapper',
                  ),
                };
          });
        });
      });

      build.hook(({hooks, options: {simulateEnv, sourceMaps}}) => {
        hooks.configureHooks.hook(addWebpackHooks);

        hooks.target.hook(({hooks, target}) => {
          hooks.configure.hook((configuration) => {
            configuration.postcssPlugins?.hook(
              createBasePresetAdder(configuration),
            );

            configuration.webpackRules?.hook(
              createWebpackRuleAdder({
                sourceMaps,
                configuration,
                env: simulateEnv,
                target,
              }),
            );

            if (simulateEnv !== Env.Production || !usesRealCss(target)) return;

            configuration.webpackOptimizeMinizers?.hook(async (minimizers) => {
              const [
                {default: OptimizeCssAssetsPlugin},
                optimizeOptions,
              ] = await Promise.all([
                import('optimize-css-assets-webpack-plugin'),
                configuration.cssWebpackOptimizeOptions!.run({
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

            configuration.webpackPlugins?.hook(async (plugins) => {
              const [
                {default: MiniCssExtractPlugin},
                cssWebpackFileName,
                ignoreOrder,
              ] = await Promise.all([
                import('mini-css-extract-plugin'),
                configuration.cssWebpackFileName!.run(
                  '[name]-[contenthash].css',
                ),
                // We will default to ignoring order if using CSS modules,
                // because CSS modules use class namespacing to avoid most
                // of the problems associated with reordering CSS.
                configuration.cssWebpackIgnoreOrder!.run(cssModules),
              ] as const);

              return [
                ...plugins,
                // Generates the actual .css files
                new MiniCssExtractPlugin(
                  await configuration.cssWebpackMiniExtractOptions!.run({
                    ignoreOrder,
                    filename: cssWebpackFileName,
                    chunkFilename: cssWebpackFileName.replace(
                      /\[name\]/,
                      '[id]',
                    ),
                  }),
                ),
              ];
            });
          });
        });
      });

      dev.hook(({hooks, options: {sourceMaps}}) => {
        hooks.configureHooks.hook(addWebpackHooks);

        hooks.configure.hook((configuration) => {
          if (project instanceof WebApp) {
            configuration.postcssPlugins!.hook(
              createBasePresetAdder(configuration),
            );
          }

          configuration.webpackRules?.hook(
            createWebpackRuleAdder({
              sourceMaps,
              configuration,
              env: Env.Development,
              target: {
                options: {},
                project,
                runtime: TargetRuntime.fromProject(project),
              },
            }),
          );
        });
      });

      function createWebpackRuleAdder(
        options: Pick<
          Parameters<typeof createCSSWebpackRuleSet>[0],
          'env' | 'sourceMaps' | 'configuration' | 'target'
        >,
      ) {
        return async (rules: readonly import('webpack').Rule[]) => {
          return [
            ...rules,
            {
              test: /\.css$/,
              use: await createCSSWebpackRuleSet({
                id,
                api,
                cssModules,
                cacheDependencies: [],
                cacheDirectory: 'css',
                postcss,
                ...options,
              }),
            } as import('webpack').RuleSetRule,
          ];
        };
      }

      function createBasePresetAdder(configuration: Partial<CSSWebpackHooks>) {
        return async (plugins: PostcssPlugins) => {
          if (typeof postcss === 'object') {
            return {...plugins, ...postcss};
          }

          const [
            cssCustomValues,
            postcssEnvFeatures,
            postcssEnvPreserve,
            postcssEnvStage,
            postcssEnvGrid,
          ] = await Promise.all([
            configuration.cssCustomValues!.run([]),
            configuration.postcssEnvFeatures!.run({}),
            configuration.postcssEnvPreserve!.run(true),
            configuration.postcssEnvStage!.run(2),
            configuration.postcssEnvGrid!.run('autoplace'),
          ] as const);

          return {
            ...plugins,
            [ENV_PRESET]: {
              autoprefixer: {grid: postcssEnvGrid},
              stage: postcssEnvStage,
              features: postcssEnvFeatures,
              preserve: postcssEnvPreserve,
              importFrom: cssCustomValues,
            },
          };
        };
      }
    },
  );
}

export function postcssPlugins(
  plugins: ValueOrGetter<PostcssPlugins, [PostcssPlugins]>,
) {
  return createProjectPlugin(
    `${PLUGIN}.SetPostcssPlugins`,
    ({tasks: {dev, build}}) => {
      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook(({postcssPlugins}) => {
            postcssPlugins?.hook(async (allPlugins) => ({
              ...allPlugins,
              ...(await unwrapPossibleGetter(plugins, allPlugins)),
            }));
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({postcssPlugins}) => {
          postcssPlugins?.hook(async (allPlugins) => ({
            ...allPlugins,
            ...(await unwrapPossibleGetter(plugins, allPlugins)),
          }));
        });
      });
    },
  );
}

export function postcssEnvFeatures(
  features: ValueOrGetter<PostcssFeatures, [PostcssFeatures]>,
) {
  return createProjectPlugin(
    `${PLUGIN}.SetPostcssEnvFeatures`,
    ({tasks: {dev, build}}) => {
      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook(({postcssEnvFeatures}) => {
            postcssEnvFeatures?.hook(async (allFeatures) => ({
              ...allFeatures,
              ...(await unwrapPossibleGetter(features, allFeatures)),
            }));
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({postcssEnvFeatures}) => {
          postcssEnvFeatures?.hook(async (allFeatures) => ({
            ...allFeatures,
            ...(await unwrapPossibleGetter(features, allFeatures)),
          }));
        });
      });
    },
  );
}

export function cssCustomValues(
  importFrom: ValueOrGetter<ValueOrArray<ImportFrom>, [readonly ImportFrom[]]>,
) {
  return createProjectPlugin(
    `${PLUGIN}.SetPostcssEnvFeatures`,
    ({tasks: {dev, build}}) => {
      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook(({cssCustomValues}) => {
            cssCustomValues?.hook(async (allImports) => [
              ...allImports,
              ...(await unwrapPossibleArrayGetter(importFrom, allImports)),
            ]);
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({cssCustomValues}) => {
          cssCustomValues?.hook(async (allImports) => [
            ...allImports,
            ...(await unwrapPossibleArrayGetter(importFrom, allImports)),
          ]);
        });
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
        hooks.target.hook(({hooks}) => {
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

export function cssWebpackLoaderOptions(
  options: ValueOrGetter<CSSWebpackLoaderOptions>,
) {
  return createProjectPlugin(
    `${PLUGIN}.SetCSSModuleClassNamePattern`,
    ({tasks: {dev, build}}) => {
      const setLoaderOptions = async (
        currentOptions: CSSWebpackLoaderOptions,
      ) => ({
        ...currentOptions,
        ...(await unwrapPossibleGetter(options)),
      });

      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook(({cssWebpackLoaderOptions}) => {
            cssWebpackLoaderOptions?.hook(setLoaderOptions);
          });
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
