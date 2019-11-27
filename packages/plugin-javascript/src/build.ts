import {produce} from 'immer';
import {BabelConfig} from '@sewing-kit/plugin-babel';
import {PLUGIN} from './common';

// Just loaded for its hook augmentations
import {} from '@sewing-kit/plugin-webpack';

function addBaseBabelPreset(babelConfig: BabelConfig) {
  return produce(babelConfig, (babelConfig) => {
    babelConfig.presets = babelConfig.presets || [];
    babelConfig.presets.push('babel-preset-shopify');
  });
}

function addNodeBabelPreset(babelConfig: BabelConfig) {
  return produce(babelConfig, (babelConfig) => {
    babelConfig.presets = babelConfig.presets || [];
    babelConfig.presets.push('babel-preset-shopify/node');
  });
}

function addJsExtensions(extensions: string[]) {
  return ['.js', '.mjs', ...extensions];
}

export default function buildJavaScript({
  hooks,
}: import('@sewing-kit/core').BuildTask) {
  hooks.package.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, addBaseBabelPreset);
      }

      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);
    });
  });

  hooks.webApp.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);

      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, addBaseBabelPreset);
      }

      if (configurationHooks.webpackRules) {
        configurationHooks.webpackRules.tapPromise(PLUGIN, async (rules) => {
          const options =
            configurationHooks.babelConfig &&
            (await configurationHooks.babelConfig.promise({}));

          return produce(rules, (rules) => {
            rules.push({
              test: /\.m?js/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options,
            });
          });
        });
      }
    });
  });

  hooks.service.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.extensions.tap(PLUGIN, addJsExtensions);

      if (configurationHooks.babelConfig) {
        configurationHooks.babelConfig.tap(PLUGIN, addNodeBabelPreset);
      }

      if (configurationHooks.webpackRules) {
        configurationHooks.webpackRules.tapPromise(PLUGIN, async (rules) => {
          const options =
            configurationHooks.babelConfig &&
            (await configurationHooks.babelConfig.promise({}));

          return produce(rules, (rules) => {
            rules.push({
              test: /\.m?js/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              options,
            });
          });
        });
      }
    });
  });
}
