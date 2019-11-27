import {resolve} from 'path';

import {createStep} from '@sewing-kit/ui';
import {BuildPackageConfigurationHooks} from '@sewing-kit/types';
import {Workspace, Package} from '@sewing-kit/core';
import {toArgs, MissingPluginError} from '@sewing-kit/plugin-utilities';

import {BabelConfig} from './types';

const PRESET_MATCHER = /(babel-preset-shopify(?:\/[^.]*)?)/;

function normalizePreset(preset: string) {
  const match = preset.match(PRESET_MATCHER);
  return match ? match[1].replace('/index', '') : preset;
}

function createCheck(test: string | string[]) {
  return (preset: string) => {
    const normalized = normalizePreset(preset);
    return typeof test === 'string'
      ? test === normalized
      : test.some((test) => test === normalized);
  };
}

export function changeBabelPreset(from: string | string[], to: string) {
  const check = createCheck(from);

  return ({presets = []}: BabelConfig) => {
    for (const [index, preset] of presets.entries()) {
      if (typeof preset === 'string') {
        if (check(preset)) {
          presets[index] = to;
        }
      } else if (check(preset[0])) {
        preset[0] = to;
      }
    }
  };
}

export function updateBabelPreset(match: string | string[], options: object) {
  const check = createCheck(match);

  return ({presets = []}: BabelConfig) => {
    for (const [index, preset] of presets.entries()) {
      if (typeof preset === 'string') {
        if (check(preset)) {
          presets[index] = [preset, options];
        }
      } else if (check(preset[0])) {
        preset[1] = {...preset[1], ...options};
      }
    }
  };
}

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

    if (config.babelConfig == null) {
      throw new MissingPluginError('@sewing-kit/plugin-babel');
    }

    await workspace.internal.write(
      babelConfigPath,
      `module.exports=${JSON.stringify(
        await config.babelConfig.promise({presets: []}),
      )};`,
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
        },
        {dasherize: true},
      ),
    ]);
  });
}
