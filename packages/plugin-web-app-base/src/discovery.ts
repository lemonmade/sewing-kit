import {basename, join} from 'path';
import {DiscoveryTask, WebApp} from '@sewing-kit/core';
import {loadConfig} from '@sewing-kit/config/load';
import {PLUGIN} from './common';

export default function discoverWebApps({
  hooks,
  fs,
  root,
  name,
}: DiscoveryTask) {
  hooks.webApps.tapPromise(PLUGIN, async (webApps) => {
    if (await fs.hasDirectory('app')) {
      return [
        ...webApps,
        new WebApp({
          name,
          root,
          entry: fs.resolvePath('app/browser'),
          ...(await loadConfig(root, {allowRootPlugins: true})),
        }),
      ];
    }

    const apps = await fs.glob('apps/*/');
    return [
      ...webApps,
      ...(await Promise.all(
        apps.map(
          async (root) =>
            new WebApp({
              name: basename(root),
              root,
              entry: join(root, 'browser'),
              ...(await loadConfig(root, {allowRootPlugins: false})),
            }),
        ),
      )),
    ];
  });
}
