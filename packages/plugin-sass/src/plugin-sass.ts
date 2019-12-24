import {cpus} from 'os';

import {
  WebApp,
  Service,
  WaterfallHook,
  createProjectPlugin,
} from '@sewing-kit/plugins';

import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-webpack';

declare module '@sewing-kit/hooks' {
  interface BuildWebAppConfigurationCustomHooks {
    readonly sassIncludePaths: WaterfallHook<string[]>;
  }

  interface DevWebAppConfigurationCustomHooks {
    readonly sassIncludePaths: WaterfallHook<string[]>;
  }
}

interface Options {
  readonly sassIncludes?: readonly string[];
}

const PLUGIN = 'SewingKit.Sass';
const HAPPYPACK_ID = 'sass';

export function sass({sassIncludes = []}: Options = {}) {
  return createProjectPlugin<WebApp | Service>(
    PLUGIN,
    ({tasks: {build, test}}) => {
      build.hook(({hooks, options: {sourceMaps}}) => {
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
            configure.webpackRules?.hook((rules) => [
              ...rules,
              {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [`happypack/loader?id=${HAPPYPACK_ID}`],
              },
            ]);

            configure.webpackPlugins?.hook(async (plugins) => {
              const {default: Happypack} = await import('happypack');
              const sassIncludePaths = configure.sassIncludePaths!.run([
                ...sassIncludes,
              ]);

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
            });
          },
        );
      });

      test.hook(({hooks}) => {
        hooks.configure.hook((hooks) => {
          hooks.jestModuleMapper?.hook((moduleMapper) => ({
            ...moduleMapper,
            '\\.scss$': require.resolve('./jest-module-mapper'),
          }));
        });
      });
    },
  );
}
