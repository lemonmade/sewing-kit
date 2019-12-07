import {createProjectPlugin, lazy} from '@sewing-kit/plugins';
import {PLUGIN} from './common';

export const webAppWebpackPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, dev}) {
    build.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./build')).buildWebApp),
    );

    dev.tapPromise(
      PLUGIN,
      lazy(async () => (await import('./dev')).devWebApp),
    );
  },
});
