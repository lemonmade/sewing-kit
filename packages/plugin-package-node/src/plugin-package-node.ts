import {produce} from 'immer';

import {Runtime} from '@sewing-kit/model';
import {createProjectPlugin} from '@sewing-kit/plugins';
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
import {} from '@sewing-kit/plugin-jest';

const PLUGIN = 'SewingKit.package-node';
const VARIANT = 'node';
const EXTENSION = '.node';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export const packageCreateNodeOutputPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test}, api) {
    build.tap(PLUGIN, ({hooks}) => {
      hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
        hooks.variants.tap(PLUGIN, (variants) => {
          // If all the entries already target node, there is no need to do a
          // node-only build (it will match the CommonJS build).
          if (pkg.entries.every(({runtime}) => runtime === Runtime.Node)) {
            return variants;
          }

          return [...variants, {[VARIANT]: true}];
        });

        hooks.configure.tap(PLUGIN, (configurationHooks, {node}) => {
          if (!node) {
            return;
          }

          if (configurationHooks.babelConfig) {
            configurationHooks.babelConfig.tap(PLUGIN, (babelConfig) => {
              return produce(
                babelConfig,
                changeBaseJavaScriptBabelPreset({
                  modules: BaseBabelPresetModule.CommonJs,
                  target: BaseBabelPresetTarget.Node,
                }),
              );
            });
          }
        });

        hooks.steps.tap(PLUGIN, (steps, {config, variant: {node}}) => {
          if (!node) {
            return steps;
          }

          const outputPath = pkg.fs.buildPath('node');

          return [
            ...steps,
            createCompileBabelStep(pkg, api, config, {
              outputPath,
              extension: EXTENSION,
              configFile: 'babel.node.js',
            }),
            createWriteEntriesStep(pkg, {
              outputPath,
              extension: EXTENSION,
              exportStyle: ExportStyle.CommonJs,
              exclude: (entry) => entry.runtime === Runtime.Node,
            }),
          ];
        });
      });
    });

    test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          hooks.jestExtensions?.tap(PLUGIN, (extensions) => [
            EXTENSION,
            ...extensions,
          ]);
        });
      });
    });
  },
});
