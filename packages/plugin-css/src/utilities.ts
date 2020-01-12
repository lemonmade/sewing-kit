import {Env, Service, WebApp, Project} from '@sewing-kit/plugins';
import {CSSWebpackHooks} from './types';

export async function createCSSWebpackRuleSet({
  configure,
  project,
  sourceMaps,
  env,
}: {
  configure: Partial<CSSWebpackHooks>;
  project: Project;
  env?: Env;
  sourceMaps?: boolean;
}) {
  const isWebApp = project instanceof WebApp;
  const isUsingProductionAssets = env != null && shouldUseProductionAssets(env);

  const [
    classNamePattern,
    {default: MiniCssExtractPlugin},
  ] = await Promise.all([
    configure.cssModuleClassNamePattern!.run(
      isUsingProductionAssets
        ? '[hash:base64:5]'
        : '[name]-[local]_[hash:base64:5]',
    ),
    import('mini-css-extract-plugin'),
  ] as const);

  const use: import('webpack').RuleSetRule[] = [];

  if (isWebApp) {
    use.push(
      isUsingProductionAssets
        ? {loader: MiniCssExtractPlugin.loader}
        : {loader: 'style-loader'},
    );
  }

  use.push({
    loader: 'css-loader',
    options: await configure.cssWebpackLoaderOptions!.run({
      modules: await configure.cssWebpackLoaderModule!.run({
        localIdentName: classNamePattern,
      }),
      importLoaders: 1,
      sourceMap: sourceMaps,
      onlyLocals: project instanceof Service,
    }),
  });

  return use;
}

export function shouldUseProductionAssets(env: Env) {
  return env === Env.Production;
}
