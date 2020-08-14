import {resolve, relative, dirname} from 'path';
import {sync as glob} from 'glob';
import {statSync as stat} from 'fs';
import {createHash} from 'crypto';
import {readFile, writeFile, mkdirp} from 'fs-extra';

import nodeObjectHash from 'node-object-hash';

import {
  Env,
  Project,
  PluginApi,
  Package,
  toArgs,
  Target,
  Runtime,
  unwrapPossibleGetter,
  ValueOrGetter,
  MissingPluginError,
} from '@sewing-kit/plugins';

import type {BabelHooks, BabelConfig} from './types';
import type {Options as BabelPresetOptions} from './babel-preset';

export const CORE_PRESET = '@sewing-kit/plugin-javascript/babel-preset';

export enum ExportStyle {
  EsModules,
  CommonJs,
}

export async function createJavaScriptWebpackRuleSet({
  api,
  env,
  target,
  configuration,
  cacheDirectory: cacheDirectoryName,
  cacheDependencies: initialCacheDependencies = [],
}: {
  api: PluginApi;
  env: Env;
  target: Target<Project, any>;
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
    configuration.babelConfig?.run({
      plugins: [],
      presets: [
        [
          CORE_PRESET,
          {
            modules: 'preserve',
            target:
              target.runtime.includes(Runtime.Node) &&
              target.runtime.runtimes.size === 1
                ? 'node'
                : undefined,
          } as BabelPresetOptions,
        ],
      ],
    }),
    configuration.babelCacheDependencies?.run([
      '@babel/core',
      ...initialCacheDependencies,
    ]),
    configuration.webpackCachePath!.run(
      api.cachePath('webpack/babel', cacheDirectoryName),
    ),
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
          target.project,
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
  babelOptions: Partial<BabelConfig>,
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
  readonly exportStyle?: ExportStyle;
  readonly cache?: boolean;
  readonly cacheDependencies?: string[];
}

export function createCompileBabelStep({
  api,
  project: pkg,
  configuration,
  configFile,
  outputPath,
  extension,
  exportStyle,
  cache,
  cacheDependencies: initialCacheDependencies = [],
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
        babelCacheDependencies = [],
      ] = await Promise.all([
        configuration.babelConfig.run({
          presets: [CORE_PRESET],
          plugins: [
            // This avoids compilation targets without generators having bare
            // `regeneratorRuntime` globals. It does mean that the final consumer
            // needs to have the runtime dependency (`@babel/runtime`), though.
            [
              require.resolve('@babel/plugin-transform-runtime'),
              {
                corejs: false,
                helpers: false,
                regenerator: true,
                useESModules: exportStyle === ExportStyle.EsModules,
              },
            ],
          ],
        }),
        configuration.babelIgnorePatterns!.run([]),
        configuration.babelExtensions!.run(['.mjs', '.js']),
        configuration.babelCacheDependencies?.run([
          '@babel/core',
          ...initialCacheDependencies,
        ]),
      ]);

      // Check Babel package build cache
      let cacheValue = '',
        cachePath = '';
      if (cache) {
        cacheValue = generateBabelPackageCacheValue(
          pkg,
          babelConfig,
          outputPath,
          extension || '.js',
          exportStyle || ExportStyle.CommonJs,
          [...babelCacheDependencies],
          [...babelIgnorePatterns],
          [...babelExtensions],
        );
        cachePath = getBabelPackageCachePath(api, pkg.name, configFile);
        if (await readBabelPackageCache(cacheValue, cachePath)) {
          step.log(
            `Successfully read from Babel cache for package ${pkg.name}, skipping compilation`,
          );
          return;
        }
      }

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
            copyFiles: true,
            noCopyIgnored: true,
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

      await writeEntries({
        project: pkg,
        extension,
        outputPath,
        exportStyle,
      });

      if (cache) {
        await writeBabelPackageCache(cacheValue, cachePath);
      }
    },
  );
}

async function readBabelPackageCache(newCacheValue: string, cachePath: string) {
  try {
    return (await readFile(cachePath, 'utf8')) === newCacheValue;
  } catch (err) {
    return false;
  }
}

async function writeBabelPackageCache(cacheValue: string, cachePath: string) {
  await mkdirp(dirname(cachePath));
  await writeFile(cachePath, cacheValue);
}

function getBabelPackageCachePath(
  api: PluginApi,
  pkgName: string,
  configFileName: string,
) {
  return api.cachePath(
    'babel',
    'packages',
    pkgName,
    configFileName.replace(/\./g, '-'),
  );
}

