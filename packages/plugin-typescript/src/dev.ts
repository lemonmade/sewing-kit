import {produce} from 'immer';

import {addTypeScriptBabelConfig} from './utilities';
import {PLUGIN} from './common';

// Just loaded for its hook augmentations
import {} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-webpack';

function addTsExtensions(extensions: readonly string[]) {
  return ['.ts', '.tsx', ...extensions];
}

export function devTypeScript({
  hooks,
}: import('@sewing-kit/tasks').DevProjectTask) {
  hooks.webApp.tap(PLUGIN, ({hooks}) => {
    hooks.configure.tap(PLUGIN, (configurationHooks) => {
      configurationHooks.webpackExtensions?.tap(PLUGIN, addTsExtensions);
      configurationHooks.babelConfig?.tap(PLUGIN, addTypeScriptBabelConfig);

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
      configurationHooks.webpackExtensions?.tap(PLUGIN, addTsExtensions);
      configurationHooks.babelConfig?.tap(PLUGIN, addTypeScriptBabelConfig);

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
