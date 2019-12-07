import {PLUGIN} from './common';

import {} from '@sewing-kit/plugin-eslint';

export function lintJavaScript({
  hooks,
}: import('@sewing-kit/tasks').LintWorkspaceTask) {
  hooks.configure.tap(PLUGIN, (hooks) => {
    hooks.eslintExtensions?.tap(PLUGIN, (extensions) => [
      ...extensions,
      '.mjs',
      '.js',
    ]);
  });
}
