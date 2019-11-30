import {AsyncSeriesWaterfallHook} from 'tapable';
import {Project} from '@sewing-kit/core';
import {createStep} from '@sewing-kit/ui';
import {
  createPlugin,
  PluginTarget,
  MissingPluginError,
  addHooks,
  compose,
  toArgs,
} from '@sewing-kit/plugin-utilities';

// Brings in the Babel hook augmentations
import {} from '@sewing-kit/plugin-babel';
import {} from 'jest';

const PLUGIN = 'SewingKit.jest';

declare module '@sewing-kit/types' {
  interface TestProjectConfigurationCustomHooks {
    readonly jestExtensions: AsyncSeriesWaterfallHook<string[]>;
    readonly jestEnvironment: AsyncSeriesWaterfallHook<string>;
    readonly jestModuleMapper: AsyncSeriesWaterfallHook<{
      [key: string]: string;
    }>;
    readonly jestSetupEnv: AsyncSeriesWaterfallHook<string[]>;
    readonly jestSetupTests: AsyncSeriesWaterfallHook<string[]>;
    readonly jestTransforms: AsyncSeriesWaterfallHook<
      {[key: string]: string},
      {babelTransform: string}
    >;
    readonly jestConfig: AsyncSeriesWaterfallHook<jest.InitialOptions>;
  }

  interface TestRootConfigurationCustomHooks {
    readonly jestSetupEnv: AsyncSeriesWaterfallHook<string[]>;
    readonly jestSetupTests: AsyncSeriesWaterfallHook<string[]>;
    readonly jestWatchIgnore: AsyncSeriesWaterfallHook<string[]>;
    readonly jestConfig: AsyncSeriesWaterfallHook<jest.InitialOptions>;
    readonly jestWatchPlugins: AsyncSeriesWaterfallHook<string[]>;
    readonly jestFlags: AsyncSeriesWaterfallHook<JestFlags>;
  }
}

const addProjectConfigurationHooks = addHooks<
  import('@sewing-kit/types').TestProjectConfigurationHooks
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
  jestConfig: new AsyncSeriesWaterfallHook(['jestConfig']),
}));

const addRootConfigurationHooks = addHooks<
  import('@sewing-kit/types').TestRootConfigurationHooks
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

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.Root},
  (tasks) => {
    tasks.test.tap(PLUGIN, ({workspace, hooks, options}) => {
      const projectConfigurations: {
        project: Project;
        hooks: import('@sewing-kit/types').TestProjectConfigurationHooks;
      }[] = [];

      const rootConfigPath = workspace.internal.configPath(
        'jest/root.config.js',
      );

      hooks.configure.tap(
        PLUGIN,
        compose(addRootConfigurationHooks, (hooks) => {
          hooks.jestWatchIgnore!.tap(PLUGIN, (watchIgnore) => [
            ...watchIgnore,
            '/tmp/',
            workspace.internal.resolvePath(),
            workspace.fs.buildPath(),
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
        }),
      );

      hooks.project.tap(PLUGIN, ({project, hooks}) => {
        hooks.configure.tap(
          PLUGIN,
          compose(addProjectConfigurationHooks, (hooks) => {
            projectConfigurations.push({project, hooks});

            hooks.jestSetupEnv!.tapPromise(PLUGIN, async (setupEnvFiles) => {
              const packageSetupEnvFiles = ([] as string[]).concat(
                ...(await Promise.all([
                  project.fs.glob('tests/setup/environment.*'),
                  project.fs.glob('tests/setup/environment/index.*'),
                ])),
              );

              return [...setupEnvFiles, ...packageSetupEnvFiles];
            });

            hooks.jestSetupTests!.tapPromise(
              PLUGIN,
              async (setupTestsFiles) => {
                const packageSetupTestsFiles = ([] as string[]).concat(
                  ...(await Promise.all([
                    project.fs.glob('tests/setup/tests.*'),
                    project.fs.glob('tests/setup/tests/index.*'),
                  ])),
                );

                return [...setupTestsFiles, ...packageSetupTestsFiles];
              },
            );
          }),
        );
      });

      hooks.pre.tap(PLUGIN, (steps, {configuration}) => [
        ...steps,
        createStep(async () => {
          const [rootSetupEnvFiles, rootSetupTestsFiles] = await Promise.all([
            configuration.jestSetupEnv!.promise([]),
            configuration.jestSetupTests!.promise([]),
          ]);

          const projects = await Promise.all(
            projectConfigurations.map(async ({project, hooks}) => {
              if (hooks.babelConfig == null) {
                throw new MissingPluginError('@sewing-kit/plugin-babel');
              }

              const babelTransform = workspace.internal.configPath(
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

              await workspace.internal.write(
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

          const watchPlugins = await configuration.jestWatchPlugins!.promise(
            [],
          );
          const watchIgnorePatterns = await configuration.jestWatchIgnore!.promise(
            [],
          );

          const rootConfig = await configuration.jestConfig!.promise({
            rootDir: workspace.root,
            projects: projects as any,
            watchPlugins,
            watchPathIgnorePatterns: watchIgnorePatterns,
          });

          await workspace.internal.write(
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

          const isCi = ['true', '1'].includes(process.env.CI || '');

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
            cacheDirectory: workspace.internal.cachePath('jest'),
          });

          const jest = await import('jest');
          jest.default.run(toArgs(flags));
        }),
      ]);
    });
  },
);
