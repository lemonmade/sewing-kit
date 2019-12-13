import {Workspace, WebApp} from '@sewing-kit/model';
import {DevWebAppConfigurationHooks} from '@sewing-kit/hooks';
import {MissingPluginError} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-webpack';

export const PLUGIN = 'SewingKit.web-app-base';

type Configuration = import('webpack').Configuration;

export async function createWebpackConfig(
  hooks: DevWebAppConfigurationHooks,
  webApp: WebApp,
  workspace: Workspace,
  explicitConfig: Configuration = {},
) {
  if (hooks.webpackConfig == null) {
    throw new MissingPluginError('@sewing-kit/plugin-webpack');
  }

  const rules = await hooks.webpackRules!.promise([]);
  const plugins = await hooks.webpackPlugins!.promise([]);
  const extensions = await hooks.webpackExtensions!.promise([]);
  const outputPath = await hooks.webpackOutputDirectory!.promise(
    workspace.fs.buildPath(),
  );
  const filename = await hooks.webpackOutputFilename!.promise('[name].js');
  const publicPath = await hooks.webpackPublicPath!.promise('/assets');

  return hooks.webpackConfig.promise({
    entry: (await hooks.webpackEntries!.promise(
      webApp.entry ? [webApp.fs.resolvePath(webApp.entry)] : [],
    )) as string[],
    resolve: {extensions: extensions as string[]},
    module: {rules: rules as any[]},
    output: {
      path: outputPath,
      filename,
      publicPath,
    },
    plugins: plugins as any[],
    ...explicitConfig,
  });
}
