import {
  Env,
  Service,
  WebApp,
  Project,
  PluginApi,
  Package,
  Runtime,
} from '@sewing-kit/plugins';
import type {CSSWebpackHooks, CSSWebpackPostcssPlugins} from './types';

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
}: {
  id?: string;
  env: Env;
  api: PluginApi;
  project: Project;
  configuration: Partial<CSSWebpackHooks>;
  sourceMaps?: boolean;
  postcss?: boolean | CSSWebpackPostcssPlugins;
  cssModules?: boolean;
  cacheDirectory: string;
  cacheDependencies?: string[];
}) {
  const isWebApp = project instanceof WebApp;
  const production = env === Env.Production;

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
    postcss
      ? configuration.cssWebpackPostcssPlugins!.run(
          typeof postcss === 'boolean' ? {} : postcss,
        )
      : Promise.resolve({}),
  ] as const);

  const pluginNames = Object.keys(postcssPlugins);
  const postcssPluginOptions =
    postcss && pluginNames.length > 0
      ? {
          ident: `postcss_${id}`,
          plugins: () =>
            pluginNames.map((plugin) => {
              const optionsOrEnabled = postcssPlugins[plugin];
              /* eslint-disable @typescript-eslint/no-var-requires */
              return typeof optionsOrEnabled === 'boolean'
                ? require(plugin)()
                : require(plugin)(optionsOrEnabled);
              /* eslint-enable @typescript-eslint/no-var-requires */
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
      ...(postcss ? ['postcss', ...pluginNames] : []),
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

  if (isWebApp) {
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
