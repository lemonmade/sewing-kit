import {BabelConfig} from '@sewing-kit/plugin-babel';
import {
  Module as BaseBabelPresetModule,
  Polyfill as BaseBabelPresetPolyfill,
  Target as BaseBabelPresetTarget,
} from '@sewing-kit/babel-preset';

import type {Options as BaseBabelPresetOptions} from '@sewing-kit/babel-preset';

export type {BaseBabelPresetOptions};
export {BaseBabelPresetModule, BaseBabelPresetPolyfill, BaseBabelPresetTarget};

const resolvedPreset = require.resolve('@sewing-kit/babel-preset');

export function changeBaseJavaScriptBabelPreset(
  options: BaseBabelPresetOptions,
) {
  return (config: BabelConfig): BabelConfig => ({
    ...config,
    presets: config.presets?.map((preset) => {
      if (preset === resolvedPreset) {
        return [preset as string, options];
      } else if (Array.isArray(preset) && preset[0] === resolvedPreset) {
        return [preset[0], {...preset[1], ...options}];
      } else {
        return preset;
      }
    }),
  });
}
