import {
  createProjectPlugin,
  createWorkspaceLintPlugin,
} from '@sewing-kit/plugins';

import {
  Module as BabelPresetModule,
  Target as BabelPresetTarget,
} from '@sewing-kit/babel-preset';
import {BabelConfig} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-eslint';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.javascript';

export function javascript() {
  return createProjectPlugin(PLUGIN, ({tasks: {dev, build, test}}) => {
    test.hook(({hooks}) => {
      hooks.configure.hook((hooks) => {
        // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
        // versions of the file, which Jest can't parse. To avoid transforming
        // those otherwise-fine files, we prefer .js for tests only.
        hooks.jestExtensions?.hook((extensions) => [
          '.js',
          '.mjs',
          ...extensions,
        ]);

        hooks.jestTransforms?.hook((transforms, {babelTransform}) => ({
          ...transforms,
          ['^.+\\.[m|j]s$']: babelTransform,
        }));

        hooks.babelConfig?.hook((babelConfig) => ({
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

    build.hook(({hooks}) => {
      hooks.configure.hook(
        (
          configure: Partial<
            import('@sewing-kit/hooks').BuildPackageConfigurationHooks &
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
              import('@sewing-kit/hooks').BuildServiceConfigurationHooks
          >,
        ) => {
          configure.babelConfig?.hook(addBaseBabelPreset);
          configure.babelExtensions?.hook(addJsExtensions);
          configure.webpackRules?.hook(async (rules) => {
            const options = await configure.babelConfig?.run({});

            return [
              ...rules,
              {
                test: /\.m?js/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options,
              },
            ];
          });
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
          configure.webpackRules?.hook(async (rules) => {
            const options = await configure.babelConfig?.run({});

            return [
              ...rules,
              {
                test: /\.m?js/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options,
              },
            ];
          });
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

function addJsExtensions(extensions: readonly string[]) {
  return ['.mjs', '.js', ...extensions];
}
