import {
  lazy,
  createProjectPlugin,
  createProjectDevPlugin,
} from '@sewing-kit/plugins';

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

export function createDevServerConnectionPlugin({
  ip = 'localhost',
  port,
}: {
  ip?: string;
  port: number;
}) {
  const pluginId = `${PLUGIN}.DevServerConnection`;
  return createProjectDevPlugin(pluginId, ({hooks}) => {
    hooks.service.tap(PLUGIN, ({hooks}) => {
      hooks.configure.tap(PLUGIN, (configure) => {
        configure.port.tap(PLUGIN, () => port);
        configure.ip.tap(PLUGIN, () => ip);
      });
    });
  });
}
