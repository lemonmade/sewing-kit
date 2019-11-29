import {produce} from 'immer';
import {
  Module as BabelPresetModule,
  Target as BabelPresetTarget,
} from '@sewing-kit/babel-preset';
import {} from '@sewing-kit/plugin-babel';

import {PLUGIN} from './common';

import {} from '@sewing-kit/plugin-jest';

export default function testJavaScript({
  hooks,
}: import('@sewing-kit/core').TestTask) {
  hooks.project.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
      // versions of the file, which Jest can't parse. To avoid transforming
      // those otherwise-fine files, we prefer .js for tests only.
      hooks.jestExtensions?.tap(PLUGIN, (extensions) => [
        '.js',
        '.mjs',
        ...extensions,
      ]);

      hooks.jestTransforms?.tap(PLUGIN, (transforms, {babelTransform}) => {
        return produce(transforms, (transforms) => {
          transforms['^.+\\.[m|j]s$'] = babelTransform;
        });
      });

      hooks.babelConfig?.tap(PLUGIN, (babelConfig) => {
        return produce(babelConfig, (babelConfig) => {
          babelConfig.presets = babelConfig.presets || [];
          babelConfig.presets.push([
            require.resolve('@sewing-kit/babel-preset'),
            {
              modules: BabelPresetModule.CommonJs,
              target: BabelPresetTarget.Node,
            },
          ]);
        });
      });
    });
  });
}
