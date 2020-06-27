import {join, resolve, relative} from 'path';
import {copy, utimes, symlink} from 'fs-extra';

import {
  Env,
  Package,
  Workspace,
  WaterfallHook,
  DiagnosticError,
  createProjectPlugin,
  createWorkspacePlugin,
  WorkspacePluginContext,
} from '@sewing-kit/plugins';
import {createJavaScriptWebpackRuleSet} from '@sewing-kit/plugin-javascript';

import {addTypeScriptBabelConfig} from './utilities';

import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-eslint';
import {} from '@sewing-kit/plugin-webpack';

interface TypeScriptTypeCheckingHooks {
  readonly typescriptHeap: WaterfallHook<number>;
}

declare module '@sewing-kit/hooks' {
  interface TypeCheckWorkspaceConfigurationCustomHooks
    extends TypeScriptTypeCheckingHooks {}
  interface BuildWorkspaceConfigurationCustomHooks
    extends TypeScriptTypeCheckingHooks {}
}

const PLUGIN = 'SewingKit.TypeScript';

export function typescript() {
  return createProjectPlugin(
    PLUGIN,
    ({api, project, tasks: {dev, build, test}}) => {
      test.hook(({hooks}) => {
        hooks.configure.hook((hooks) => {
          hooks.jestExtensions?.hook(addTypeScriptExtensions);
          hooks.jestTransforms?.hook((transforms, {babelTransform}) => ({
            ...transforms,
            ['^.+\\.tsx?$']: babelTransform,
          }));

          hooks.babelConfig?.hook(addTypeScriptBabelConfig);
        });
      });

      build.hook(({hooks, options}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook((configure) => {
            configure.babelConfig?.hook(addTypeScriptBabelConfig);
            configure.babelExtensions?.hook(addTypeScriptExtensions);
            configure.webpackExtensions?.hook(addTypeScriptExtensions);
            configure.webpackPlugins?.hook(addWebpackPlugins);
            configure.webpackRules?.hook(async (rules) => [
              ...rules,
              {
                test: /\.tsx?/,
                exclude: /node_modules/,
                use: await createJavaScriptWebpackRuleSet({
                  api,
                  project,
                  env: options.simulateEnv,
                  configuration: configure,
                  cacheDirectory: 'ts',
                  cacheDependencies: [],
                }),
              },
            ]);
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.babelConfig?.hook(addTypeScriptBabelConfig);
          configure.webpackExtensions?.hook(addTypeScriptExtensions);
          configure.webpackPlugins?.hook(addWebpackPlugins);
          configure.webpackRules?.hook(async (rules) => [
            ...rules,
            {
              test: /\.tsx?/,
              exclude: /node_modules/,
              use: await createJavaScriptWebpackRuleSet({
                api,
                project,
                env: Env.Development,
                configuration: configure,
                cacheDirectory: 'ts',
                cacheDependencies: [],
              }),
            },
          ]);
        });
      });
    },
  );
}

export function workspaceTypeScript() {
  return createWorkspacePlugin(PLUGIN, (context) => {
    const {
      workspace,
      tasks: {build, lint, typeCheck},
    } = context;

    lint.hook(({hooks}) => {
      hooks.configure.hook((configure) => {
        configure.eslintExtensions?.hook(addTypeScriptExtensions);
      });
    });

    build.hook(({hooks, options}) => {
      hooks.configureHooks.hook((hooks: any) => ({
        ...hooks,
        typescriptHeap: new WaterfallHook(),
      }));

      if (workspace.private) {
        return;
      }

      hooks.pre.hook((steps, {configuration}) => {
        const newSteps = [...steps];

        newSteps.push(createWriteFallbackEntriesStep(context));

        if (options.cache) {
          newSteps.push(createLoadTypeScriptCacheStep(context));
        }

        newSteps.push(createRunTypeScriptStep(context, configuration));

        return newSteps;
      });

      if (options.cache) {
        hooks.post.hook((steps) => [...steps, createCacheSaveStep(context)]);
      }
    });

    typeCheck.hook(({hooks, options}) => {
      hooks.configureHooks.hook((hooks) => ({
        ...hooks,
        typescriptHeap: new WaterfallHook(),
      }));

      hooks.pre.hook((steps) => {
        const newSteps = [...steps];

        newSteps.push(createWriteFallbackEntriesStep(context));

        if (options.cache) {
          newSteps.push(createLoadTypeScriptCacheStep(context));
        }

        return newSteps;
      });

      hooks.steps.hook((steps, {configuration}) => [
        ...steps,
        createRunTypeScriptStep(context, configuration),
      ]);

      if (options.cache) {
        hooks.post.hook((steps) => [...steps, createCacheSaveStep(context)]);
      }
    });
  });
}

