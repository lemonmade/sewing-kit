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
import {} from '@sewing-kit/hooks';

const PLUGIN = 'SewingKit.package-esmodules';
const VARIANT = 'esmodules';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

const preserveEsModules = changeBaseJavaScriptBabelPreset({
  modules: BaseBabelPresetModule.Preserve,
});

export const packageCreateEsModulesOutputPlugin = createProjectBuildPlugin(
  PLUGIN,
  ({hooks}, api) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      hooks.configure.tap(PLUGIN, (configurationHooks, {esmodules}) => {
        if (!esmodules) {
          return;
        }

        configurationHooks.babelConfig?.tap(PLUGIN, (babelConfig) => {
          return produce(babelConfig, preserveEsModules);
        });
      });

      hooks.steps.tap(PLUGIN, (steps, {config, variant: {esmodules}}) => {
        if (!esmodules) {
          return steps;
        }

        const outputPath = pkg.fs.buildPath('esm');

        return [
          ...steps,
          createCompileBabelStep(pkg, api, config, {
            outputPath,
            extension: '.mjs',
            configFile: 'babel.esm.js',
          }),
          createWriteEntriesStep(pkg, {
            outputPath,
            extension: '.mjs',
            exportStyle: ExportStyle.EsModules,
          }),
        ];
      });
    });
  },
);

const USER_PLUGIN = `${Plugin}.Consumer`;

function addExtension(extensions: readonly string[]): readonly string[] {
  return ['.mjs', ...extensions];
}

export const useEsModulesPlugin = createProjectPlugin({
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
