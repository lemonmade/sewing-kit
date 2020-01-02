import {resolve} from 'path';
import {rename} from 'fs-extra';
import {sync as glob} from 'glob';

import {BuildPackageConfigurationHooks} from '@sewing-kit/hooks';
import {
  toArgs,
  Package,
  MissingPluginError,
  ProjectPluginContext,
} from '@sewing-kit/plugins';

interface CompileBabelOptions {
  readonly configFile: string;
  readonly outputPath: string;
  readonly extension?: string;
}

export function createCompileBabelStep(
  {project: pkg, api}: Pick<ProjectPluginContext<Package>, 'project' | 'api'>,
  config: BuildPackageConfigurationHooks,
  options: CompileBabelOptions,
) {
  return api.createStep(
    {id: 'Babel.Compile', label: 'compile with babel'},
    async (step) => {
      const {configFile = 'babel.js', outputPath, extension} = options;

      const babelConfigPath = api.configPath(
        `build/packages/${pkg.name}/${configFile}`,
      );

      if (
        config.babelConfig == null ||
        config.babelIgnorePatterns == null ||
        config.babelExtensions == null
      ) {
        throw new MissingPluginError('@sewing-kit/plugin-babel');
      }

      const [babelConfig, babelIgnorePatterns] = await Promise.all([
        config.babelConfig.run({}),
        config.babelIgnorePatterns.run([]),
      ]);

      await api.write(
        babelConfigPath,
        `module.exports=${JSON.stringify(babelConfig)};`,
      );

      const extensions = await config.babelExtensions.run([]);
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
            ignore:
              babelIgnorePatterns.length > 0
                ? babelIgnorePatterns.join(',')
                : undefined,
          },
          {dasherize: true},
        ),
      ]);

      if (extension) {
        const replaceJsWith = extension.startsWith('.')
          ? extension
          : `.${extension}`;

        await Promise.all(
          glob('**/*.js', {cwd: outputPath, absolute: true}).map((file) =>
            rename(file, file.replace(/\.js$/, replaceJsWith)),
          ),
        );
      }
    },
  );
}
