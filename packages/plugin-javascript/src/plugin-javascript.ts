import {
  lazy,
  createProjectPlugin,
  createWorkspaceLintPlugin,
} from '@sewing-kit/plugins';

import {PLUGIN} from './common';

export const javascriptProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({test, build, dev}) {
    test.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./test')).testJavaScript),
    );

    build.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./build')).buildJavaScript),
    );

    dev.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./dev')).devJavaScript),
    );
  },
});

export const javascriptWorkspacePlugin = createWorkspaceLintPlugin(
  PLUGIN,
  lazy(async () => (await import('./lint')).lintJavaScript),
);
