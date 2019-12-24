import {join} from 'path';

import {
  Project,
  Package,
  WaterfallHook,
  createWorkspaceTestPlugin,
  createProjectPlugin,
  toArgs,
  addHooks,
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

const addProjectConfigurationHooks = addHooks<
  import('@sewing-kit/hooks').TestProjectConfigurationHooks
>(() => ({
  jestExtensions: new WaterfallHook(),
  jestEnvironment: new WaterfallHook(),
  jestModuleMapper: new WaterfallHook(),
  jestSetupEnv: new WaterfallHook(),
  jestSetupTests: new WaterfallHook(),
  jestTransforms: new WaterfallHook(),
  jestTestMatch: new WaterfallHook(),
  jestConfig: new WaterfallHook(),
}));

const addWorkspaceConfigurationHooks = addHooks<
  import('@sewing-kit/hooks').TestWorkspaceConfigurationHooks
>(() => ({
  jestSetupEnv: new WaterfallHook(),
  jestSetupTests: new WaterfallHook(),
  jestWatchIgnore: new WaterfallHook(),
  jestWatchPlugins: new WaterfallHook(),
  jestConfig: new WaterfallHook(),
  jestFlags: new WaterfallHook(),
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

export function jest() {
  return createWorkspaceTestPlugin(
    PLUGIN,
    ({workspace, hooks, options, api}) => {
      const projectConfigurations = new Map<
        Project,
        import('@sewing-kit/hooks').TestProjectConfigurationHooks
      >();
      const rootConfigPath = api.configPath('jest/root.config.js');

      hooks.configure.hook((hooks) => {
        addWorkspaceConfigurationHooks(hooks);

        hooks.jestWatchIgnore!.hook((watchIgnore) => [
          ...watchIgnore,
          '/tmp/',
          api.resolvePath(),
          workspace.fs.buildPath(),
          ...workspace.projects.map((project) => project.fs.buildPath()),
        ]);

        hooks.jestWatchPlugins!.hook((watchPlugins) => [
          ...watchPlugins,
          'jest-watch-typeahead/filename',
          'jest-watch-typeahead/testname',
        ]);

        hooks.jestSetupEnv!.hook(async (setupEnvFiles) => {
          const packageSetupEnvFiles = ([] as string[]).concat(
            ...(await Promise.all([
              workspace.fs.glob('tests/setup/environment.*'),
              workspace.fs.glob('tests/setup/environment/index.*'),
            ])),
          );

          return [...setupEnvFiles, ...packageSetupEnvFiles];
        });

        hooks.jestSetupTests!.hook(async (setupTestsFiles) => {
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
          {label: 'Writing Jest configuration files'},
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
                    testRegex: `.*\\.test\\.(${extensions.join('|')})$`,
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
        api.createStep({label: 'Running Jest', indefinite: true}, async () => {
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

          const flags = await configuration.jestFlags!.run({
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
      hooks.configure.hook((hooks) => {
        addProjectConfigurationHooks(hooks);

        context.jestProjectConfigurations!.set(project, hooks);

        hooks.jestSetupEnv!.hook(async (setupEnvFiles) => {
          const packageSetupEnvFiles = ([] as string[]).concat(
            ...(await Promise.all([
              project.fs.glob('tests/setup/environment.*'),
              project.fs.glob('tests/setup/environment/index.*'),
            ])),
          );

          return [...setupEnvFiles, ...packageSetupEnvFiles];
        });

        hooks.jestSetupTests!.hook(async (setupTestsFiles) => {
          const packageSetupTestsFiles = ([] as string[]).concat(
            ...(await Promise.all([
              project.fs.glob('tests/setup/tests.*'),
              project.fs.glob('tests/setup/tests/index.*'),
            ])),
          );

          return [...setupTestsFiles, ...packageSetupTestsFiles];
        });

        hooks.jestModuleMapper!.hook((moduleMap) => {
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
