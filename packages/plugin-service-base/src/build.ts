import {join} from 'path';

import {produce} from 'immer';

import {Env} from '@sewing-kit/tasks';
import {createStep} from '@sewing-kit/ui';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
  BaseBabelPresetTarget,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-babel';

import {PLUGIN as BASE_PLUGIN, createWebpackConfig} from './common';

const PLUGIN = `${BASE_PLUGIN}.build`;

export function buildService({
  hooks,
  options,
  workspace,
}: import('@sewing-kit/tasks').BuildProjectTask) {
  hooks.service.tap(PLUGIN, ({service, hooks}) => {
    const updatePreset = changeBaseJavaScriptBabelPreset({
      target: BaseBabelPresetTarget.Node,
      modules: BaseBabelPresetModule.Preserve,
    });

    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.babelConfig?.tap(PLUGIN, produce(updatePreset));

      configurationHooks.webpackOutputDirectory?.tap(PLUGIN, () =>
        workspace.fs.buildPath('services'),
      );

      configurationHooks.webpackOutputFilename?.tap(PLUGIN, (filename) =>
        workspace.services.length > 1 ? join(service.name, filename) : filename,
      );
    });

    hooks.steps.tap(PLUGIN, (steps, {config}, {webpackBuildManager}) => {
      const step = createStep({}, async () => {
        const stats = await buildWebpack(
          await createWebpackConfig(config, service, workspace, {
            mode: toMode(options.simulateEnv),
          }),
        );

        webpackBuildManager?.emit(service, stats);
      });

      return [...steps, step];
    });
  });
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

function toMode(env: Env) {
  switch (env) {
    case Env.Production:
    case Env.Staging:
      return 'production';
    default:
      return 'development';
  }
}
