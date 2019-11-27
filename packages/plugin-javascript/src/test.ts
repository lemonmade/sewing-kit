import {produce} from 'immer';
import {PLUGIN} from './common';

import {} from '@sewing-kit/plugin-jest';

export default function testJavaScript({
  hooks,
}: import('@sewing-kit/core').TestTask) {
  hooks.project.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      if (hooks.jestExtensions && hooks.jestTransforms) {
        // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
        // versions of the file, which Jest can't parse. To avoid transforming
        // those otherwise-fine files, we prefer .js for tests only.
        hooks.jestExtensions.tap(PLUGIN, (extensions) => [
          '.js',
          '.mjs',
          ...extensions,
        ]);

        hooks.jestTransforms.tap(PLUGIN, (transforms, {babelTransform}) => {
          return produce(transforms, (transforms) => {
            transforms['^.+\\.[m|j]s$'] = babelTransform;
          });
        });
      }

      if (hooks.babelConfig) {
        hooks.babelConfig.tap(PLUGIN, (babelConfig) => {
          return produce(babelConfig, (babelConfig) => {
            babelConfig.presets = babelConfig.presets || [];
            babelConfig.presets.push([
              'babel-preset-shopify/node',
              {modules: 'commonjs'},
            ]);
          });
        });
      }
    });
  });
}
