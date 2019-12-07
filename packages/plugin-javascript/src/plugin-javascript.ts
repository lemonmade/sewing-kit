import {
  lazy,
  createProjectPlugin,
  createWorkspaceLintPlugin,
} from '@sewing-kit/plugins';

import {PLUGIN} from './common';

export const javascriptProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({test, build}) {
    test.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./test')).testJavaScript),
    );

    build.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./build')).buildJavaScript),
    );
  },
});

export const javascriptWorkspacePlugin = createWorkspaceLintPlugin(
  PLUGIN,
  lazy(async () => (await import('./lint')).lintJavaScript),
);
