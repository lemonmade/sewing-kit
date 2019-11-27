import {join} from 'path';
import {pathExists} from 'fs-extra';
import {Plugin, PluginTarget, PLUGIN} from '@sewing-kit/types';
import {DiagnosticError} from '@sewing-kit/ui';

export async function loadConfig<T = any>(
  root: string,
  {allowRootPlugins = false} = {},
): Promise<Partial<T>> {
  if (await pathExists(join(root, 'sewing-kit.config.js'))) {
    return loadConfigFile(join(root, 'sewing-kit.config.js'), {
      allowRootPlugins,
    });
  }

  if (await pathExists(join(root, 'sewing-kit.config.ts'))) {
    require('@babel/register')({
      extensions: ['.mjs', '.js', '.ts', '.tsx'],
      presets: [['babel-preset-shopify/node', {typescript: true}]],
    });

    return loadConfigFile(join(root, 'sewing-kit.config.ts'), {
      allowRootPlugins,
    });
  }

  return {} as any;
}

async function loadConfigFile(file: string, {allowRootPlugins = false}) {
  // eslint-disable-next-line typescript/no-var-requires
  const exports = require(file);
  const normalized = (exports && exports.default) || exports;

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

  const {plugins = []} = result as {plugins?: Plugin[]};

  if (plugins.some((plugin) => !plugin[PLUGIN])) {
    throw new DiagnosticError({
      title: 'Invalid configuration file',
      content: `The configuration file ${file} contains invalid plugins`,
      suggestion: `Make sure that all plugins included in the configuration file were generated using createPlugin from @sewing-kit/plugin-utilities. If this is the case, you may have duplicate versions of some @sewing-kit dependencies. Resolve any duplicate versions and try your command again.`,
    });
  }

  if (!allowRootPlugins) {
    if (plugins.some((plugin) => plugin.target === PluginTarget.Root)) {
      throw new DiagnosticError({
        title: 'Invalid configuration file',
        content: `The configuration file ${file} specifies plugins targeted at root, which is not supported for project-level configuration`,
        suggestion: `Move any "root plugins" to the sewing-kit.config file at the root of your repository. Your project’s configuration may only contain plugins that target project-level hooks.`,
      });
    }
  }

  return result;
}

function looksLikeValidConfigurationObject(value: unknown) {
  return (
    typeof value === 'object' &&
    value != null &&
    (!('plugins' in value) || Array.isArray((value as any).plugins))
  );
}
