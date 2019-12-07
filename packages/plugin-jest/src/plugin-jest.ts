import {join} from 'path';
import {AsyncSeriesWaterfallHook} from 'tapable';

import {Project, Package} from '@sewing-kit/model';
import {createStep} from '@sewing-kit/ui';
import {
  createWorkspaceTestPlugin,
  createProjectPlugin,
  toArgs,
  addHooks,
  MissingPluginError,
} from '@sewing-kit/plugins';

// Brings in the Babel hook augmentations
import {} from '@sewing-kit/plugin-babel';
import {} from 'jest';

const PLUGIN = 'SewingKit.jest';

type DeepReadonly<T> = Readonly<
  {
    [K in keyof T]: T[K] extends (infer U)[] | infer Rest
      ? readonly U[] | Rest
      : T[K];
  }
>;

type JestConfig = DeepReadonly<jest.InitialOptions>;

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks {
    readonly jestExtensions: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestEnvironment: AsyncSeriesWaterfallHook<string>;
    readonly jestModuleMapper: AsyncSeriesWaterfallHook<{
      [key: string]: string;
    }>;
    readonly jestSetupEnv: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestSetupTests: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestTransforms: AsyncSeriesWaterfallHook<
      {[key: string]: string},
      {readonly babelTransform: string}
    >;
    readonly jestTestMatch: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestConfig: AsyncSeriesWaterfallHook<JestConfig>;
  }

  interface TestWorkspaceConfigurationCustomHooks {
    readonly jestSetupEnv: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestSetupTests: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestWatchIgnore: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestConfig: AsyncSeriesWaterfallHook<JestConfig>;
    readonly jestWatchPlugins: AsyncSeriesWaterfallHook<readonly string[]>;
    readonly jestFlags: AsyncSeriesWaterfallHook<JestFlags>;
  }

  interface TestProjectCustomWorkspaceContext {
    readonly jestProjectConfigurations: Map<
      Project,
      TestProjectConfigurationHooks
    >;
  }
}

const addProjectConfigurationHooks = addHooks<
  import('@sewing-kit/hooks').TestProjectConfigurationHooks
>(() => ({
  jestExtensions: new AsyncSeriesWaterfallHook(['extensions']),
  jestEnvironment: new AsyncSeriesWaterfallHook(['environment']),
  jestModuleMapper: new AsyncSeriesWaterfallHook(['moduleMapper']),
  jestSetupEnv: new AsyncSeriesWaterfallHook(['setupEnvFiles']),
  jestSetupTests: new AsyncSeriesWaterfallHook(['setupTestFiles']),
  jestTransforms: new AsyncSeriesWaterfallHook([
    'transform',
    'transformOptions',
  ]),
  jestTestMatch: new AsyncSeriesWaterfallHook(['testMatches']),
  jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
}));

const addWorkspaceConfigurationHooks = addHooks<
  import('@sewing-kit/hooks').TestWorkspaceConfigurationHooks
>(() => ({
  jestSetupEnv: new AsyncSeriesWaterfallHook(['setupEnvFiles']),
  jestSetupTests: new AsyncSeriesWaterfallHook(['setupTestFiles']),
  jestWatchIgnore: new AsyncSeriesWaterfallHook(['watchIgnore']),
  jestWatchPlugins: new AsyncSeriesWaterfallHook(['jestWatchPlugins']),
  jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
  jestFlags: new AsyncSeriesWaterfallHook(['jestFlags']),
}));

interface JestFlags {
  ci?: boolean;
  config?: string;
  watch?: boolean;
  watchAll?: boolean;
  testNamePattern?: string;
  testPathPattern?: string;
  runInBand?: boolean;
  forceExit?: boolean;
  maxWorkers?: number;
  onlyChanged?: boolean;
  coverage?: boolean;
  updateSnapshot?: boolean;
  cacheDirectory?: string;
}

