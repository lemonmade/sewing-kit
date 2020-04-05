import {Env, createProjectPlugin} from '@sewing-kit/plugins';
import {BabelConfig} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-webpack';
import {} from '@sewing-kit/plugin-jest';

const PLUGIN = 'SewingKit.React';
const DEV_WEBPACK_DEVTOOL = 'cheap-module-source-map';

export interface Options {
  preact?: boolean;
}

export function react({preact = false}: Options = {}) {
  return createProjectPlugin(PLUGIN, ({tasks: {build, test, dev}}) => {
    build.hook(({hooks, options}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: options.simulateEnv !== Env.Development,
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

    dev.hook(({hooks}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: true,
      });

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addReactBabelConfig);
        configure.webpackDevtool?.hook(() => DEV_WEBPACK_DEVTOOL);

        if (preact) {
          configure.webpackAliases?.hook(addPreactWebpackAliases);
        }
      });
    });

    test.hook(({hooks}) => {
      const addBabelPreset = createBabelConfigAdjuster({development: true});

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

function createBabelConfigAdjuster({development = false} = {}) {
  return (config: BabelConfig): BabelConfig => ({
    ...config,
    presets: [
      ...(config.presets ?? []),
      ['@babel/preset-react', {development, useBuiltIns: true}],
    ],
  });
}
