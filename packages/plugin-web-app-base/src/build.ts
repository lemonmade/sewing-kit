import {join} from 'path';
import {produce} from 'immer';

import {Env} from '@sewing-kit/types';
import {createStep} from '@sewing-kit/ui';
import {BuildTask} from '@sewing-kit/core';
import {changeBabelPreset, updateBabelPreset} from '@sewing-kit/plugin-babel';

import {PLUGIN, createWebpackConfig} from './common';

export default function buildWebApp({hooks, workspace, options}: BuildTask) {
  hooks.webApp.tap(PLUGIN, ({webApp, hooks}) => {
    const changePreset = changeBabelPreset(
      'babel-preset-shopify',
      'babel-preset-shopify/web',
    );

    const updatePreset = updateBabelPreset('babel-preset-shopify/web', {
      modules: false,
    });

    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, (babelConfig) => {
          return produce(babelConfig, (babelConfig) => {
            changePreset(babelConfig);
            updatePreset(babelConfig);
          });
        });
      }

      configurationHooks.output.tap(PLUGIN, () =>
        workspace.fs.buildPath('browser'),
      );

      configurationHooks.filename.tap(PLUGIN, (filename) =>
        workspace.webApps.length > 1 ? join(webApp.name, filename) : filename,
      );
    });

    hooks.steps.tap(PLUGIN, (steps, {browserConfig}) => {
      const step = createStep({}, async () => {
        await buildWebpack(
          await createWebpackConfig(browserConfig, webApp, workspace, {
            mode: toMode(options.simulateEnv),
          }),
        );
      });

      return [...steps, step];
    });
  });
}

function toMode(env: Env) {
  switch (env) {
    case Env.Production:
    case Env.Staging:
      return 'production';
    default:
      return 'development';
  }
}

async function buildWebpack(config: import('webpack').Configuration) {
  const {default: webpack} = await import('webpack');
  const compiler = webpack(config);

  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(new Error(stats.toString('errors-warnings')));
        return;
      }

      resolve();
    });
  });
}
