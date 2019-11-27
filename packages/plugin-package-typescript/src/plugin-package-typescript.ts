import {resolve, relative} from 'path';
import {copy, symlink, remove} from 'fs-extra';
import {Package} from '@sewing-kit/core';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {} from '@sewing-kit/plugin-package-base';

const PLUGIN = 'SewingKit.package-esnext';
const VARIANT = 'esnext';

declare module '@sewing-kit/types' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }

  interface PackageEntryCustomOptions {
    readonly typesAtRoot: boolean;
  }
}

enum EntryStrategy {
  Symlink,
  ReExport,
}

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.build.tap(PLUGIN, ({workspace, hooks}) => {
      hooks.configure.tap(PLUGIN, (hooks) => {
        if (hooks.packageBuildArtifacts) {
          hooks.packageBuildArtifacts.tapPromise(PLUGIN, async (artifacts) => [
            ...artifacts,
            ...(await Promise.all(
              workspace.packages.map((pkg) => pkg.fs.glob('./*.d.ts')),
            )).flat(),
          ]);
        }
      });

      // We don’t build TypeScript definitions for projects that also include
      // web apps/ services.
      if (workspace.private) {
        return;
      }

      hooks.package.tap(PLUGIN, ({pkg, hooks}) => {
        hooks.steps.tap(PLUGIN, (steps) => [
          ...steps,
          createStep({label: 'Writing type definitions'}, async () => {
            await Promise.all(
              pkg.entries.map((entry) =>
                remove(pkg.fs.resolvePath(`${entry.name || 'index'}.d.ts`)),
              ),
            );

            if (
              pkg.entries.some(
                (entry) => entry.options && entry.options.typesAtRoot,
              )
            ) {
              const outputPath = await getOutputPath(pkg);
              const files = await pkg.fs.glob(
                pkg.fs.resolvePath(outputPath, '**/*.d.ts'),
              );

              await Promise.all(
                files.map((file) =>
                  copy(file, pkg.fs.resolvePath(relative(outputPath, file))),
                ),
              );
            } else {
              writeTypeScriptEntries(pkg, {strategy: EntryStrategy.ReExport});
            }
          }),
        ]);
      });

      hooks.pre.tap(PLUGIN, (steps) => [
        ...steps,
        createStep(
          {label: 'Compiling TypeScript definitions'},
          async (step) => {
            try {
              await Promise.all(
                workspace.packages.map((pkg) =>
                  writeTypeScriptEntries(pkg, {
                    strategy: EntryStrategy.Symlink,
                  }),
                ),
              );
              await step.exec(
                'node_modules/.bin/tsc',
                ['--build', '--pretty'],
                {
                  env: {FORCE_COLOR: '1'},
                },
              );
            } catch (error) {
              throw new DiagnosticError({
                title: 'TypeScript found type errors',
                content: error.all.trim(),
              });
            }
          },
        ),
      ]);
    });
  },
);

async function writeTypeScriptEntries(
  pkg: Package,
  {strategy}: {strategy: EntryStrategy},
) {
  const outputPath = await getOutputPath(pkg);

  const sourceRoot = pkg.fs.resolvePath('src');

  for (const entry of pkg.entries) {
    const relativeFromSourceRoot = (await pkg.fs.hasDirectory(entry.root))
      ? relative(sourceRoot, pkg.fs.resolvePath(entry.root, 'index'))
      : relative(sourceRoot, pkg.fs.resolvePath(entry.root));
    const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
    const relativeFromRoot = normalizedRelative(pkg.root, destinationInOutput);

    if (strategy === EntryStrategy.ReExport) {
      await pkg.fs.write(
        `${entry.name || 'index'}.d.ts`,
        `export * from ${JSON.stringify(
          relativeFromRoot,
        )};\nexport {default} from ${JSON.stringify(relativeFromRoot)};`,
      );
    } else {
      const symlinkFile = `${relativeFromRoot}.d.ts`;
      if (!(await pkg.fs.hasFile(symlinkFile))) {
        await pkg.fs.write(symlinkFile, '');
      }

      try {
        await symlink(
          symlinkFile,
          pkg.fs.resolvePath(`${entry.name || 'index'}.d.ts`),
        );
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }
}

async function getOutputPath(pkg: Package) {
  if (await pkg.fs.hasFile('tsconfig.json')) {
    try {
      // eslint-disable-next-line typescript/no-var-requires
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

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
