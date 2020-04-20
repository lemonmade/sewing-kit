import {resolve} from 'path';
import {createHash} from 'crypto';

import nodeObjectHash from 'node-object-hash';

import {
  Env,
  Project,
  PluginApi,
  Package,
  toArgs,
  unwrapPossibleGetter,
  ValueOrGetter,
  MissingPluginError,
} from '@sewing-kit/plugins';

import type {BabelHooks, BabelConfig} from './types';
import type {Options as BabelPresetOptions} from './babel-preset';

export const ENV_PRESET = '@sewing-kit/plugin-javascript/babel-preset';

export async function createJavaScriptWebpackRuleSet({
  env,
  project,
  configuration,
  cacheDirectory: cacheDirectoryName,
  cacheDependencies: initialCacheDependencies = [],
}: {
  env: Env;
  project: Project;
  configuration:
    | import('@sewing-kit/hooks').BuildProjectConfigurationHooks
    | import('@sewing-kit/hooks').DevProjectConfigurationHooks;
  cacheDirectory: string;
  cacheDependencies?: string[];
}) {
  const [
    babelOptions = {},
    babelCacheDependencies = [],
    cacheDirectory,
  ] = await Promise.all([
    configuration.babelConfig?.run({}),
    configuration.babelCacheDependencies?.run([
      '@babel/core',
      ...initialCacheDependencies,
    ]),
    configuration.webpackCachePath!.run(cacheDirectoryName),
  ] as const);

  return [
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory,
        envName: env,
        configFile: false,
        cacheIdentifier: babelCacheIdentifier(
          env,
          project,
          babelOptions,
          babelCacheDependencies,
        ),
        ...babelOptions,
      },
    },
  ];
}

function babelCacheIdentifier(
  env: Env,
  project: Project,
  babelOptions: BabelConfig,
  dependencies: readonly string[],
) {
  const optionsHash = nodeObjectHash().hash(babelOptions);
  const prefix = `sk:${env}:`;
  const dependencyString = ['webpack', ...dependencies]
    .map(
      (dependency) =>
        `${dependency}:${
          project.dependency(dependency)?.version || 'notinstalled'
        }`,
    )
    .join('&');

  return `${prefix}${createHash('md5')
    .update(dependencyString)
    .digest('hex')}@${optionsHash}`;
}

interface CompileBabelOptions {
  readonly api: PluginApi;
  readonly project: Package;
  readonly configuration: Partial<BabelHooks>;
  readonly configFile: string;
  readonly outputPath: string;
  readonly extension?: string;
}

export function createCompileBabelStep({
  api,
  project: pkg,
  configuration,
  configFile,
  outputPath,
  extension,
}: CompileBabelOptions) {
  return api.createStep(
    {id: 'Babel.Compile', label: 'compile with babel'},
    async (step) => {
      if (configuration.babelConfig == null) {
        throw new MissingPluginError('@sewing-kit/plugin-javascript');
      }

      // Let the hooks determine the configuration, ignore patterns,
      // and targeted extensions for the build.
      const [
        babelConfig,
        babelIgnorePatterns,
        babelExtensions,
      ] = await Promise.all([
        configuration.babelConfig.run({}),
        configuration.babelIgnorePatterns!.run([]),
        configuration.babelExtensions!.run(['.mjs', '.js']),
      ]);

      // We write a private config file for the build so that we can point
      // the webpack CLI at an actual configuration file.
      const babelConfigPath = api.configPath(
        'build/packages',
        pkg.name,
        configFile,
      );

      await api.write(
        babelConfigPath,
        `module.exports=${JSON.stringify(babelConfig)};`,
      );

      const sourceRoot = resolve(pkg.root, 'src');
      const replaceExtension =
        extension == null || extension.startsWith('.')
          ? extension
          : `.${extension}`;

      // TODO: use `cacheDependencies` and cache directories to get good caching going here
      await step.exec('node_modules/.bin/babel', [
        sourceRoot,
        ...toArgs(
          {
            outDir: outputPath,
            // @see https://babeljs.io/docs/en/babel-cli#custom-config-path
            configFile: babelConfigPath,
            verbose: true,
            // @see https://babeljs.io/docs/en/babel-cli#ignoring-babelrcjson-
            noBabelrc: true,
            babelConfig: false,
            extensions: babelExtensions.join(','),
            // @see https://babeljs.io/docs/en/babel-cli#ignore-files
            ignore:
              babelIgnorePatterns.length > 0
                ? babelIgnorePatterns.join(',')
                : undefined,
            // @see https://babeljs.io/docs/en/babel-cli#set-file-extensions
            outFileExtension: replaceExtension,
          },
          {dasherize: true},
        ),
      ]);
    },
  );
}

export function updateBabelPlugin<Options extends object = object>(
  plugin: string | string[],
  options: ValueOrGetter<Options, [Partial<Options>]>,
  {addIfMissing = true} = {},
) {
  const normalizedPlugins = Array.isArray(plugin) ? plugin : [plugin];

  return async (config: BabelConfig) => {
    let hasMatch = false;

    const newConfig = {
      ...config,
      plugins:
        config.plugins &&
        (await Promise.all(
          config.plugins.map<Promise<string | [string, object?]>>(
            async (plugin) => {
              const [name, currentOptions] = Array.isArray(plugin)
                ? plugin
                : [plugin];

              if (normalizedPlugins.includes(name)) {
                hasMatch = true;

                return [
                  name,
                  await unwrapPossibleGetter(options, currentOptions ?? {}),
                ];
              }

              return plugin;
            },
          ),
        )),
    };

    if (!hasMatch && addIfMissing) {
      newConfig.plugins = newConfig.plugins ?? [];

      newConfig.plugins.push([
        normalizedPlugins[0],
        await unwrapPossibleGetter(options, {}),
      ]);
    }

    return newConfig;
  };
}

export function updateBabelPreset<Options extends object = object>(
  preset: string | string[],
  options: ValueOrGetter<Options, [Partial<Options>]>,
  {addIfMissing = true} = {},
) {
  const normalizedPresets = Array.isArray(preset) ? preset : [preset];

  return async (config: BabelConfig) => {
    let hasMatch = false;

    const newConfig = {
      ...config,
      plugins:
        config.plugins &&
        (await Promise.all(
          config.plugins.map<Promise<string | [string, object?]>>(
            async (plugin) => {
              const [name, currentOptions] = Array.isArray(plugin)
                ? plugin
                : [plugin];

              if (normalizedPresets.includes(name)) {
                hasMatch = true;

                return [
                  name,
                  await unwrapPossibleGetter(options, currentOptions ?? {}),
                ];
              }

              return plugin;
            },
          ),
        )),
    };

    if (!hasMatch && addIfMissing) {
      newConfig.plugins = newConfig.plugins ?? [];

      newConfig.plugins.push([
        normalizedPresets[0],
        await unwrapPossibleGetter(options, {}),
      ]);
    }

    return newConfig;
  };
}

export function updateBabelEnvPreset(
  options: ValueOrGetter<BabelPresetOptions, [Partial<BabelPresetOptions>]>,
  {addIfMissing = false} = {},
) {
  return updateBabelPreset<BabelPresetOptions>(
    [ENV_PRESET, require.resolve(ENV_PRESET)],
    options,
    {addIfMissing},
  );
}
