import {basename} from 'path';
import {DiscoveryTask, Service} from '@sewing-kit/core';
import {loadConfig} from '@sewing-kit/config/load';
import {PLUGIN} from './common';

export default function discoverServices({
  hooks,
  fs,
  root,
  name,
}: DiscoveryTask) {
  hooks.services.tapPromise(PLUGIN, async (otherServices) => {
    if (await fs.hasDirectory('server')) {
      return [
        ...otherServices,
        new Service({
          name,
          root,
          entry: fs.resolvePath('server'),
          ...(await loadConfig(root, {allowRootPlugins: true})),
        }),
      ];
    }

    const services = await fs.glob('services/*/');
    return [
      ...otherServices,
      ...(await Promise.all(
        services.map(
          async (root) =>
            new Service({
              name: basename(root),
              root,
              entry: root,
              ...(await loadConfig(root, {allowRootPlugins: false})),
            }),
        ),
      )),
    ];
  });
}
