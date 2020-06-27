import {createProjectPlugin} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-webpack';

export function vscode() {
  return createProjectPlugin('SewingKit.VSCode', ({tasks: {dev, build}}) => {
    // TODO: need a debug option on build/ dev
    // TODO: need an output hook/ plugin in webpack
    build.hook(({hooks}) => {
      hooks.target.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.webpackConfig?.hook((config) => {
            return {
              ...config,
              output: {
                ...config.output,
                devtoolModuleFilenameTemplate: '[absolute-resource-path]',
                devtoolFallbackModuleFilenameTemplate:
                  '[absolute-resource-path]?[hash]',
              },
            };
          });
        });
      });
    });

    dev.hook(({hooks}) => {
      hooks.configure.hook((configure) => {
        configure.webpackConfig?.hook((config) => {
          return {
            ...config,
            output: {
              ...config.output,
              devtoolModuleFilenameTemplate: '[absolute-resource-path]',
              devtoolFallbackModuleFilenameTemplate:
                '[absolute-resource-path]?[hash]',
            },
          };
        });
      });
    });
  });
}
