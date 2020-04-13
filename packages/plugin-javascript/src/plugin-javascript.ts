import {
  Env,
  addHooks,
  WaterfallHook,
  createProjectPlugin,
} from '@sewing-kit/plugins';

import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-eslint';
import {} from '@sewing-kit/plugin-webpack';

import type {Options as BabelPresetOptions} from './babel-preset';
import type {BabelHooks, BabelConfig} from './types';
import {createJavaScriptWebpackRuleSet} from './utilities';

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}
  interface BuildProjectConfigurationCustomHooks extends BabelHooks {}
  interface DevProjectConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.JavaScript';

export function javascript() {
  return createProjectPlugin(PLUGIN, ({project, tasks: {dev, build, test}}) => {
    const addBabelHooks = addHooks<BabelHooks>(() => ({
      babelConfig: new WaterfallHook(),
      babelIgnorePatterns: new WaterfallHook(),
      babelExtensions: new WaterfallHook(),
      babelCacheDependencies: new WaterfallHook(),
    }));

    test.hook(({hooks}) => {
      hooks.configureHooks.hook(addBabelHooks);

      hooks.configure.hook((configure) => {
        configure.jestTransforms?.hook((transforms, {babelTransform}) => ({
          ...transforms,
          ['^.+\\.[m|j]s$']: babelTransform,
        }));

        configure.babelConfig?.hook((babelConfig) => ({
          ...babelConfig,
          presets: [
            ...(babelConfig.presets ?? []),
            [
              require.resolve('@sewing-kit/babel-preset'),
              {
                modules: 'commonjs',
                target: 'node',
              } as BabelPresetOptions,
            ],
          ],
        }));
      });
    });

    build.hook(({hooks, options}) => {
      hooks.configureHooks.hook(addBabelHooks);

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addBaseBabelPreset);
        configure.webpackRules?.hook(async (rules) => [
          ...rules,
          {
            test: /\.m?js/,
            exclude: /node_modules/,
            use: await createJavaScriptWebpackRuleSet({
              project,
              env: options.simulateEnv,
              configuration: configure,
              cacheDirectory: 'js',
              cacheDependencies: [],
            }),
          },
        ]);
      });
    });

    dev.hook(({hooks}) => {
      hooks.configureHooks.hook(addBabelHooks);

      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(addBaseBabelPreset);
        configure.webpackRules?.hook(async (rules) => [
          ...rules,
          {
            test: /\.m?js/,
            exclude: /node_modules/,
            use: await createJavaScriptWebpackRuleSet({
              project,
              env: Env.Development,
              configuration: configure,
              cacheDirectory: 'js',
              cacheDependencies: [],
            }),
          },
        ]);
      });
    });
  });
}

function addBaseBabelPreset(babelConfig: BabelConfig) {
  return {
    ...babelConfig,
    presets: [
      ...(babelConfig.presets ?? []),
      require.resolve('@sewing-kit/babel-preset'),
    ],
  };
}