function generateBabelPackageCacheValue(
  pkg: Package,
  babelConfig: BabelConfig,
  outputPath: string,
  extension: string,
  exportStyle: ExportStyle,
  babelCacheDependencies: string[],
  babelIgnorePatterns: string[],
  babelExtensions: string[],
) {
  const optionsHash = [
    outputPath,
    extension,
    exportStyle,
    ...babelIgnorePatterns,
    ...babelExtensions,
  ].join('&');

  const dependencyString = [...babelCacheDependencies]
    .map(
      (dependency) =>
        `${dependency}:${
          pkg.dependency(dependency)?.version || 'notinstalled'
        }`,
    )
    .join('&');
  const latestModifiedTime = getLatestModifiedTime(pkg, babelExtensions);
  const dependencyModifiedHash = createHash('md5')
    .update(dependencyString)
    .update(String(latestModifiedTime))
    .digest('hex');

  const configHash = nodeObjectHash().hash(babelConfig);

  return `${optionsHash}+${dependencyModifiedHash}+${configHash}`;
}

function getLatestModifiedTime(pkg: Package, babelExtensions: string[]) {
  const sourceRoot = resolve(pkg.root, 'src');
  const compiledFiles = glob(
    `${sourceRoot}/**/*{${babelExtensions.join(',')}}`,
  );
  return compiledFiles.reduce((latestTime, file) => {
    const {mtimeMs} = stat(file);

    return mtimeMs > latestTime ? mtimeMs : latestTime;
  }, 0);
}

async function writeEntries({
  project,
  extension = '.js',
  outputPath,
  exportStyle = ExportStyle.CommonJs,
}: Pick<
  CompileBabelOptions,
  'project' | 'extension' | 'outputPath' | 'exportStyle'
>) {
  const sourceRoot = resolve(project.root, 'src');

  await Promise.all(
    project.entries.map(async (entry) => {
      const absoluteEntryPath = (await project.fs.hasFile(`${entry.root}.*`))
        ? project.fs.resolvePath(entry.root)
        : project.fs.resolvePath(entry.root, 'index');

      const relativeFromSourceRoot = relative(sourceRoot, absoluteEntryPath);
      const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
      const relativeFromRoot = normalizedRelative(
        project.root,
        destinationInOutput,
      );

      if (exportStyle === ExportStyle.CommonJs) {
        await project.fs.write(
          `${entry.name || 'index'}${extension}`,
          `module.exports = require(${JSON.stringify(relativeFromRoot)});`,
        );

        return;
      }

      let hasDefault = true;
      let content = '';

      try {
        content = await project.fs.read(
          (await project.fs.glob(`${absoluteEntryPath}.*`))[0],
        );

        // export default ...
        // export {Foo as default} from ...
        // export {default} from ...
        hasDefault =
          /(?:export|as) default\b/.test(content) || /{default}/.test(content);
      } catch {
        // intentional no-op
      }

      await project.fs.write(
        `${entry.name ?? 'index'}${extension}`,
        [
          `export * from ${JSON.stringify(relativeFromRoot)};`,
          hasDefault
            ? `export {default} from ${JSON.stringify(relativeFromRoot)};`
            : false,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }),
  );
}

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
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
              const [name, currentOptions = {}] = Array.isArray(plugin)
                ? plugin
                : [plugin];

              if (normalizedPlugins.includes(name)) {
                hasMatch = true;

                const newOptions = await unwrapPossibleGetter(
                  options,
                  currentOptions,
                );

                return [
                  name,
                  typeof options === 'function'
                    ? {...newOptions}
                    : {...currentOptions, ...newOptions},
                ];
              }

              return plugin;
            },
          ),
        )),
    };

    if (!hasMatch && addIfMissing) {
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
      presets:
        config.presets &&
        (await Promise.all(
          config.presets.map<Promise<string | [string, object?]>>(
            async (preset) => {
              const [name, currentOptions = {}] = Array.isArray(preset)
                ? preset
                : [preset];

              if (normalizedPresets.includes(name)) {
                hasMatch = true;

                const newOptions = await unwrapPossibleGetter(
                  options,
                  currentOptions,
                );

                return [
                  name,
                  typeof options === 'function'
                    ? {...newOptions}
                    : {...currentOptions, ...newOptions},
                ];
              }

              return preset;
            },
          ),
        )),
    };

    if (!hasMatch && addIfMissing) {
      newConfig.presets.push([
        normalizedPresets[0],
        await unwrapPossibleGetter(options, {}),
      ]);
    }

    return newConfig;
  };
}

export function updateSewingKitBabelPreset(
  options: ValueOrGetter<BabelPresetOptions, [Partial<BabelPresetOptions>]>,
  {addIfMissing = false} = {},
) {
  return updateBabelPreset<BabelPresetOptions>(
    [CORE_PRESET, require.resolve(CORE_PRESET)],
    options,
    {addIfMissing},
  );
}
