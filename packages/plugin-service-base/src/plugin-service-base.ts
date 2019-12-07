import {createProjectPlugin, lazy} from '@sewing-kit/plugins';

import {PLUGIN} from './common';

export const serviceWebpackPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, dev}) {
    dev.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./dev')).devService),
    );

    build.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./build')).buildService),
    );
  },
});
