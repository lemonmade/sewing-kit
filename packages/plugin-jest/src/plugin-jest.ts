import {join} from 'path';

import {
  Project,
  Package,
  WaterfallHook,
  createWorkspaceTestPlugin,
  createProjectPlugin,
  toArgs,
  MissingPluginError,
} from '@sewing-kit/plugins';

// Brings in the Babel hook augmentations
import {} from '@sewing-kit/plugin-babel';
import {} from 'jest';

const PLUGIN = 'SewingKit.Jest';

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
    readonly jestExtensions: WaterfallHook<readonly string[]>;
    readonly jestEnvironment: WaterfallHook<string>;
    readonly jestModuleMapper: WaterfallHook<{
      [key: string]: string;
    }>;
    readonly jestSetupEnv: WaterfallHook<readonly string[]>;
    readonly jestSetupTests: WaterfallHook<readonly string[]>;
    readonly jestTransforms: WaterfallHook<
      {[key: string]: string},
      {readonly babelTransform: string}
    >;
    readonly jestTestMatch: WaterfallHook<readonly string[]>;
    readonly jestConfig: WaterfallHook<JestConfig>;
  }

  interface TestWorkspaceConfigurationCustomHooks {
    readonly jestSetupEnv: WaterfallHook<readonly string[]>;
    readonly jestSetupTests: WaterfallHook<readonly string[]>;
    readonly jestWatchIgnore: WaterfallHook<readonly string[]>;
    readonly jestConfig: WaterfallHook<JestConfig>;
    readonly jestWatchPlugins: WaterfallHook<readonly string[]>;
    readonly jestFlags: WaterfallHook<JestFlags>;
  }

  interface TestProjectCustomWorkspaceContext {
    readonly jestProjectConfigurations: Map<
      Project,
      TestProjectConfigurationHooks
    >;
  }
}

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

export function jest() {
  return createWorkspaceTestPlugin(
    PLUGIN,
    ({workspace, hooks, options, api}) => {
      const projectConfigurations = new Map<
        Project,
        import('@sewing-kit/hooks').TestProjectConfigurationHooks
      >();
      const rootConfigPath = api.configPath('jest/root.config.js');

      hooks.configureHooks.hook((hooks) => ({
        ...hooks,
        jestSetupEnv: new WaterfallHook(),
        jestSetupTests: new WaterfallHook(),
        jestWatchIgnore: new WaterfallHook(),
        jestWatchPlugins: new WaterfallHook(),
        jestConfig: new WaterfallHook(),
        jestFlags: new WaterfallHook(),
      }));

      hooks.configure.hook((configure) => {
        configure.jestWatchIgnore!.hook((watchIgnore) => [
          ...watchIgnore,
          '/tmp/',
          api.resolvePath(),
          workspace.fs.buildPath(),
          ...workspace.projects.map((project) => project.fs.buildPath()),
        ]);

        configure.jestWatchPlugins!.hook((watchPlugins) => [
          ...watchPlugins,
          'jest-watch-typeahead/filename',
          'jest-watch-typeahead/testname',
        ]);

        configure.jestSetupEnv!.hook(async (setupEnvFiles) => {
          const packageSetupEnvFiles = ([] as string[]).concat(
            ...(await Promise.all([
              workspace.fs.glob('tests/setup/environment.*'),
              workspace.fs.glob('tests/setup/environment/index.*'),
            ])),
          );

          return [...setupEnvFiles, ...packageSetupEnvFiles];
        });

        configure.jestSetupTests!.hook(async (setupTestsFiles) => {
          const packageSetupTestsFiles = ([] as string[]).concat(
            ...(await Promise.all([
              workspace.fs.glob('tests/setup/tests.*'),
              workspace.fs.glob('tests/setup/tests/index.*'),
            ])),
          );

          return [...setupTestsFiles, ...packageSetupTestsFiles];
        });
      });

      hooks.context.hook((context) => ({
        ...context,
        jestProjectConfigurations: projectConfigurations,
      }));

      hooks.pre.hook((steps, {configuration}) => [
        ...steps,
        api.createStep(
          {
            id: 'Jest.WriteConfigurationFiles',
            label: 'write jest configuration files',
          },
          async () => {
            const [rootSetupEnvFiles, rootSetupTestsFiles] = await Promise.all([
              configuration.jestSetupEnv!.run([]),
              configuration.jestSetupTests!.run([]),
            ]);

            const projects = await Promise.all(
              [...projectConfigurations.entries()].map(
                async ([project, hooks]) => {
                  if (hooks.babelConfig == null) {
                    throw new MissingPluginError('@sewing-kit/plugin-babel');
                  }

                  const babelTransform = api.configPath(
                    'jest/packages',
                    project.name,
                    'babel-transformer.js',
                  );

                  const babelConfig = await hooks.babelConfig.run({});
                  const transform = await hooks.jestTransforms!.run(
                    {},
                    {babelTransform},
                  );
                  const environment = await hooks.jestEnvironment!.run('node');
                  const extensions = (
                    await hooks.jestExtensions!.run([])
                  ).map((extension) => extension.replace('.', ''));
                  const moduleMapper = await hooks.jestModuleMapper!.run({});
                  const setupEnvFiles = await hooks.jestSetupEnv!.run(
                    rootSetupEnvFiles,
                  );
                  const setupTestsFiles = await hooks.jestSetupTests!.run(
                    rootSetupTestsFiles,
                  );

                  await api.write(
                    babelTransform,
                    `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
                      babelConfig,
                    )})`,
                  );

                  const config = await hooks.jestConfig!.run({
                    displayName: project.name,
                    rootDir: project.root,
                    testRegex: `.+\\.test\\.(${extensions.join('|')})$`,
                    moduleFileExtensions: extensions,
                    testEnvironment: environment,
                    moduleNameMapper: moduleMapper,
                    setupFiles: setupEnvFiles,
                    setupFilesAfterEnv: setupTestsFiles,
                    transform,
                  });

                  return config;
                },
              ),
            );

            const watchPlugins = await configuration.jestWatchPlugins!.run([]);
            const watchIgnorePatterns = await configuration.jestWatchIgnore!.run(
              [],
            );

            const rootConfig = await configuration.jestConfig!.run({
              rootDir: workspace.root,
              projects: projects as any,
              watchPlugins,
              watchPathIgnorePatterns: watchIgnorePatterns,
            });

            await api.write(
              rootConfigPath,
              `module.exports = ${JSON.stringify(rootConfig)};`,
            );
          },
        ),
      ]);

      hooks.steps.hook((steps, {configuration}) => [
        ...steps,
        api.createStep({id: 'Jest.Test', label: 'run jest'}, async (step) => {
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
            updateSnapshots,
          } = options;

          async function run() {
            const flags = await configuration.jestFlags!.run({
              ci: isCi ? isCi : undefined,
              config: rootConfigPath,
              coverage,
              watch: watch && testPattern == null,
              watchAll: watch && testPattern != null,
              onlyChanged: !isCi && testPattern == null,
              testNamePattern,
              testPathPattern: testPattern,
              updateSnapshot: updateSnapshots,
              runInBand: debug,
              forceExit: debug,
              cacheDirectory: api.cachePath('jest'),
            });

            const jest = await import('jest');
            jest.default.run(toArgs(flags));
          }

          if (watch) {
            step.indefinite(run);
          } else {
            await run();
          }
        }),
      ]);
    },
  );
}

