import {relative, dirname} from 'path';

import {createStep} from '@sewing-kit/ui';
import {Package, Runtime} from '@sewing-kit/model';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';

const PLUGIN = 'SewingKit.package-binaries';

export const packageCreateBinariesPlugin = createProjectBuildPlugin(
  PLUGIN,
  ({hooks}) => {
    hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
      hooks.steps.tap(PLUGIN, (steps) =>
        pkg.binaries.length > 0
          ? [...steps, createWriteBinariesStep(pkg)]
          : steps,
      );
    });
  },
);

function createWriteBinariesStep(pkg: Package) {
  const binaryCount = pkg.binaries.length;

  const allNodeEntries = pkg.entries.every(
    ({runtime}) => runtime === Runtime.Node,
  );

  const sourceRoot = pkg.fs.resolvePath('src');

  return createStep(
    {
      label: `Writing ${binaryCount} ${
        binaryCount > 1 ? 'binaries' : 'binary'
      }`,
    },
    async (step) => {
      await Promise.all(
        pkg.binaries.map(async ({name, root, aliases = []}) => {
          const relativeFromSourceRoot = relative(
            sourceRoot,
            pkg.fs.resolvePath(root),
          );

          const destinationInOutput = pkg.fs.buildPath(
            allNodeEntries ? 'cjs' : 'node',
            relativeFromSourceRoot,
          );

          for (const binaryName of [name, ...aliases]) {
            const binaryFile = pkg.fs.resolvePath('bin', binaryName);
            const relativeFromBinary = normalizedRelative(
              dirname(binaryFile),
              destinationInOutput,
            );

            await pkg.fs.write(
              binaryFile,
              `#!/usr/bin/env node\nrequire(${JSON.stringify(
                relativeFromBinary,
              )})`,
            );

            await step.exec('chmod', ['+x', binaryFile]);
          }
        }),
      );
    },
  );
}

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
