import {join, resolve} from 'path';

import {AsyncSeriesWaterfallHook} from 'tapable';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {addHooks, compose} from '@sewing-kit/plugin-utilities';

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

  if (options.cache) {
    hooks.pre.tap(PLUGIN, (steps) => [
      ...steps,
      createStep({label: 'Restoring TypeScript cache'}, async () => {
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
              );

              await workspace.fs.copy(
                join(projectCacheDirectory, outputDirectoryName),
                outDirectory,
              );
            }),
          );
        } catch {
          // noop
        }
      }),
    ]);
  }

  hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
    ...steps,
    createStep({label: 'Type checking with TypeScript'}, async (step) => {
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
    }),
  ]);

  if (options.cache) {
    hooks.post.tap(PLUGIN, (steps) => [
      ...steps,
      createStep({label: 'Saving TypeScript cache'}, async () => {
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
              );
            }),
          );
        } catch {
          // noop
        }
      }),
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
