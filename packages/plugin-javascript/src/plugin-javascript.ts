import {
  Env,
  addHooks,
  WaterfallHook,
  createProjectPlugin,
  unwrapPossibleArrayGetter,
  ValueOrGetter,
  ValueOrArray,
  TargetRuntime,
  Runtime,
} from '@sewing-kit/plugins';

import type {} from '@sewing-kit/plugin-webpack';

import type {Options as BabelPresetOptions} from './babel-preset';
import type {BabelHooks, BabelConfig} from './types';
import {CORE_PRESET, createJavaScriptWebpackRuleSet} from './utilities';

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}
  interface BuildProjectConfigurationCustomHooks extends BabelHooks {}
  interface DevProjectConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.JavaScript';

interface Options {
  readonly babelConfig?: Partial<BabelConfig>;
}

export function javascript({babelConfig}: Options = {}) {
  return createProjectPlugin(
    PLUGIN,
    ({api, project, tasks: {dev, build, test}}) => {
      const addBabelHooks = addHooks<BabelHooks>(() => ({
        babelConfig: new WaterfallHook(),
        babelIgnorePatterns: new WaterfallHook(),
        babelExtensions: new WaterfallHook(),
        babelCacheDependencies: new WaterfallHook(),
      }));

      const explicitBabelConfig =
        babelConfig &&
        ((): BabelConfig => ({plugins: [], presets: [], ...babelConfig}));

      test.hook(({hooks}) => {
        hooks.configureHooks.hook(addBabelHooks);

        hooks.configure.hook((configure) => {
          configure.babelConfig?.hook(
            explicitBabelConfig ??
              addCoreBabelPreset(new TargetRuntime([Runtime.Node])),
          );
        });
      });

      build.hook(({hooks, options}) => {
        hooks.configureHooks.hook(addBabelHooks);

        hooks.target.hook(({hooks, target}) => {
          hooks.configure.hook((configure) => {
            configure.babelConfig?.hook(
              explicitBabelConfig ?? addCoreBabelPreset(target.runtime),
            );

            configure.webpackRules?.hook(async (rules) => [
              ...rules,
              {
                test: /\.m?js/,
                exclude: /node_modules/,
                use: await createJavaScriptWebpackRuleSet({
                  api,
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
      });

      dev.hook(({hooks}) => {
        hooks.configureHooks.hook(addBabelHooks);

        hooks.configure.hook((configure) => {
          configure.babelConfig?.hook(
            explicitBabelConfig ??
              addCoreBabelPreset(TargetRuntime.fromProject(project)),
          );
          configure.webpackRules?.hook(async (rules) => [
            ...rules,
            {
              test: /\.m?js/,
              exclude: /node_modules/,
              use: await createJavaScriptWebpackRuleSet({
                api,
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
    },
  );
}

type Preset = NonNullable<BabelConfig['presets']>[number];
type Plugin = NonNullable<BabelConfig['plugins']>[number];

export function babelPresets(
  presets: ValueOrGetter<ValueOrArray<Preset>, [Preset[]]>,
) {
  return createProjectPlugin(
    `${PLUGIN}.BabelPresets`,
    ({tasks: {test, build, dev}}) => {
      const addBabelPresets = async (
        config: BabelConfig,
      ): Promise<BabelConfig> => ({
        ...config,
        presets: [
          ...config.presets,
          ...(await unwrapPossibleArrayGetter(presets, config.presets)),
        ],
      });

      test.hook(({hooks}) => {
        hooks.configure.hook(({babelConfig}) => {
          babelConfig?.hook(addBabelPresets);
        });
      });

      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook(({babelConfig}) => {
            babelConfig?.hook(addBabelPresets);
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({babelConfig}) => {
          babelConfig?.hook(addBabelPresets);
        });
      });
    },
  );
}

export function babelPlugins(
  plugins: ValueOrGetter<ValueOrArray<Plugin>, [Plugin[]]>,
) {
  return createProjectPlugin(
    `${PLUGIN}.BabelPlugins`,
    ({tasks: {test, build, dev}}) => {
      const addBabelPlugins = async (
        config: BabelConfig,
      ): Promise<BabelConfig> => ({
        ...config,
        plugins: [
          ...config.plugins,
          ...(await unwrapPossibleArrayGetter(plugins, config.plugins)),
        ],
      });

      test.hook(({hooks}) => {
        hooks.configure.hook(({babelConfig}) => {
          babelConfig?.hook(addBabelPlugins);
        });
      });

      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook(({babelConfig}) => {
            babelConfig?.hook(addBabelPlugins);
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(({babelConfig}) => {
          babelConfig?.hook(addBabelPlugins);
        });
      });
    },
  );
}

function addCoreBabelPreset(runtime: TargetRuntime) {
  const options: BabelPresetOptions = {
    target:
      runtime.includes(Runtime.Node) && runtime.runtimes.size === 1
        ? 'node'
        : undefined,
  };

  return (config: BabelConfig): BabelConfig => ({
    ...config,
    presets: [...config.presets, [require.resolve(CORE_PRESET), options]],
  });
}