const OUTPUT_DIRECTORY_NAME = 'output';
const BUILD_DIRECTORY_CACHE_FILENAME = 'info';
const TSBUILDINFO_FILE = 'tsconfig.tsbuildinfo';

function createCacheSaveStep({workspace, api}: WorkspacePluginContext) {
  return api.createStep(
    {
      id: 'TypeScript.SaveCache',
      label: 'save typescript cache',
    },
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

function createWriteFallbackEntriesStep({
  api,
  workspace,
}: WorkspacePluginContext) {
  return api.createStep(
    {
      id: 'TypeScript.WriteEntries',
      label: 'write typescript entries',
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

function createLoadTypeScriptCacheStep({
  workspace,
  api,
}: WorkspacePluginContext) {
  return api.createStep(
    {
      id: 'TypeScript.RestoreCache',
      label: 'restore typescript cache',
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
  {api}: Pick<WorkspacePluginContext, 'api'>,
  configure: Partial<TypeScriptTypeCheckingHooks>,
) {
  return api.createStep(
    {
      id: 'TypeScript.TypeCheck',
      label: 'run typescript',
    },
    async (step) => {
      const heap = await configure.typescriptHeap!.run(0);
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

export enum EntryStrategy {
  Symlink,
  ReExport,
}

export async function writeTypeScriptEntries(
  pkg: Package,
  {strategy}: {strategy: EntryStrategy},
) {
  const outputPath = await getOutputPath(pkg);

  const sourceRoot = pkg.fs.resolvePath('src');

  for (const entry of pkg.entries) {
    const absoluteEntryPath = (await pkg.fs.hasDirectory(entry.root))
      ? pkg.fs.resolvePath(entry.root, 'index')
      : pkg.fs.resolvePath(entry.root);
    const relativeFromSourceRoot = relative(sourceRoot, absoluteEntryPath);
    const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
    const relativeFromRoot = normalizedRelative(pkg.root, destinationInOutput);

    if (strategy === EntryStrategy.ReExport) {
      let hasDefault = true;
      let content = '';

      try {
        content = await pkg.fs.read(
          (await pkg.fs.glob(`${absoluteEntryPath}.*`))[0],
        );

        // export default ...
        // export {Foo as default} from ...
        // export {default} from ...
        hasDefault =
          /(?:export|as) default\b/.test(content) || /{default}/.test(content);
      } catch {
        // intentional no-op
        content = '';
      }

      await pkg.fs.write(
        `${entry.name || 'index'}.d.ts`,
        [
          `export * from ${JSON.stringify(relativeFromRoot)};`,
          hasDefault
            ? `export {default} from ${JSON.stringify(relativeFromRoot)};`
            : false,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    } else {
      const symlinkFile = `${relativeFromRoot}.d.ts`;
      if (!(await pkg.fs.hasFile(symlinkFile))) {
        await pkg.fs.write(symlinkFile, '');
        await utimes(
          pkg.fs.resolvePath(symlinkFile),
          201001010000,
          201001010000,
        );
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

function addTypeScriptExtensions(extensions: readonly string[]) {
  return ['.ts', '.tsx', ...extensions];
}

async function addWebpackPlugins(plugins: readonly import('webpack').Plugin[]) {
  const [
    {IgnoreMissingTypeExportWarningsPlugin},
    {WatchIgnorePlugin},
  ] = await Promise.all([
    import('./webpack-parts'),
    import('webpack'),
  ] as const);

  return [
    ...plugins,
    new IgnoreMissingTypeExportWarningsPlugin(),
    new WatchIgnorePlugin([/\.d\.ts$/]),
  ];
}
