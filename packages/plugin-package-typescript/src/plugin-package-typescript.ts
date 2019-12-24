import {relative} from 'path';

import {copy, remove} from 'fs-extra';

import {Package, createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  EntryStrategy,
  writeTypeScriptEntries,
} from '@sewing-kit/plugin-typescript';

const PLUGIN = 'SewingKit.PackageTypeScript';

export interface Options {
  readonly typesAtRoot?: boolean;
}

export function buildTypeScriptDefinitions({
  typesAtRoot = false,
}: Options = {}) {
  return createProjectBuildPlugin<Package>(
    PLUGIN,
    ({hooks, project, workspace, api}) => {
      // We don’t build TypeScript definitions for projects that also include
      // web apps/ services.
      if (workspace.private) {
        return;
      }

      hooks.steps.hook((steps) => [
        ...steps,
        api.createStep({label: 'Writing type definitions'}, async () => {
          await Promise.all(
            project.entries.map((entry) =>
              remove(project.fs.resolvePath(`${entry.name || 'index'}.d.ts`)),
            ),
          );

          if (typesAtRoot) {
            const outputPath = await getOutputPath(project);
            const files = await project.fs.glob(
              project.fs.resolvePath(outputPath, '**/*.d.ts'),
            );

            await Promise.all(
              files.map((file) =>
                copy(file, project.fs.resolvePath(relative(outputPath, file))),
              ),
            );
          } else {
            writeTypeScriptEntries(project, {strategy: EntryStrategy.ReExport});
          }
        }),
      ]);
    },
  );
}

async function getOutputPath(pkg: Package) {
  if (await pkg.fs.hasFile('tsconfig.json')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tsconfig = require(pkg.fs.resolvePath('tsconfig.json'));
      const relativePath =
        (tsconfig.compilerOptions && tsconfig.compilerOptions.outDir) ||
        'build/ts';

      return pkg.fs.resolvePath(relativePath);
    } catch {
      // Fall through to the default below
    }
  }

  return pkg.fs.resolvePath('build/ts');
}
