import {createPlugin, PluginTarget, lazy} from '@sewing-kit/plugin-utilities';
import {PLUGIN} from './common';

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.discovery.tapPromise(PLUGIN, lazy(() => import('./discovery')));
    tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
    tasks.dev.tapPromise(PLUGIN, lazy(() => import('./dev')));
  },
);
