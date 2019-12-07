import {produce} from 'immer';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  createWriteEntriesStep,
  ExportStyle,
} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
} from '@sewing-kit/plugin-javascript';

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
    function prefixExtension(extensions: readonly string[]) {
      return [EXTENSION, ...extensions];
    }

    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, prefixExtension);
      });
    });

    hooks.service.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configurationHooks) => {
        configurationHooks.extensions.tap(PLUGIN, prefixExtension);
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
