import {cpus} from 'os';
import {AsyncSeriesWaterfallHook} from 'tapable';

import {
  addHooks,
  createPlugin,
  PluginTarget,
  MissingPluginError,
} from '@sewing-kit/plugin-utilities';
import {WebApp} from '@sewing-kit/core';
import {BuildWebAppHooks} from '@sewing-kit/types';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';

declare module '@sewing-kit/types' {
  interface BuildBrowserConfigurationCustomHooks {
    readonly sassIncludePaths: AsyncSeriesWaterfallHook<string[]>;
  }
}

const PLUGIN = 'SewingKit.sass';
const HAPPYPACK_ID = 'sass';

const addSassHooks = addHooks(() => ({
  sassIncludePaths: new AsyncSeriesWaterfallHook(['sassIncludePaths']),
}));

export function createSassIncludesBuildProjectPlugin(include: string[]) {
  const id = 'SewingKit.sassIncludes';

  return createPlugin(
    {id, target: PluginTarget.BuildProject},
    ({project, hooks}) => {
      if (!(project instanceof WebApp)) {
        return;
      }

      (hooks as BuildWebAppHooks).configure.tap(id, (configurationHooks) => {
        if (configurationHooks.sassIncludePaths == null) {
          throw new MissingPluginError('@sewing-kit/plugin-styles');
        }

        configurationHooks.sassIncludePaths.tap(id, (paths) => [
          ...paths,
          ...include,
        ]);
      });
    },
  );
}

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({hooks, options: {sourceMaps = false}}) => {
      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          addSassHooks(configurationHooks);

          if (configurationHooks.webpackRules) {
            configurationHooks.webpackRules.tap(PLUGIN, (rules) => [
              ...rules,
              {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [`happypack/loader?id=${HAPPYPACK_ID}`],
              },
            ]);
          }

          if (configurationHooks.webpackPlugins) {
            configurationHooks.webpackPlugins.tapPromise(
              PLUGIN,
              async (plugins) => {
                const {default: Happypack} = await import('happypack');
                const sassIncludePaths = configurationHooks.sassIncludePaths!.promise(
                  [],
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
          }
        });
      });
    });

    tasks.test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          if (hooks.jestModuleMapper) {
            hooks.jestModuleMapper.tap(PLUGIN, (moduleMapper) => ({
              ...moduleMapper,
              '\\.scss$': require.resolve('./jest-module-mapper'),
            }));
          }
        });
      });
    });
  },
);
