import {createPlugin, PluginTarget, lazy} from '@sewing-kit/plugin-utilities';
import {PLUGIN} from './common';

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.test.tapPromise(PLUGIN, lazy(() => import('./test')));
    tasks.build.tapPromise(PLUGIN, lazy(() => import('./build')));
    tasks.lint.tapPromise(PLUGIN, lazy(() => import('./lint')));
  },
);
