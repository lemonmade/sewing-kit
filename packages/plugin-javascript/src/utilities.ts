import {BabelConfig} from '@sewing-kit/plugin-babel';
import {
  Options as BaseBabelPresetOptions,
  Module as BaseBabelPresetModule,
  Polyfill as BaseBabelPresetPolyfill,
  Target as BaseBabelPresetTarget,
} from '@sewing-kit/babel-preset';

export {
  BaseBabelPresetOptions,
  BaseBabelPresetModule,
  BaseBabelPresetPolyfill,
  BaseBabelPresetTarget,
};

const resolvedPreset = require.resolve('@sewing-kit/babel-preset');

export function changeBaseJavaScriptBabelPreset(
  options: BaseBabelPresetOptions,
) {
  return ({presets = []}: BabelConfig) => {
    for (const [index, preset] of presets.entries()) {
      if (typeof preset === 'string') {
        if (preset === resolvedPreset) {
          presets[index] = [preset, options];
        }
      } else if (preset?.[0] === resolvedPreset) {
        preset[1] = {...preset[1], ...options};
      }
    }
  };
}
