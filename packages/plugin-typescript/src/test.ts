import {produce} from 'immer';
import {} from '@sewing-kit/plugin-babel';

import {addTypeScriptBabelConfig} from './utilities';
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

      hooks.babelConfig?.tap(PLUGIN, addTypeScriptBabelConfig);
    });
  });
}
