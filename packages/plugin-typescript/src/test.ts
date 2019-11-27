import {produce} from 'immer';
import {updateBabelPreset} from '@sewing-kit/plugin-babel';

import {PLUGIN} from './common';

import {} from '@sewing-kit/plugin-jest';

export default function testTypescript({
  hooks,
}: import('@sewing-kit/core').TestTask) {
  hooks.project.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      hooks.jestExtensions?.tap(PLUGIN, (extensions) => [
        '.ts',
        '.tsx',
        ...extensions,
      ]);

      hooks.jestTransforms?.tap(PLUGIN, (transforms, {babelTransform}) => {
        return produce(transforms, (transforms) => {
          transforms['^.+\\.tsx?$'] = babelTransform;
        });
      });

      hooks.babelConfig?.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          babelConfig.plugins = babelConfig.plugins ?? [];

          if (
            !babelConfig.plugins!.includes(
              '@babel/plugin-proposal-optional-chaining',
            )
          ) {
            babelConfig.plugins!.push(
              '@babel/plugin-proposal-optional-chaining',
            );
          }

          if (
            !babelConfig.plugins!.includes(
              '@babel/plugin-proposal-nullish-coalescing-operator',
            )
          ) {
            babelConfig.plugins!.push(
              '@babel/plugin-proposal-nullish-coalescing-operator',
            );
          }

          updateBabelPreset('babel-preset-shopify/node', {typescript: true})(
            babelConfig,
          );
        });
      });
    });
  });
}
