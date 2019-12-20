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
    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.webpackExtensions?.tap(PLUGIN, addExtension);
      });
    });

    hooks.service.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.webpackExtensions?.tap(PLUGIN, addExtension);
      });
    });

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
        hooks.configure.tap(USER_PLUGIN, (configure) => {
          configure.webpackExtensions?.tap(USER_PLUGIN, addExtension);
        });
      });

      hooks.webApp.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, (configure) => {
          configure.webpackExtensions?.tap(USER_PLUGIN, addExtension);
        });
      });
    });

    dev.tap(USER_PLUGIN, ({hooks}) => {
      hooks.service.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, (configure) => {
          configure.webpackExtensions?.tap(USER_PLUGIN, addExtension);
        });
      });

      hooks.webApp.tap(USER_PLUGIN, ({hooks}) => {
        hooks.configure.tap(USER_PLUGIN, (configure) => {
          configure.webpackExtensions?.tap(USER_PLUGIN, addExtension);
        });
      });
    });
  },
});
