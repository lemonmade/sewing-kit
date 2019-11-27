import {produce} from 'immer';

import {Runtime} from '@sewing-kit/types';
import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {createWriteEntriesStep} from '@sewing-kit/plugin-package-utilities';
import {
  changeBabelPreset,
  updateBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-package-base';

const PLUGIN = 'SewingKit.package-commonjs';
const VARIANT = 'commonjs';

declare module '@sewing-kit/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

const setCommonJsModules = updateBabelPreset(
  [
    'babel-preset-shopify',
    'babel-preset-shopify/web',
    'babel-preset-shopify/node',
  ],
  {modules: 'commonjs'},
);

const setNodePreset = changeBabelPreset(
  ['babel-preset-shopify', 'babel-preset-shopify/web'],
  'babel-preset-shopify/node',
);

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
      hooks.configure.tap(PLUGIN, (hooks) => {
        if (hooks.packageBuildArtifacts) {
          hooks.packageBuildArtifacts.tapPromise(PLUGIN, async (artifacts) => [
            ...artifacts,
            ...workspace.packages.map((pkg) => pkg.fs.buildPath('cjs')),
            ...(await Promise.all(
              workspace.packages.map(async (pkg) =>
                pkg.fs.glob('./*.js', {
                  ignore: await pkg.fs.glob('sewing-kit.config.*'),
                }),
              ),
            )).flat(),
          ]);
        }
      });

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
                  setNodePreset(babelConfig);
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
            createCompileBabelStep(pkg, workspace, config, {
              outputPath,
              configFile: 'babel.cjs.js',
            }),
            createWriteEntriesStep(pkg, {
              outputPath,
              extension: '.js',
              contents: (relative) =>
                `module.exports = require(${JSON.stringify(relative)});`,
            }),
          ];
        });
      });
    });
  },
);
