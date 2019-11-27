import {join} from 'path';
import {produce} from 'immer';

import {BuildTask} from '@sewing-kit/core';
import {changeBabelPreset, updateBabelPreset} from '@sewing-kit/plugin-babel';

import {PLUGIN} from './common';

export default function buildService({hooks, workspace}: BuildTask) {
  hooks.service.tap(PLUGIN, ({service, hooks}) => {
    const changePreset = changeBabelPreset(
      'babel-preset-shopify',
      'babel-preset-shopify/node',
    );

    const updatePreset = updateBabelPreset('babel-preset-shopify/node', {
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
