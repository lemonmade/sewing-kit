import {join, resolve, relative} from 'path';

import {symlink, utimes} from 'fs-extra';
import {AsyncSeriesWaterfallHook} from 'tapable';

import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {addHooks, compose} from '@sewing-kit/plugin-utilities';
import {Package} from '@sewing-kit/core';

import {PLUGIN} from './common';

declare module '@sewing-kit/types' {
  interface TypeCheckRootConfigurationCustomHooks {
    typescriptHeap: AsyncSeriesWaterfallHook<number>;
  }
}

export default function typeCheckTypeScript({
  hooks,
  options,
  workspace,
}: import('@sewing-kit/core').TypeCheckTask) {
  const cacheDirectory = workspace.internal.cachePath('typescript');
  const outputDirectoryName = 'output';
  const buildDirectoryCacheFilename = 'info';
  const tsbuildinfoFile = 'tsconfig.tsbuildinfo';

  hooks.configure.tap(
    PLUGIN,
    compose(
      addHooks(() => ({
        typescriptHeap: new AsyncSeriesWaterfallHook(['heap']),
      })),
    ),
  );

  hooks.pre.tap(PLUGIN, (steps) => {
    const newSteps = [...steps];

    if (!workspace.private) {
      newSteps.push(
        createStep(
          {
            label: 'Writing TypeScript entries',
            skip: /(ts|typescript)-entr(y|ies)/i,
          },
          async () => {
            await Promise.all(
              workspace.packages.map((pkg) => writeTypeScriptEntries(pkg)),
            );
          },
        ),
      );
    }

    if (options.cache) {
      newSteps.push(
        createStep(
          {label: 'Restoring TypeScript cache', skip: /(ts|typescript)-cache/i},
          async () => {
            try {
              const projectCacheDirectories = await workspace.fs.glob(
                join(cacheDirectory, '*/'),
              );

              await Promise.all(
                projectCacheDirectories.map(async (projectCacheDirectory) => {
                  const outDirectory = await workspace.fs.read(
                    join(projectCacheDirectory, buildDirectoryCacheFilename),
                  );

                  await workspace.fs.copy(
                    join(projectCacheDirectory, tsbuildinfoFile),
                    resolve(outDirectory, `../${tsbuildinfoFile}`),
                    {preserveTimestamps: true},
                  );

                  await workspace.fs.copy(
                    join(projectCacheDirectory, outputDirectoryName),
                    outDirectory,
                    {preserveTimestamps: true},
                  );
                }),
              );
            } catch {
              // noop
            }
          },
        ),
      );
    }

    return newSteps;
  });

  hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
    ...steps,
    createStep(
      {label: 'Type checking with TypeScript', skip: /(ts|typescript)/i},
      async (step) => {
        const heap = await configuration.typescriptHeap!.promise(0);
        const heapArguments = heap ? [`--max-old-space-size=${heap}`] : [];

        try {
          await step.exec(
            'node',
            [...heapArguments, 'node_modules/.bin/tsc', '--build', '--pretty'],
            {all: true, env: {FORCE_COLOR: '1'}},
          );
        } catch (error) {
          throw new DiagnosticError({
            title: 'TypeScript found type errors',
            content: error.all,
          });
        }
      },
    ),
  ]);

  if (options.cache) {
    hooks.post.tap(PLUGIN, (steps) => [
      ...steps,
      createStep(
        {label: 'Saving TypeScript cache', skip: /(ts|typescript)-cache/i},
        async () => {
          try {
            const {references = []} = JSON.parse(
              await workspace.fs.read('tsconfig.json'),
            ) as {references?: {path: string}[]};

            await Promise.all(
              references.map(async ({path: reference}) => {
                const outDirectory = await getTscOutputDirectory(reference);
                const projectCacheDirectory = join(
                  cacheDirectory,
                  reference.replace(/^\.*\/?/, '').replace(/\//g, '_'),
                );
                const cacheOutputDirectory = join(
                  projectCacheDirectory,
                  outputDirectoryName,
                );

                await workspace.fs.write(
                  join(projectCacheDirectory, tsbuildinfoFile),
                  await workspace.fs.read(
                    resolve(outDirectory, `../${tsbuildinfoFile}`),
                  ),
                );

                await workspace.fs.write(
                  join(projectCacheDirectory, buildDirectoryCacheFilename),
                  outDirectory,
                );

                await workspace.fs.copy(
                  workspace.fs.resolvePath(reference, outDirectory),
                  cacheOutputDirectory,
                  {preserveTimestamps: true},
                );
              }),
            );
          } catch {
            // noop
          }
        },
      ),
    ]);
  }

  async function getTscOutputDirectory(project: string) {
    const tsconfig = JSON.parse(
      await workspace.fs.read(
        workspace.fs.resolvePath(project, 'tsconfig.json'),
      ),
    ) as {compilerOptions?: {outDir?: string}};

    return workspace.fs.resolvePath(
      project,
      tsconfig.compilerOptions?.outDir ?? 'build/ts',
    );
  }
}

async function writeTypeScriptEntries(pkg: Package) {
  const outputPath = await getOutputPath(pkg);

  const sourceRoot = pkg.fs.resolvePath('src');

  for (const entry of pkg.entries) {
    const absoluteEntryPath = (await pkg.fs.hasDirectory(entry.root))
      ? pkg.fs.resolvePath(entry.root, 'index')
      : pkg.fs.resolvePath(entry.root);
    const relativeFromSourceRoot = relative(sourceRoot, absoluteEntryPath);
    const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
    const relativeFromRoot = normalizedRelative(pkg.root, destinationInOutput);

    const symlinkFile = `${relativeFromRoot}.d.ts`;
    if (!(await pkg.fs.hasFile(symlinkFile))) {
      await pkg.fs.write(symlinkFile, '');
      await utimes(pkg.fs.resolvePath(symlinkFile), 201001010000, 201001010000);
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

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
