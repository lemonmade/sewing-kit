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
