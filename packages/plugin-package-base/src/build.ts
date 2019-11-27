import {remove} from 'fs-extra';
import {AsyncSeriesWaterfallHook} from 'tapable';
import {BuildTask} from '@sewing-kit/core';
import {createStep} from '@sewing-kit/ui';
import {addHooks} from '@sewing-kit/plugin-utilities';

import './types';
import {PLUGIN} from './common';

export default function buildPackages({hooks, workspace}: BuildTask) {
  hooks.configure.tap(
    PLUGIN,
    addHooks(() => ({
      packageBuildArtifacts: new AsyncSeriesWaterfallHook(['artifacts']),
    })),
  );

  hooks.pre.tap(PLUGIN, (steps, {configuration}) =>
    workspace.packages.length > 0
      ? [
          ...steps,
          createStep(
            {label: 'Removing package build artifacts', skip: /clean/},
            async () => {
              await Promise.all(
                (await configuration.packageBuildArtifacts!.promise([])).map(
                  (path) => remove(path),
                ),
              );
            },
          ),
        ]
      : steps,
  );
}
