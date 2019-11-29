import {produce} from 'immer';
import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/types';
import {} from '@sewing-kit/plugin-package-base';

const PLUGIN = 'SewingKit.package-esmodules';
const VARIANT = 'esmodules';

declare module '@sewing-kit/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    const preserveEsModules = changeBaseJavaScriptBabelPreset({
      modules: BaseBabelPresetModule.Preserve,
    });

    tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
      hooks.configure.tap(PLUGIN, (hooks) => {
        hooks.packageBuildArtifacts?.tapPromise(PLUGIN, async (artifacts) => [
          ...artifacts,
          ...workspace.packages.map((pkg) => pkg.fs.buildPath('esm')),
          ...(
            await Promise.all(
              workspace.packages.map((pkg) => pkg.fs.glob('./*.mjs')),
            )
          ).flat(),
        ]);
      });

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
            createCompileBabelStep(pkg, workspace, config, {
              outputPath,
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
    });
  },
);
