import {join, resolve} from 'path';

import {copy} from 'fs-extra';
import {AsyncSeriesWaterfallHook} from 'tapable';

import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {addHooks, PluginApi} from '@sewing-kit/plugins';
import {Workspace} from '@sewing-kit/model';

import {PLUGIN} from './common';
import {writeTypeScriptEntries, EntryStrategy} from './utilities';

interface TypeScriptTypeCheckingHooks {
  readonly typescriptHeap: AsyncSeriesWaterfallHook<number>;
}

declare module '@sewing-kit/hooks' {
  interface TypeCheckWorkspaceConfigurationCustomHooks
    extends TypeScriptTypeCheckingHooks {}
  interface BuildWorkspaceConfigurationCustomHooks
    extends TypeScriptTypeCheckingHooks {}
}

const addTsHooks = addHooks<
  Pick<
    import('@sewing-kit/hooks').TypeCheckWorkspaceConfigurationHooks,
    'typescriptHeap'
  >
>(() => ({
  typescriptHeap: new AsyncSeriesWaterfallHook(['heap']),
}));

export function buildWorkspaceThroughTypeCheck(
  {hooks, options, workspace}: import('@sewing-kit/tasks').BuildWorkspaceTask,
  api: PluginApi,
) {
  hooks.configure.tap(PLUGIN, addTsHooks);

  if (workspace.private) {
    return;
  }

  hooks.pre.tap(PLUGIN, (steps, {configuration}) => {
    const newSteps = [...steps];

    newSteps.push(createWriteFallbackEntriesStep(workspace));

    if (options.cache) {
      newSteps.push(createLoadTypeScriptCacheStep(workspace, api));
    }

    newSteps.push(createRunTypeScriptStep(configuration));

    return newSteps;
  });

  if (options.cache) {
    hooks.post.tap(PLUGIN, (steps) => [
      ...steps,
      createCacheSaveStep(workspace, api),
    ]);
  }
}

export function typeCheckTypeScript(
  {
    hooks,
    options,
    workspace,
  }: import('@sewing-kit/tasks').TypeCheckWorkspaceTask,
  api: PluginApi,
) {
  hooks.configure.tap(PLUGIN, addTsHooks);

  hooks.pre.tap(PLUGIN, (steps) => {
    const newSteps = [...steps];

    newSteps.push(createWriteFallbackEntriesStep(workspace));

    if (options.cache) {
      newSteps.push(createLoadTypeScriptCacheStep(workspace, api));
    }

    return newSteps;
  });

  hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
    ...steps,
    createRunTypeScriptStep(configuration),
  ]);

  if (options.cache) {
    hooks.post.tap(PLUGIN, (steps) => [
      ...steps,
      createCacheSaveStep(workspace, api),
    ]);
  }
}

const OUTPUT_DIRECTORY_NAME = 'output';
const BUILD_DIRECTORY_CACHE_FILENAME = 'info';
const TSBUILDINFO_FILE = 'tsconfig.tsbuildinfo';

function createCacheSaveStep(workspace: Workspace, api: PluginApi) {
  return createStep(
    {label: 'Saving TypeScript cache', skip: /(ts|typescript)[-_]?cache/i},
    async () => {
      try {
        const {references = []} = JSON.parse(
          await workspace.fs.read('tsconfig.json'),
        ) as {references?: {path: string}[]};

        await Promise.all(
          references.map(async ({path: reference}) => {
            const outDirectory = await getTscOutputDirectory(
              reference,
              workspace,
            );
            const projectCacheDirectory = join(
              api.cachePath('typescript'),
              reference.replace(/^\.*\/?/, '').replace(/\//g, '_'),
            );
            const cacheOutputDirectory = join(
              projectCacheDirectory,
              OUTPUT_DIRECTORY_NAME,
            );

            await workspace.fs.write(
              join(projectCacheDirectory, TSBUILDINFO_FILE),
              await workspace.fs.read(
                resolve(outDirectory, `../${TSBUILDINFO_FILE}`),
              ),
            );

            await workspace.fs.write(
              join(projectCacheDirectory, BUILD_DIRECTORY_CACHE_FILENAME),
              outDirectory,
            );

            await copy(
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
  );
}

async function getTscOutputDirectory(project: string, workspace: Workspace) {
  const tsconfig = JSON.parse(
    await workspace.fs.read(workspace.fs.resolvePath(project, 'tsconfig.json')),
  ) as {compilerOptions?: {outDir?: string}};

  return workspace.fs.resolvePath(
    project,
    tsconfig.compilerOptions?.outDir ?? 'build/ts',
  );
}

function createWriteFallbackEntriesStep(workspace: Workspace) {
  return createStep(
    {
      label: 'Writing TypeScript entries',
      skip: /(ts|typescript)[-_]?entr(y|ies)/i,
    },
    async () => {
      await Promise.all(
        workspace.packages.map((pkg) =>
          writeTypeScriptEntries(pkg, {strategy: EntryStrategy.Symlink}),
        ),
      );
    },
  );
}

function createLoadTypeScriptCacheStep(workspace: Workspace, api: PluginApi) {
  return createStep(
    {
      label: 'Restoring TypeScript cache',
      skip: /(ts|typescript)[-_]?cache/i,
    },
    async () => {
      try {
        const projectCacheDirectories = await workspace.fs.glob(
          join(api.cachePath('typescript'), '*/'),
        );

        await Promise.all(
          projectCacheDirectories.map(async (projectCacheDirectory) => {
            const outDirectory = await workspace.fs.read(
              join(projectCacheDirectory, BUILD_DIRECTORY_CACHE_FILENAME),
            );

            await copy(
              join(projectCacheDirectory, TSBUILDINFO_FILE),
              resolve(outDirectory, `../${TSBUILDINFO_FILE}`),
              {preserveTimestamps: true},
            );

            await copy(
              join(projectCacheDirectory, OUTPUT_DIRECTORY_NAME),
              outDirectory,
              {preserveTimestamps: true},
            );
          }),
        );
      } catch {
        // noop
      }
    },
  );
}

export function createRunTypeScriptStep(
  configuration: Partial<TypeScriptTypeCheckingHooks>,
) {
  return createStep(
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
  );
}
