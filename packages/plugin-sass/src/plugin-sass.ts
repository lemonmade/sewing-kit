import {cpus} from 'os';

import {AsyncSeriesWaterfallHook} from 'tapable';
import {addHooks, createProjectPlugin} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';

declare module '@sewing-kit/hooks' {
  interface BuildBrowserConfigurationCustomHooks {
    readonly sassIncludePaths: AsyncSeriesWaterfallHook<string[]>;
  }
}

interface Options {
  readonly sassIncludes?: readonly string[];
}

const PLUGIN = 'SewingKit.sass';
const HAPPYPACK_ID = 'sass';

const addSassHooks = addHooks(() => ({
  sassIncludePaths: new AsyncSeriesWaterfallHook(['sassIncludePaths']),
}));

export const createSassProjectPlugin = ({sassIncludes = []}: Options = {}) =>
  createProjectPlugin({
    id: PLUGIN,
    run({build, test}) {
      build.tap(PLUGIN, ({hooks, options: {sourceMaps}}) => {
        hooks.webApp.tap(PLUGIN, ({hooks}) => {
          hooks.configure.tap(PLUGIN, (configurationHooks) => {
            addSassHooks(configurationHooks);

            configurationHooks.webpackRules?.tap(PLUGIN, (rules) => [
              ...rules,
              {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [`happypack/loader?id=${HAPPYPACK_ID}`],
              },
            ]);

            configurationHooks.webpackPlugins?.tapPromise(
              PLUGIN,
              async (plugins) => {
                const {default: Happypack} = await import('happypack');
                const sassIncludePaths = configurationHooks.sassIncludePaths!.promise(
                  [...sassIncludes],
                );

                return [
                  ...plugins,
                  new Happypack({
                    id: HAPPYPACK_ID,
                    verbose: false,
                    threads: cpus().length - 1,
                    loaders: [
                      {path: 'style-loader'},
                      // {
                      //   path: 'cache-loader',
                      //   query: {
                      //     cacheDirectory: finalCacheDirectory,
                      //     cacheIdentifier,
                      //   },
                      // },
                      {
                        path: 'css-loader',
                        options: {
                          sourceMap: sourceMaps,
                          modules: true,
                          importLoaders: 1,
                          localIdentName: '[name]-[local]_[hash:base64:5]',
                        },
                      },
                      {
                        path: 'postcss-loader',
                        options: {
                          // config: ifElse(!project.hasPostCSSConfig, {
                          //   path: workspace.paths.defaultPostCSSConfig,
                          // }),
                          sourceMap: sourceMaps,
                        },
                      },
                      {
                        path: 'sass-loader',
                        options: {
                          sourceMap: sourceMaps,
                          includePaths: sassIncludePaths,
                        },
                      },
                      // sassGlobalsLoader(workspace),
                    ],
                  } as any),
                ];
              },
            );
          });
        });
      });

      test.tap(PLUGIN, ({hooks}) => {
        hooks.project.tap(PLUGIN, ({hooks}) => {
          hooks.configure.tap(PLUGIN, (hooks) => {
            hooks.jestModuleMapper?.tap(PLUGIN, (moduleMapper) => ({
              ...moduleMapper,
              '\\.scss$': require.resolve('./jest-module-mapper'),
            }));
          });
        });
      });
    },
  });

export const sassProjectPlugin = createSassProjectPlugin();
