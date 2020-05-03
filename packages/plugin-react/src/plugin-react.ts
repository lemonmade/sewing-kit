import {Env, createProjectPlugin} from '@sewing-kit/plugins';
import type {BabelConfig} from '@sewing-kit/plugin-javascript';
import type {} from '@sewing-kit/plugin-webpack';
import type {} from '@sewing-kit/plugin-jest';

const PLUGIN = 'SewingKit.React';
const DEV_WEBPACK_DEVTOOL = 'cheap-module-source-map';

export interface Options {
  preact?: boolean;
  fastRefresh?: boolean;
}

export function react({preact = false, fastRefresh = true}: Options = {}) {
  return createProjectPlugin(PLUGIN, ({tasks: {build, test, dev}}) => {
    build.hook(({hooks, options}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: options.simulateEnv === Env.Development,
        fastReload: false,
      });

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addReactBabelConfig);

        if (options.simulateEnv === Env.Development) {
          configure.webpackDevtool?.hook(() => DEV_WEBPACK_DEVTOOL);
        }

        if (preact) {
          configure.webpackAliases?.hook(addPreactWebpackAliases);
        }
      });
    });

    dev.hook(({hooks, options}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: true,
        fastReload: fastRefresh && options.reload === 'fast',
      });

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addReactBabelConfig);
        configure.webpackDevtool?.hook(() => DEV_WEBPACK_DEVTOOL);

        if (fastRefresh && options.reload === 'fast') {
          configure.webpackPlugins?.hook(async (plugins) => {
            // @see https://github.com/pmmmwh/react-refresh-webpack-plugin
            // type RefreshOptions = NonNullable<
            //   ConstructorParameters<
            //     typeof import('@pmmmwh/react-refresh-webpack-plugin').ReactRefreshPlugin
            //   >[0]
            // >;
            const {default: ReactRefreshWebpackPlugin} = await import(
              '@pmmmwh/react-refresh-webpack-plugin'
            );

            return [
              ...plugins,
              new ReactRefreshWebpackPlugin({overlay: false}),
            ];
          });
        }

        if (preact) {
          configure.webpackAliases?.hook(addPreactWebpackAliases);
        }
      });
    });

    test.hook(({hooks}) => {
      const addBabelPreset = createBabelConfigAdjuster({
        development: true,
        fastReload: false,
      });

      hooks.configure.hook((hooks) => {
        hooks.babelConfig?.hook(addBabelPreset);

        if (preact) {
          hooks.jestModuleMapper?.hook(addPreactJestModuleMap);
        }
      });
    });
  });
}

function addPreactWebpackAliases(aliases: {[key: string]: string}) {
  return {
    ...aliases,
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react-dom/test-utils': 'preact/test-utils',
  };
}

function addPreactJestModuleMap(moduleMap: {[key: string]: string}) {
  return {
    ...moduleMap,
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
    '^react-dom/test-utils$': 'preact/test-utils',
  };
}

function createBabelConfigAdjuster({
  development = false,
  fastReload = false,
} = {}) {
  return (config: BabelConfig): BabelConfig => ({
    ...config,
    presets: [
      ...(config.presets ?? []),
      ['@babel/preset-react', {development, useBuiltIns: true}],
    ],
    plugins: fastReload
      ? config.plugins
      : [...(config.plugins ?? []), 'react-refresh/babel'],
  });
}
