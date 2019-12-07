import {produce} from 'immer';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';
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
            contents: (relative) =>
              `export * from ${JSON.stringify(
                relative,
              )};\nexport {default} from ${JSON.stringify(relative)};`,
          }),
        ];
      });
    });
  },
);
