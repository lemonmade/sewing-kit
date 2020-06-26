import {
  Env,
  Service,
  Project,
  PluginApi,
  Package,
  Runtime,
  ValueOrGetter,
  unwrapPossibleGetter,
  projectTypeSwitch,
} from '@sewing-kit/plugins';
import type {CSSWebpackHooks, PostcssPlugins} from './types';
import type {Options as PostcssPresetOptions} from './postcss-preset';

export const ENV_PRESET = '@sewing-kit/plugin-css/postcss-preset';

export async function createCSSWebpackRuleSet({
  id,
  env,
  api,
  project,
  configuration,
  sourceMaps,
  postcss = true,
  cssModules = true,
  cacheDirectory,
  cacheDependencies: initialCacheDependencies = [],
  runtimes = getDefaultRuntimes(project),
}: {
  id?: string;
  env: Env;
  api: PluginApi;
  project: Project;
  configuration: Partial<CSSWebpackHooks>;
  sourceMaps?: boolean;
  postcss?: boolean;
  cssModules?: boolean;
  cacheDirectory: string;
  cacheDependencies?: readonly string[];
  runtimes?: readonly Runtime[];
}) {
  const fullCss = usesRealCss(runtimes);
  const production = env === Env.Production;
  const finalPostcss = postcss && fullCss;

  const [
    {default: MiniCssExtractPlugin},
    {createCacheLoaderRule},
    classNamePattern,
    postcssPlugins,
  ] = await Promise.all([
    import('mini-css-extract-plugin'),
    import('@sewing-kit/plugin-webpack'),
    configuration.cssModuleClassNamePattern!.run(
      production ? '[hash:base64:5]' : '[name]-[local]_[hash:base64:5]',
    ),
    finalPostcss ? configuration.postcssPlugins!.run({}) : Promise.resolve({}),
  ] as const);

  const pluginNames = Object.keys(postcssPlugins);
  const postcssPluginOptions =
    finalPostcss && pluginNames.length > 0
      ? {
          ident: `postcss_${id}`,
          plugins: () =>
            pluginNames.map((plugin) => {
              const optionsOrEnabled = postcssPlugins[plugin];
              return typeof optionsOrEnabled === 'boolean'
                ? safeRequire(plugin)()
                : safeRequire(plugin)(optionsOrEnabled);
            }),
        }
      : {};

  const [modules, postcssContext, cacheDependencies] = await Promise.all([
    configuration.cssWebpackLoaderModule!.run(
      cssModules && {
        localIdentName: classNamePattern,
      },
    ),
    configuration.cssWebpackPostcssLoaderContext!.run({}),
    configuration.cssWebpackCacheDependencies!.run([
      ...(finalPostcss ? ['postcss', ...pluginNames] : []),
      ...initialCacheDependencies,
    ]),
  ] as const);

  const [cssLoaderOptions, postcssOptions] = await Promise.all([
    configuration.cssWebpackLoaderOptions!.run({
      modules,
      importLoaders: 1,
      sourceMap: sourceMaps,
      esModule: true,
      onlyLocals:
        project instanceof Service ||
        (project instanceof Package &&
          project.entries[0]?.runtime === Runtime.Node),
    }),
    postcss
      ? configuration.cssWebpackPostcssLoaderOptions!.run({
          config: {ctx: postcssContext},
          sourceMap: sourceMaps,
          ...postcssPluginOptions,
        })
      : Promise.resolve({}),
  ] as const);

  const use: import('webpack').RuleSetUse[] = [];

  if (fullCss) {
    use.push(
      production
        ? {loader: MiniCssExtractPlugin.loader}
        : {loader: 'style-loader'},
    );
  }

  if (cacheDirectory) {
    use.push(
      await createCacheLoaderRule({
        env,
        api,
        project,
        configuration: configuration as any,
        cachePath: cacheDirectory,
        dependencies: cacheDependencies,
      }),
    );
  }

  use.push({
    loader: 'css-loader',
    options: cssLoaderOptions,
  });

  if (postcss) {
    use.push({
      loader: 'postcss-loader',
      options: postcssOptions,
    });
  }

  return use;
}

export function usesRealCss(runtimes: readonly Runtime[]) {
  return runtimes.some((runtime) => runtime === Runtime.Browser);
}

function getDefaultRuntimes(project: Project) {
  return (
    projectTypeSwitch(project, {
      package: (pkg) => (pkg.runtime ? [pkg.runtime] : []),
      webApp: () => [Runtime.Browser],
      service: () => [Runtime.Node],
    }) ?? []
  );
}

export function updatePostcssPlugin<Options = object>(
  plugin: string | string[],
  options: ValueOrGetter<Options, [Partial<Options>]>,
  {addIfMissing = true} = {},
) {
  const normalizedPlugins = Array.isArray(plugin) ? plugin : [plugin];

  return async (plugins: PostcssPlugins) => {
    let hasMatch = false;
    const newPlugins = {...plugins};

    for (const normalize of normalizedPlugins) {
      if (normalize in newPlugins && newPlugins[normalize] != null) {
        hasMatch = true;

        const existingValue: Partial<Options> =
          typeof newPlugins[normalize] === 'boolean'
            ? {}
            : (newPlugins[normalize] as any);

        newPlugins[normalize] = (await unwrapPossibleGetter(
          options,
          existingValue,
        )) as any;
      }
    }

    if (!hasMatch && addIfMissing) {
      newPlugins[normalizedPlugins[0]] = (await unwrapPossibleGetter(
        options,
        {} as any,
      )) as any;
    }

    return newPlugins;
  };
}

function safeRequire(plugin: string): (...args: any[]) => any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const required = require(plugin);
  return required && required.__esModule
    ? required.default ?? required
    : required;
}

export function updatePostcssEnvPreset(
  options: ValueOrGetter<PostcssPresetOptions, [Partial<PostcssPresetOptions>]>,
  {addIfMissing = true} = {},
) {
  return updatePostcssPlugin<PostcssPresetOptions>(
    [ENV_PRESET, require.resolve(ENV_PRESET)],
    async (existingOptions) => {
      const resolvedOptions = await unwrapPossibleGetter(
        options,
        existingOptions,
      );

      const newAutoprefixer = resolvedOptions.autoprefixer;
      const oldAutoprefixer = existingOptions.autoprefixer;

      return typeof options === 'function'
        ? resolvedOptions
        : {
            ...existingOptions,
            ...resolvedOptions,
            /* eslint-disable no-nested-ternary */
            autoprefixer:
              typeof newAutoprefixer === 'boolean'
                ? newAutoprefixer
                : typeof oldAutoprefixer === 'boolean'
                ? oldAutoprefixer
                : {
                    ...(typeof oldAutoprefixer === 'boolean'
                      ? {}
                      : oldAutoprefixer ?? {}),
                    ...(newAutoprefixer ?? {}),
                  },
            /* eslint-enable no-nested-ternary */
            features: {
              ...(existingOptions.features ?? {}),
              ...(resolvedOptions.features ?? {}),
            },
          };
    },
    {addIfMissing},
  );
}
