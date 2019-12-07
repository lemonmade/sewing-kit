import {produce} from 'immer';

import {Runtime} from '@sewing-kit/model';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  createWriteEntriesStep,
  ExportStyle,
} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
  BaseBabelPresetTarget,
} from '@sewing-kit/plugin-javascript';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'commonjs';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

const setCommonJsModules = changeBaseJavaScriptBabelPreset({
  modules: BaseBabelPresetModule.CommonJs,
});

const setNodeTarget = changeBaseJavaScriptBabelPreset({
  target: BaseBabelPresetTarget.Node,
});

export const packageCreateCommonJsOutputPlugin = createProjectBuildPlugin(
  PLUGIN,
  ({hooks}, api) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        {[VARIANT]: true},
      ]);

      hooks.configure.tap(PLUGIN, (configurationHooks, {commonjs}) => {
        if (!commonjs) {
          return;
        }

        if (configurationHooks.babelConfig) {
          configurationHooks.babelConfig.tap(PLUGIN, (babelConfig) => {
            const allEntriesAreNode = pkg.entries.every(
              ({runtime}) => runtime === Runtime.Node,
            );

            return produce(babelConfig, (babelConfig) => {
              if (allEntriesAreNode) {
                setNodeTarget(babelConfig);
              }

              setCommonJsModules(babelConfig);
            });
          });
        }
      });

      hooks.steps.tap(PLUGIN, (steps, {config, variant: {commonjs}}) => {
        if (!commonjs) {
          return steps;
        }

        const outputPath = pkg.fs.buildPath('cjs');

        return [
          ...steps,
          createCompileBabelStep(pkg, api, config, {
            outputPath,
            configFile: 'babel.cjs.js',
          }),
          createWriteEntriesStep(pkg, {
            outputPath,
            exportStyle: ExportStyle.CommonJs,
            extension: '.js',
          }),
        ];
      });
    });
  },
);
