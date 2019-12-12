import {dirname, basename} from 'path';

import {pathExists} from 'fs-extra';
import {DiagnosticError} from '@sewing-kit/ui';
import {Target as BabelTarget} from '@sewing-kit/babel-preset';

import {
  ConfigurationBuilderResult,
  BUILDER_RESULT_MARKER,
  ConfigurationKind,
} from './base';

export {ConfigurationKind, ConfigurationBuilderResult};

const DIRECTORIES_NOT_TO_USE_FOR_NAME = new Set([
  'src',
  'lib',
  'server',
  'app',
  'client',
  'ui',
]);

const IS_TSX = /.tsx?$/;
const IS_MJS = /.mjs$/;

export async function loadConfig<
  T extends {name: string; root: string} = {name: string; root: string}
>(file: string) {
  if (!(await pathExists(file))) {
    throw new DiagnosticError({
      title: `No config file found at ${file}`,
      suggestion:
        'Make sure you have specified the --config flag to point at a valid workspace config file.',
    });
  }

  if (IS_TSX.test(file)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@babel/register')({
      extensions: ['.mjs', '.js', '.ts', '.tsx'],
      presets: [
        require.resolve('@babel/preset-typescript'),
        [
          require.resolve('@sewing-kit/babel-preset'),
          {target: BabelTarget.Node},
        ],
      ],
    });

    return loadConfigFile<T>(file);
  }

  if (IS_MJS.test(file)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@babel/register')({
      extensions: ['.mjs', '.js'],
      presets: [
        [
          require.resolve('@sewing-kit/babel-preset'),
          {target: BabelTarget.Node},
        ],
      ],
    });

    return loadConfigFile<T>(file);
  }

  return loadConfigFile<T>(file);
}

async function loadConfigFile<T extends {name: string; root: string}>(
  file: string,
): Promise<ConfigurationBuilderResult<T> & {readonly file: string}> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const exports = require(file);
  const normalized = exports?.default ?? exports;

  if (normalized == null) {
    throw new DiagnosticError({
      title: 'Invalid configuration file',
      content: `The configuration file ${file} did not export any configuration`,
      suggestion: file.endsWith('.ts')
        ? `Ensure that you are exporting the result of calling a function from @sewing-kit/config as the default export, then run your command again.`
        : `Ensure that you are setting the result of calling a function from @sewing-kit/config to module.exports, then run your command again.`,
    });
  } else if (typeof normalized !== 'function') {
    throw new DiagnosticError({
      title: 'Invalid configuration file',
      content: `The configuration file ${file} did not export a function`,
      suggestion: `Ensure that you are exporting the result of calling a function from @sewing-kit/config, then run your command again.`,
    });
  }

  const result = await normalized();

  if (!looksLikeValidConfigurationObject(result)) {
    throw new DiagnosticError({
      title: 'Invalid configuration file',
      content: `The configuration file ${file} did not export a function that creates a configuration object`,
      suggestion: `Ensure that you are exporting the result of calling a function from @sewing-kit/config, then run your command again.`,
    });
  }

  const configDir = dirname(file);
  const configDirName = basename(configDir);
  const name = DIRECTORIES_NOT_TO_USE_FOR_NAME.has(configDirName)
    ? basename(dirname(configDir))
    : configDirName;

  return {
    ...result,
    file,
    options: {root: configDir, name, ...(result.options as any)},
  };
}

function looksLikeValidConfigurationObject(
  value: unknown,
): value is ConfigurationBuilderResult {
  return (
    typeof value === 'object' && value != null && BUILDER_RESULT_MARKER in value
  );
}
