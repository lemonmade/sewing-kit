import {join} from 'path';

import {
  Project,
  Package,
  WaterfallHook,
  createWorkspaceTestPlugin,
  toArgs,
  addHooks,
  MissingPluginError,
} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-javascript';

// Brings in the Babel hook augmentations
import {} from 'jest';

const PLUGIN = 'SewingKit.Jest';

type DeepReadonly<T> = Readonly<
  {
    [K in keyof T]: T[K] extends (infer U)[] | infer Rest
      ? readonly U[] | Rest
      : T[K];
  }
>;

type JestConfig = DeepReadonly<import('@jest/types').Config.InitialOptions>;

interface JestProjectHooks {
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
  readonly jestWatchIgnore: WaterfallHook<readonly string[]>;
}

interface JestWorkspaceHooks {
  readonly jestSetupEnv: WaterfallHook<readonly string[]>;
  readonly jestSetupTests: WaterfallHook<readonly string[]>;
  readonly jestConfig: WaterfallHook<JestConfig>;
  readonly jestWatchPlugins: WaterfallHook<readonly string[]>;
  readonly jestFlags: WaterfallHook<JestFlags>;
}

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends JestProjectHooks {}
  interface TestWorkspaceConfigurationCustomHooks extends JestWorkspaceHooks {}

  interface TestWorkspaceCustomContext {
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

      hooks.configureHooks.hook(
        addHooks<JestWorkspaceHooks>(() => ({
          jestSetupEnv: new WaterfallHook(),
          jestSetupTests: new WaterfallHook(),
          jestWatchPlugins: new WaterfallHook(),
          jestConfig: new WaterfallHook(),
          jestFlags: new WaterfallHook(),
        })),
      );

      hooks.context.hook((context) => ({
        ...context,
        jestProjectConfigurations: projectConfigurations,
      }));

      hooks.project.hook(({hooks, project, context}) => {
        hooks.configureHooks.hook(
          addHooks<JestProjectHooks>(() => ({
            jestExtensions: new WaterfallHook(),
            jestEnvironment: new WaterfallHook(),
            jestModuleMapper: new WaterfallHook(),
            jestSetupEnv: new WaterfallHook(),
            jestSetupTests: new WaterfallHook(),
            jestTransforms: new WaterfallHook(),
            jestTestMatch: new WaterfallHook(),
            jestConfig: new WaterfallHook(),
            jestWatchIgnore: new WaterfallHook(),
          })),
        );

        hooks.configure.hook((configuration) => {
          context.jestProjectConfigurations!.set(project, configuration);
        });
      });

      hooks.pre.hook((steps, {configuration}) => [
        ...steps,
        api.createStep(
          {
            id: 'Jest.WriteConfigurationFiles',
            label: 'write jest configuration files',
          },
          async () => {
            const internalModuleMap = workspace.packages.reduce<{
              [key: string]: string;
            }>(
              (all, pkg) => ({
                ...all,
                ...packageEntryMatcherMap(pkg),
              }),
              {},
            );

            const [
              setupEnvironment,
              setupEnvironmentIndexes,
              setupTests,
              setupTestsIndexes,
            ] = await Promise.all([
              workspace.fs.glob('tests/setup/environment.*'),
              workspace.fs.glob('tests/setup/environment/index.*'),
              workspace.fs.glob('tests/setup/tests.*'),
              workspace.fs.glob('tests/setup/tests/index.*'),
            ]);

            const [
              rootSetupEnvironmentFiles,
              rootSetupTestsFiles,
            ] = await Promise.all([
              configuration.jestSetupEnv!.run([
                ...setupEnvironment,
                ...setupEnvironmentIndexes,
              ]),
              configuration.jestSetupTests!.run([
                ...setupTests,
                ...setupTestsIndexes,
              ]),
            ]);

            const projects = await Promise.all(
              [...projectConfigurations.entries()].map(
                async ([project, hooks]) => {
                  if (hooks.babelConfig == null) {
                    throw new MissingPluginError(
                      '@sewing-kit/plugin-javascript',
                    );
                  }

                  const babelTransform = api.configPath(
                    'jest/packages',
                    project.name,
                    'babel-transformer.js',
                  );

                  const [
                    setupEnvironment,
                    setupEnvironmentIndexes,
                    setupTests,
                    setupTestsIndexes,
                  ] = await Promise.all([
                    project.fs.glob('tests/setup/environment.*'),
                    project.fs.glob('tests/setup/environment/index.*'),
                    project.fs.glob('tests/setup/tests.*'),
                    project.fs.glob('tests/setup/tests/index.*'),
                  ]);

                  const [
                    environment,
                    watchIgnore,
                    babelConfig,
                    transform,
                    extensions,
                    moduleMapper,
                    setupEnvironmentFiles,
                    setupTestsFiles,
                  ] = await Promise.all([
                    hooks.jestEnvironment!.run('node'),
                    hooks.jestWatchIgnore!.run([
                      project.fs.buildPath(),
                      project.fs.resolvePath('node_modules/'),
                    ]),
                    hooks.babelConfig.run({
                      presets: [],
                      plugins: [],
                    }),
                    hooks.jestTransforms!.run(
                      {'^.+\\.m?js$': babelTransform},
                      {babelTransform},
                    ),
                    // Unfortunately, some packages (like `graphql`) use `.mjs` for esmodule
                    // versions of the file, which Jest can't parse. To avoid transforming
                    // those otherwise-fine files, we prefer .js for tests only.
                    hooks.jestExtensions!.run(['.js', '.mjs', '.json']),
                    hooks.jestModuleMapper!.run(internalModuleMap),
                    hooks.jestSetupEnv!.run([
                      ...rootSetupEnvironmentFiles,
                      ...setupEnvironment,
                      ...setupEnvironmentIndexes,
                    ]),
                    hooks.jestSetupEnv!.run([
                      ...rootSetupTestsFiles,
                      ...setupTests,
                      ...setupTestsIndexes,
                    ]),
                  ]);

                  await api.write(
                    babelTransform,
                    `const {createTransformer} = require('babel-jest'); module.exports = createTransformer(${JSON.stringify(
                      babelConfig,
                    )});`,
                  );

                  const normalizedExtensions = extensions.map((extension) =>
                    extension.replace(/^\./, ''),
                  );

                  const config = await hooks.jestConfig!.run({
                    displayName: project.name,
                    rootDir: project.root,
                    testRegex: [
                      `.+\\.test\\.(${normalizedExtensions.join('|')})$`,
                    ],
                    moduleFileExtensions: normalizedExtensions,
                    testEnvironment: environment,
                    moduleNameMapper: moduleMapper,
                    setupFiles: setupEnvironmentFiles,
                    setupFilesAfterEnv: setupTestsFiles,
                    watchPathIgnorePatterns: watchIgnore,
                    transform,
                  });

                  return config;
                },
              ),
            );

            const watchPlugins = await configuration.jestWatchPlugins!.run([
              'jest-watch-typeahead/filename',
              'jest-watch-typeahead/testname',
            ]);

            const rootConfig = await configuration.jestConfig!.run({
              rootDir: workspace.root,
              projects: projects as any,
              watchPlugins,
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

            const {run} = await import('jest');
            await run(toArgs(flags));
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

function packageEntryMatcherMap({runtimeName, entries, fs}: Package) {
  const map: Record<string, string> = Object.create(null);

  for (const {name, root} of entries) {
    map[
      name ? join(runtimeName, `${name}$`) : `${runtimeName}$`
    ] = fs.resolvePath(root);
  }

  return map;
}
