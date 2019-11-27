import {join} from 'path';
import {TestTask, Package} from '@sewing-kit/core';
import {} from '@sewing-kit/plugin-jest';
import {PLUGIN} from './common';

export default function testPackages({hooks, workspace}: TestTask) {
  hooks.configure.tap(PLUGIN, (hooks) => {
    if (hooks.jestWatchIgnore) {
      hooks.jestWatchIgnore.tap(PLUGIN, (watchIgnore) => [
        ...watchIgnore,
        workspace.fs.resolvePath('packages/.*/build'),
      ]);
    }
  });

  hooks.project.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      if (hooks.jestModuleMapper) {
        hooks.jestModuleMapper.tap(PLUGIN, (moduleMap) => {
          return workspace.packages.reduce(
            (all, pkg) => ({
              ...all,
              ...packageEntryMatcherMap(pkg),
            }),
            moduleMap,
          );
        });
      }
    });
  });
}

function packageEntryMatcherMap({runtimeName, entries, fs}: Package) {
  const map: Record<string, string> = Object.create(null);

  for (const {name, root} of entries) {
    map[
      name ? join(runtimeName, `${name}$`) : `${runtimeName}$`
    ] = fs.resolvePath(root);
  }

  return map;
}
