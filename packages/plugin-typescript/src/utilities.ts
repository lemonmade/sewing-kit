import {produce} from 'immer';
import {BabelConfig} from '@sewing-kit/plugin-babel';

export const addTypeScriptBabelConfig = produce((babelConfig: BabelConfig) => {
  babelConfig.plugins = babelConfig.plugins ?? [];
  babelConfig.presets = babelConfig.presets ?? [];

  // @note https://babeljs.io/docs/en/babel-plugin-proposal-decorators#note-compatibility-with-babel-plugin-proposal-class-properties
  babelConfig.plugins.push([
    require.resolve('@babel/plugin-proposal-decorators'),
    {legacy: true},
  ]);
  babelConfig.presets.push(require.resolve('@babel/preset-typescript'));
});
