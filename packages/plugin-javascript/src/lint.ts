import {PLUGIN} from './common';

import {} from '@sewing-kit/plugin-eslint';

export default function lintJavaScript({
  hooks,
}: import('@sewing-kit/core').LintTask) {
  hooks.configure.tap(PLUGIN, (hooks) => {
    if (hooks.eslintExtensions) {
      hooks.eslintExtensions.tap(PLUGIN, (extensions) => [
        ...extensions,
        '.mjs',
        '.js',
      ]);
    }
  });
}
