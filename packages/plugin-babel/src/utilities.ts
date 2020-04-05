import {resolve} from 'path';

import type {BuildPackageConfigurationHooks} from '@sewing-kit/hooks';
import {
  toArgs,
  Package,
  PluginApi,
  MissingPluginError,
} from '@sewing-kit/plugins';

interface CompileBabelOptions {
  readonly api: PluginApi;
  readonly project: Package;
  readonly configuration: BuildPackageConfigurationHooks;
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
        throw new MissingPluginError('@sewing-kit/plugin-babel');
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
        configuration.babelExtensions!.run([]),
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
