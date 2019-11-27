import {produce} from 'immer';
import {updateBabelPreset, BabelConfig} from '@sewing-kit/plugin-babel';

import {PLUGIN} from './common';

// Just loaded for its hook augmentations
import {} from '@sewing-kit/plugin-webpack';

function addTsExtensions(extensions: string[]) {
  return ['.ts', '.tsx', ...extensions];
}

const setTypescriptPreset = produce(
  updateBabelPreset(
    [
      'babel-preset-shopify',
      'babel-preset-shopify/web',
      'babel-preset-shopify/node',
    ],
    {typescript: true},
  ),
);

const addTypescriptPlugins = produce((babelConfig: BabelConfig) => {
  babelConfig.plugins = babelConfig.plugins ?? [];

  if (
    !babelConfig.plugins!.includes('@babel/plugin-proposal-optional-chaining')
  ) {
    babelConfig.plugins!.push('@babel/plugin-proposal-optional-chaining');
  }

  if (
    !babelConfig.plugins!.includes(
      '@babel/plugin-proposal-nullish-coalescing-operator',
    )
  ) {
    babelConfig.plugins!.push(
      '@babel/plugin-proposal-nullish-coalescing-operator',
    );
  }

  return babelConfig;
});

const updateBabelPresets = (babelConfig: BabelConfig) => {
  return setTypescriptPreset(addTypescriptPlugins(babelConfig));
};

export default function buildTypescript({
  hooks,
}: import('@sewing-kit/core').BuildTask) {
  hooks.package.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);
      configurationHooks.babelConfig?.tap(PLUGIN, updateBabelPresets);
    });
  });

  hooks.webApp.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);
      configurationHooks.babelConfig?.tap(PLUGIN, updateBabelPresets);

      configurationHooks.webpackRules?.tapPromise(PLUGIN, async (rules) => {
        const options =
          configurationHooks.babelConfig &&
          (await configurationHooks.babelConfig.promise({}));

        return produce(rules, (rules) => {
          rules.push({
            test: /\.tsx?/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options,
          });
        });
      });
    });
  });

  hooks.service.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addTsExtensions);
      configurationHooks.babelConfig?.tap(PLUGIN, updateBabelPresets);

      configurationHooks.webpackRules?.tapPromise(PLUGIN, async (rules) => {
        const options =
          configurationHooks.babelConfig &&
          (await configurationHooks.babelConfig.promise({}));

        return produce(rules, (rules) => {
          rules.push({
            test: /\.tsx?/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options,
          });
        });
      });
    });
  });
}
