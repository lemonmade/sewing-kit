import {resolve} from 'path';

import {createStep} from '@sewing-kit/ui';
import {BuildPackageConfigurationHooks} from '@sewing-kit/types';
import {Workspace, Package} from '@sewing-kit/core';
import {toArgs, MissingPluginError} from '@sewing-kit/plugin-utilities';

interface CompileBabelOptions {
  configFile: string;
  outputPath: string;
}

export function createCompileBabelStep(
  pkg: Package,
  workspace: Workspace,
  config: BuildPackageConfigurationHooks,
  options: CompileBabelOptions,
) {
  return createStep(async (step) => {
    const {configFile = 'babel.js', outputPath} = options;

    const babelConfigPath = workspace.internal.configPath(
      `build/packages/${pkg.name}/${configFile}`,
    );

    if (config.babelConfig == null || config.babelIgnorePatterns == null) {
      throw new MissingPluginError('@sewing-kit/plugin-babel');
    }

    const [babelConfig, babelIgnorePatterns] = await Promise.all([
      config.babelConfig.promise({}),
      config.babelIgnorePatterns.promise([]),
    ]);

    await workspace.internal.write(
      babelConfigPath,
      `module.exports=${JSON.stringify(babelConfig)};`,
    );

    const extensions = await config.extensions.promise([]);
    const sourceRoot = resolve(pkg.root, 'src');

    await step.exec('node_modules/.bin/babel', [
      sourceRoot,
      ...toArgs(
        {
          outDir: outputPath,
          configFile: babelConfigPath,
          verbose: true,
          noBabelrc: true,
          babelConfig: false,
          extensions: extensions.join(','),
          ignore: babelIgnorePatterns.join(','),
        },
        {dasherize: true},
      ),
    ]);
  });
}