export const jestWorkspacePlugin = createWorkspaceTestPlugin(
  PLUGIN,
  ({workspace, hooks, options}, api) => {
    const projectConfigurations = new Map<
      Project,
      import('@sewing-kit/hooks').TestProjectConfigurationHooks
    >();
    const rootConfigPath = api.configPath('jest/root.config.js');

    hooks.configure.tap(PLUGIN, (hooks) => {
      addWorkspaceConfigurationHooks(hooks);

      hooks.jestWatchIgnore!.tap(PLUGIN, (watchIgnore) => [
        ...watchIgnore,
        '/tmp/',
        api.resolvePath(),
        workspace.fs.buildPath(),
        ...workspace.projects.map((project) => project.fs.buildPath()),
      ]);

      hooks.jestWatchPlugins!.tap(PLUGIN, (watchPlugins) => [
        ...watchPlugins,
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname',
      ]);

      hooks.jestSetupEnv!.tapPromise(PLUGIN, async (setupEnvFiles) => {
        const packageSetupEnvFiles = ([] as string[]).concat(
          ...(await Promise.all([
            workspace.fs.glob('tests/setup/environment.*'),
            workspace.fs.glob('tests/setup/environment/index.*'),
          ])),
        );

        return [...setupEnvFiles, ...packageSetupEnvFiles];
      });

      hooks.jestSetupTests!.tapPromise(PLUGIN, async (setupTestsFiles) => {
        const packageSetupTestsFiles = ([] as string[]).concat(
          ...(await Promise.all([
            workspace.fs.glob('tests/setup/tests.*'),
            workspace.fs.glob('tests/setup/tests/index.*'),
          ])),
        );

        return [...setupTestsFiles, ...packageSetupTestsFiles];
      });
    });

    hooks.context.tap(PLUGIN, (context) => ({
      ...context,
      jestProjectConfigurations: projectConfigurations,
    }));

    hooks.pre.tap(PLUGIN, (steps, {configuration}) => [
      ...steps,
      createStep({label: 'Writing Jest configuration files'}, async () => {
        const [rootSetupEnvFiles, rootSetupTestsFiles] = await Promise.all([
          configuration.jestSetupEnv!.promise([]),
          configuration.jestSetupTests!.promise([]),
        ]);

        const projects = await Promise.all(
          [...projectConfigurations.entries()].map(async ([project, hooks]) => {
            if (hooks.babelConfig == null) {
              throw new MissingPluginError('@sewing-kit/plugin-babel');
            }

            const babelTransform = api.configPath(
              'jest/packages',
              project.name,
              'babel-transformer.js',
            );

            const babelConfig = await hooks.babelConfig.promise({});
            const transform = await hooks.jestTransforms!.promise(
              {},
              {babelTransform},
            );
            const environment = await hooks.jestEnvironment!.promise('node');
            const extensions = (
              await hooks.jestExtensions!.promise([])
            ).map((extension) => extension.replace('.', ''));
            const moduleMapper = await hooks.jestModuleMapper!.promise({});
            const setupEnvFiles = await hooks.jestSetupEnv!.promise(
              rootSetupEnvFiles,
            );
            const setupTestsFiles = await hooks.jestSetupTests!.promise(
              rootSetupTestsFiles,
            );

            await api.write(
              babelTransform,
              `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
                babelConfig,
              )})`,
            );

            const config = await hooks.jestConfig!.promise({
              displayName: project.name,
              rootDir: project.root,
              testRegex: `.*\\.test\\.(${extensions.join('|')})$`,
              moduleFileExtensions: extensions,
              testEnvironment: environment,
              moduleNameMapper: moduleMapper,
              setupFiles: setupEnvFiles,
              setupFilesAfterEnv: setupTestsFiles,
              transform,
            });

            return config;
          }),
        );

        const watchPlugins = await configuration.jestWatchPlugins!.promise([]);
        const watchIgnorePatterns = await configuration.jestWatchIgnore!.promise(
          [],
        );

        const rootConfig = await configuration.jestConfig!.promise({
          rootDir: workspace.root,
          projects: projects as any,
          watchPlugins,
          watchPathIgnorePatterns: watchIgnorePatterns,
        });

        await api.write(
          rootConfigPath,
          `module.exports = ${JSON.stringify(rootConfig)};`,
        );
      }),
    ]);

    hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
      ...steps,
      createStep({label: 'Running Jest', indefinite: true}, async () => {
        process.env.BABEL_ENV = 'test';
        process.env.NODE_ENV = 'test';

        const truthyEnvValues = new Set(['true', '1']);
        const isCi = [process.env.CI, process.env.GITHUB_ACTIONS].some(
          (envVar) => Boolean(envVar) && truthyEnvValues.has(envVar!),
        );

        const {
          coverage = false,
          debug = false,
          watch = !isCi,
          testPattern,
          testNamePattern,
          updateSnapshot,
        } = options;

        const flags = await configuration.jestFlags!.promise({
          ci: isCi ? isCi : undefined,
          config: rootConfigPath,
          coverage,
          watch: watch && testPattern == null,
          watchAll: watch && testPattern != null,
          onlyChanged: !isCi && testPattern == null,
          testNamePattern,
          testPathPattern: testPattern,
          updateSnapshot,
          runInBand: debug,
          forceExit: debug,
          cacheDirectory: api.cachePath('jest'),
        });

        const jest = await import('jest');
        jest.default.run(toArgs(flags));
      }),
    ]);
  },
);

export const jestProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test}) {
    build.tap(PLUGIN, ({hooks}) => {
      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelIgnorePatterns?.tap(PLUGIN, (patterns) => [
            ...patterns,
            '**/test/',
            '**/tests/',
          ]);
        });
      });
    });

    test.tap(PLUGIN, ({hooks, workspace, context}) => {
      hooks.project.tap(PLUGIN, ({project, hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          addProjectConfigurationHooks(hooks);

          context.jestProjectConfigurations!.set(project, hooks);

          hooks.jestSetupEnv!.tapPromise(PLUGIN, async (setupEnvFiles) => {
            const packageSetupEnvFiles = ([] as string[]).concat(
              ...(await Promise.all([
                project.fs.glob('tests/setup/environment.*'),
                project.fs.glob('tests/setup/environment/index.*'),
              ])),
            );

            return [...setupEnvFiles, ...packageSetupEnvFiles];
          });

          hooks.jestSetupTests!.tapPromise(PLUGIN, async (setupTestsFiles) => {
            const packageSetupTestsFiles = ([] as string[]).concat(
              ...(await Promise.all([
                project.fs.glob('tests/setup/tests.*'),
                project.fs.glob('tests/setup/tests/index.*'),
              ])),
            );

            return [...setupTestsFiles, ...packageSetupTestsFiles];
          });

          hooks.jestModuleMapper!.tap(PLUGIN, (moduleMap) => {
            return workspace.packages.reduce(
              (all, pkg) => ({
                ...all,
                ...packageEntryMatcherMap(pkg),
              }),
              moduleMap,
            );
          });
        });
      });
    });
  },
});

function packageEntryMatcherMap({runtimeName, entries, fs}: Package) {
  const map: Record<string, string> = Object.create(null);

  for (const {name, root} of entries) {
    map[
      name ? join(runtimeName, `${name}$`) : `${runtimeName}$`
    ] = fs.resolvePath(root);
  }

  return map;
}
