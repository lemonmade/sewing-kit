import {join} from 'path';

import {produce} from 'immer';
import {createStep} from '@sewing-kit/ui';
import {Env} from '@sewing-kit/tasks';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-babel';

import {PLUGIN, createWebpackConfig} from './common';

export function buildWebApp({
  hooks,
  workspace,
  options,
}: import('@sewing-kit/tasks').BuildProjectTask) {
  hooks.webApp.tap(PLUGIN, ({webApp, hooks}) => {
    const updatePreset = changeBaseJavaScriptBabelPreset({
      modules: BaseBabelPresetModule.Preserve,
      target: [
        'last 1 chrome versions',
        'last 1 chromeandroid versions',
        'last 1 firefox versions',
        'last 1 opera versions',
        'last 1 edge versions',
        'safari >= 11',
        'ios >= 11',
      ],
    });

    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babelConfig?.tap(PLUGIN, produce(updatePreset));

      configurationHooks.webpackOutputDirectory?.tap(PLUGIN, () =>
        workspace.fs.buildPath('apps'),
      );

      configurationHooks.webpackOutputFilename?.tap(PLUGIN, (filename) =>
        workspace.webApps.length > 1 ? join(webApp.name, filename) : filename,
      );
    });

    hooks.steps.tap(PLUGIN, (steps, {config}, {webpackBuildManager}) => {
      const step = createStep({}, async () => {
        const stats = await buildWebpack(
          await createWebpackConfig(config, webApp, workspace, {
            mode: toMode(options.simulateEnv),
          }),
        );

        webpackBuildManager?.emit(webApp, stats);
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

  return new Promise<import('webpack').Stats>((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(new Error(stats.toString('errors-warnings')));
        return;
      }

      resolve(stats);
    });
  });
}
