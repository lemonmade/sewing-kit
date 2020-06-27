import {relative, dirname} from 'path';

import {
  Package,
  Runtime,
  createProjectBuildPlugin,
  ProjectPluginContext,
} from '@sewing-kit/plugins';

const PLUGIN = 'SewingKit.PackageBinaries';

export function buildBinaries() {
  return createProjectBuildPlugin<Package>(PLUGIN, ({hooks, project, api}) => {
    hooks.steps.hook((steps) =>
      project.binaries.length > 0
        ? [...steps, createWriteBinariesStep({project, api})]
        : steps,
    );
  });
}

function createWriteBinariesStep({
  project,
  api,
}: Pick<ProjectPluginContext<Package>, 'project' | 'api'>) {
  const binaryCount = project.binaries.length;

  const allNodeEntries =
    project.runtimes?.length === 1 &&
    project.runtimes?.includes(Runtime.Node) &&
    project.entries.every(
      ({runtimes}) =>
        (runtimes?.length === 1 && runtimes?.includes(Runtime.Node)) ?? false,
    );

  const sourceRoot = project.fs.resolvePath('src');

  return api.createStep(
    {
      id: 'PackageBinaries.WriteBinaries',
      label:
        binaryCount === 1 ? 'write binary' : `write ${binaryCount} binaries`,
    },
    async (step) => {
      await Promise.all(
        project.binaries.map(async ({name, root, aliases = []}) => {
          const relativeFromSourceRoot = relative(
            sourceRoot,
            project.fs.resolvePath(root),
          );

          const destinationInOutput = project.fs.buildPath(
            allNodeEntries ? 'cjs' : 'node',
            relativeFromSourceRoot,
          );

          for (const binaryName of [name, ...aliases]) {
            const binaryFile = project.fs.resolvePath('bin', binaryName);
            const relativeFromBinary = normalizedRelative(
              dirname(binaryFile),
              destinationInOutput,
            );

            await project.fs.write(
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