export const jestConfigurationHooks = createProjectPlugin(
  PLUGIN,
  ({project, workspace, tasks: {test, build}}) => {
    build.hook(({hooks}) => {
      hooks.configure.hook((configurationHooks) => {
        configurationHooks.babelIgnorePatterns?.hook((patterns) => [
          ...patterns,
          '**/test/',
          '**/tests/',
        ]);
      });
    });

    test.hook(({hooks, context}) => {
      hooks.configureHooks.hook((hooks) => ({
        ...hooks,
        jestExtensions: new WaterfallHook(),
        jestEnvironment: new WaterfallHook(),
        jestModuleMapper: new WaterfallHook(),
        jestSetupEnv: new WaterfallHook(),
        jestSetupTests: new WaterfallHook(),
        jestTransforms: new WaterfallHook(),
        jestTestMatch: new WaterfallHook(),
        jestConfig: new WaterfallHook(),
      }));

      hooks.configure.hook((configure) => {
        context.jestProjectConfigurations!.set(project, configure);

        configure.jestSetupEnv!.hook(async (setupEnvFiles) => {
          const packageSetupEnvFiles = ([] as string[]).concat(
            ...(await Promise.all([
              project.fs.glob('tests/setup/environment.*'),
              project.fs.glob('tests/setup/environment/index.*'),
            ])),
          );

          return [...setupEnvFiles, ...packageSetupEnvFiles];
        });

        configure.jestSetupTests!.hook(async (setupTestsFiles) => {
          const packageSetupTestsFiles = ([] as string[]).concat(
            ...(await Promise.all([
              project.fs.glob('tests/setup/tests.*'),
              project.fs.glob('tests/setup/tests/index.*'),
            ])),
          );

          return [...setupTestsFiles, ...packageSetupTestsFiles];
        });

        configure.jestModuleMapper!.hook((moduleMap) => {
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
  },
);

function packageEntryMatcherMap({runtimeName, entries, fs}: Package) {
  const map: Record<string, string> = Object.create(null);

  for (const {name, root} of entries) {
    map[
      name ? join(runtimeName, `${name}$`) : `${runtimeName}$`
    ] = fs.resolvePath(root);
  }

  return map;
}
