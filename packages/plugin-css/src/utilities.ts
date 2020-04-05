import {
  Env,
  Service,
  WebApp,
  Project,
  PluginApi,
  Package,
  Runtime,
} from '@sewing-kit/plugins';
import {CSSWebpackHooks} from './types';

export async function createCSSWebpackRuleSet({
  env,
  api,
  project,
  configuration,
  sourceMaps,
  cacheDirectory,
  cacheDependencies: initialCacheDependencies = [],
}: {
  env: Env;
  api: PluginApi;
  project: Project;
  configuration: Partial<CSSWebpackHooks>;
  sourceMaps?: boolean;
  cacheDirectory: string;
  cacheDependencies: string[];
}) {
  const isWebApp = project instanceof WebApp;
  const isUsingProductionAssets = env != null && shouldUseProductionAssets(env);

  const [
    {default: MiniCssExtractPlugin},
    {createCacheLoaderRule},
    classNamePattern,
    cacheDependencies,
  ] = await Promise.all([
    import('mini-css-extract-plugin'),
    import('@sewing-kit/plugin-webpack'),
    configuration.cssModuleClassNamePattern!.run(
      isUsingProductionAssets
        ? '[hash:base64:5]'
        : '[name]-[local]_[hash:base64:5]',
    ),
    configuration.cssWebpackCacheDependencies!.run([
      'postcss',
      ...initialCacheDependencies,
    ]),
  ] as const);

  const use: import('webpack').RuleSetUse[] = [];

  if (isWebApp) {
    use.push(
      isUsingProductionAssets
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

  const [modules, postcssContext] = await Promise.all([
    configuration.cssWebpackLoaderModule!.run({
      localIdentName: classNamePattern,
    }),
    configuration.cssWebpackPostcssLoaderContext!.run({}),
  ] as const);

  const [cssLoaderOptions, postcssOptions] = await Promise.all([
    configuration.cssWebpackLoaderOptions!.run({
      modules,
      importLoaders: 1,
      sourceMap: sourceMaps,
      onlyLocals:
        project instanceof Service ||
        (project instanceof Package &&
          project.entries[0]?.runtime === Runtime.Node),
    }),
    configuration.cssWebpackPostcssLoaderOptions!.run({
      config: {ctx: postcssContext},
      sourceMap: sourceMaps,
    }),
  ] as const);

  use.push(
    {
      loader: 'css-loader',
      options: cssLoaderOptions,
    },
    {
      loader: 'postcss-loader',
      options: postcssOptions,
    },
  );

  return use;
}

export function shouldUseProductionAssets(env: Env) {
  return env === Env.Production;
}
