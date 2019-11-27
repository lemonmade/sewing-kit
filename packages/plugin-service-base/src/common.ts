import {Configuration} from 'webpack';

import {Workspace, Service} from '@sewing-kit/core';
import {BuildServiceConfigurationHooks} from '@sewing-kit/types';
import {MissingPluginError} from '@sewing-kit/plugin-utilities';
import {} from '@sewing-kit/plugin-webpack';

export const PLUGIN = 'SewingKit.web-app-base';

export async function createWebpackConfig(
  buildHooks: BuildServiceConfigurationHooks,
  service: Service,
  workspace: Workspace,
  explicitConfig: Configuration = {},
) {
  if (
    buildHooks.webpackConfig == null ||
    buildHooks.webpackPlugins == null ||
    buildHooks.webpackRules == null
  ) {
    throw new MissingPluginError('@sewing-kit/plugin-webpack');
  }

  const rules = await buildHooks.webpackRules.promise([]);
  const plugins = await buildHooks.webpackPlugins.promise([]);
  const extensions = await buildHooks.extensions.promise([]);
  const outputPath = await buildHooks.output.promise(workspace.fs.buildPath());
  const filename = await buildHooks.filename.promise('main.js');

  return buildHooks.webpackConfig.promise({
    target: 'node',
    entry: await buildHooks.entries.promise([service.entry]),
    resolve: {extensions},
    module: {rules},
    output: {
      path: outputPath,
      filename,
      libraryTarget: 'commonjs2',
      publicPath: '/assets/',
    },
    plugins,
    ...explicitConfig,
  });
}
