import {produce} from 'immer';
import {
  createProjectPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import {
  createWriteEntriesStep,
  ExportStyle,
} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.package-esnext';
const VARIANT = 'esnext';
const EXTENSION = '.esnext';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export const packageCreateEsNextOutputPlugin = createProjectBuildPlugin(
  PLUGIN,
  ({hooks}, api) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => {
        return [...variants, {[VARIANT]: true}];
      });

      hooks.configure.tap(PLUGIN, (configurationHooks, {esnext}) => {
        if (!esnext) {
          return;
        }

        if (configurationHooks.babelConfig) {
          configurationHooks.babelConfig.tap(PLUGIN, (babelConfig) => {
            return produce(
              babelConfig,
              changeBaseJavaScriptBabelPreset({
                modules: BaseBabelPresetModule.Preserve,
                target: ['last 1 chrome version'],
              }),
            );
          });
        }
      });

      hooks.steps.tap(PLUGIN, (steps, {config, variant: {esnext}}) => {
        if (!esnext) {
          return steps;
        }

        const outputPath = pkg.fs.buildPath('esnext');

        return [
          ...steps,
          createCompileBabelStep(pkg, api, config, {
            outputPath,
            extension: EXTENSION,
            configFile: 'babel.esnext.js',
          }),
          createWriteEntriesStep(pkg, {
            outputPath,
            extension: EXTENSION,
            exportStyle: ExportStyle.EsModules,
          }),
        ];
      });
    });
  },
);

const USER_PLUGIN = `${PLUGIN}.Consumer`;

function addExtension(extensions: readonly string[]): readonly string[] {
  return [EXTENSION, ...extensions];
}

export const useEsNextPlugin = createProjectPlugin({
  id: USER_PLUGIN,
  run({build, dev}) {
    build.tap(USER_PLUGIN, ({hooks}) => {
      hooks.service.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, useEsNext);
      });

      hooks.webApp.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, useEsNext);
      });
    });

    dev.tap(USER_PLUGIN, ({hooks}) => {
      hooks.service.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, useEsNext);
      });

      hooks.webApp.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, useEsNext);
      });
    });
  },
});

function useEsNext(
  configure:
    | import('@sewing-kit/hooks').BuildServiceConfigurationHooks
    | import('@sewing-kit/hooks').BuildWebAppConfigurationHooks
    | import('@sewing-kit/hooks').DevServiceConfigurationHooks
    | import('@sewing-kit/hooks').DevWebAppConfigurationHooks,
) {
  configure.webpackExtensions?.tap(USER_PLUGIN, addExtension);
  configure.webpackRules?.tapPromise(PLUGIN, async (rules) => {
    const options = await configure.babelConfig?.promise({});

    return [
      ...rules,
      {
        test: /\.esnext/,
        include: /node_modules/,
        loader: 'babel-loader',
        options,
      },
    ];
  });
}
