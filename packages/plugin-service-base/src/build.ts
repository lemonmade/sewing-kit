import {join} from 'path';

import {produce} from 'immer';
import {BuildTask} from '@sewing-kit/core';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
  BaseBabelPresetTarget,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-babel';

import {PLUGIN} from './common';

export default function buildService({hooks, workspace}: BuildTask) {
  hooks.service.tap(PLUGIN, ({service, hooks}) => {
    const updatePreset = changeBaseJavaScriptBabelPreset({
      target: BaseBabelPresetTarget.Node,
      modules: BaseBabelPresetModule.CommonJs,
    });

    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, produce(updatePreset));
      }

      configurationHooks.output.tap(PLUGIN, () =>
        workspace.fs.buildPath('service'),
      );

      configurationHooks.filename.tap(PLUGIN, (filename) =>
        workspace.services.length > 1 ? join(service.name, filename) : filename,
      );
    });

    hooks.steps.tap(PLUGIN, (steps) => {
      return steps;
    });
  });
}
