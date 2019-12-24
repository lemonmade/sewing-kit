import {Env, createProjectPlugin} from '@sewing-kit/plugins';
import {BabelConfig} from '@sewing-kit/plugin-babel';

const PLUGIN = 'SewingKit.react';

export function react() {
  return createProjectPlugin(PLUGIN, ({tasks: {build, test, dev}}) => {
    build.hook(({hooks, options}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: options.simulateEnv !== Env.Development,
      });

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addReactBabelConfig);
      });
    });

    dev.hook(({hooks}) => {
      const addReactBabelConfig = createBabelConfigAdjuster({
        development: true,
      });

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addReactBabelConfig);
      });
    });

    test.hook(({hooks}) => {
      const addBabelPreset = createBabelConfigAdjuster({development: true});

      hooks.configure.hook((hooks) => {
        hooks.babelConfig?.hook(addBabelPreset);
      });
    });
  });
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
