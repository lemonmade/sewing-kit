import {createHash} from 'crypto';
import nodeObjectHash from 'node-object-hash';

import {Env, Project} from '@sewing-kit/plugins';
import {BabelConfig} from '@sewing-kit/plugin-babel';
import {
  Module as BaseBabelPresetModule,
  Polyfill as BaseBabelPresetPolyfill,
  Target as BaseBabelPresetTarget,
} from '@sewing-kit/babel-preset';

import type {Options as BaseBabelPresetOptions} from '@sewing-kit/babel-preset';

export type {BaseBabelPresetOptions};
export {BaseBabelPresetModule, BaseBabelPresetPolyfill, BaseBabelPresetTarget};

const resolvedPreset = require.resolve('@sewing-kit/babel-preset');

export function changeBaseJavaScriptBabelPreset(
  options: BaseBabelPresetOptions,
) {
  return (config: BabelConfig): BabelConfig => ({
    ...config,
    presets: config.presets?.map((preset) => {
      if (preset === resolvedPreset) {
        return [preset as string, options];
      } else if (Array.isArray(preset) && preset[0] === resolvedPreset) {
        return [preset[0], {...preset[1], ...options}];
      } else {
        return preset;
      }
    }),
  });
}

export async function createJavaScriptWebpackRuleSet({
  env,
  project,
  configuration,
  cacheDirectory: cacheDirectoryName,
  cacheDependencies: initialCacheDependencies = [],
}: {
  env: Env;
  project: Project;
  configuration:
    | import('@sewing-kit/hooks').BuildProjectConfigurationHooks
    | import('@sewing-kit/hooks').DevProjectConfigurationHooks;
  cacheDirectory: string;
  cacheDependencies?: string[];
}) {
  const [
    babelOptions = {},
    babelCacheDependencies = [],
    cacheDirectory,
  ] = await Promise.all([
    configuration.babelConfig?.run({}),
    configuration.babelCacheDependencies?.run([
      '@babel/core',
      ...initialCacheDependencies,
    ]),
    configuration.webpackCachePath!.run(cacheDirectoryName),
  ] as const);

  return [
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory,
        cacheIdentifier: babelCacheIdentifier(
          env,
          project,
          babelOptions,
          babelCacheDependencies,
        ),
        ...babelOptions,
      },
    },
  ];
}

function babelCacheIdentifier(
  env: Env,
  project: Project,
  babelOptions: BabelConfig,
  dependencies: readonly string[],
) {
  const optionsHash = nodeObjectHash().hash(babelOptions);
  const prefix = `sk:${env}:`;
  const dependencyString = ['webpack', ...dependencies]
    .map(
      (dependency) =>
        `${dependency}:${
          project.dependency(dependency)?.version || 'notinstalled'
        }`,
    )
    .join('&');

  return `${prefix}${createHash('md5')
    .update(dependencyString)
    .digest('hex')}@${optionsHash}`;
}
