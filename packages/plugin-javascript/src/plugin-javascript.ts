import {
  createProjectPlugin,
  createWorkspaceLintPlugin,
  Env,
} from '@sewing-kit/plugins';

import {
  Module as BabelPresetModule,
  Target as BabelPresetTarget,
} from '@sewing-kit/babel-preset';
import {BabelConfig} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-eslint';
import {} from '@sewing-kit/plugin-webpack';

import {createJavaScriptWebpackRuleSet} from './utilities';

const PLUGIN = 'SewingKit.JavaScript';

export function javascript() {
  return createProjectPlugin(PLUGIN, ({project, tasks: {dev, build, test}}) => {
    test.hook(({hooks}) => {
      hooks.configure.hook((configure) => {
        // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
        // versions of the file, which Jest can't parse. To avoid transforming
        // those otherwise-fine files, we prefer .js for tests only.
        configure.jestExtensions?.hook((extensions) => [
          '.js',
          '.mjs',
          ...extensions,
        ]);

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
                modules: BabelPresetModule.CommonJs,
                target: BabelPresetTarget.Node,
              },
            ],
          ],
        }));
      });
    });

    build.hook(({hooks, options}) => {
      hooks.configure.hook(
        (
          configure: Partial<
            import('@sewing-kit/hooks').BuildPackageConfigurationHooks &
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
              import('@sewing-kit/hooks').BuildServiceConfigurationHooks
          >,
        ) => {
          configure.babelConfig?.hook(addBaseBabelPreset);
          configure.babelExtensions?.hook(addJavaScriptExtensions);
          configure.webpackExtensions?.hook(addJavaScriptExtensions);
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
        },
      );
    });

    dev.hook(({hooks}) => {
      hooks.configure.hook(
        (
          configure: Partial<
            import('@sewing-kit/hooks').DevPackageConfigurationHooks &
              import('@sewing-kit/hooks').DevWebAppConfigurationHooks &
              import('@sewing-kit/hooks').DevServiceConfigurationHooks
          >,
        ) => {
          configure.babelConfig?.hook(addBaseBabelPreset);
          configure.webpackExtensions?.hook(addJavaScriptExtensions);
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
        },
      );
    });
  });
}

export function workspaceJavaScript() {
  return createWorkspaceLintPlugin(PLUGIN, ({hooks}) => {
    hooks.configure.hook((hooks) => {
      hooks.eslintExtensions?.hook((extensions) => [
        ...extensions,
        '.mjs',
        '.js',
      ]);
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

function addJavaScriptExtensions(extensions: readonly string[]) {
  return ['.mjs', '.js', ...extensions];
}
