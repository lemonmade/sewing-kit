import {
  Package,
  Service,
  WebApp,
  createComposedWorkspacePlugin,
  createComposedProjectPlugin,
  createProjectPlugin,
} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-webpack';

export function webpackBuilds() {
  return createProjectPlugin('SewingKit.VSCode', ({tasks: {dev, build}}) => {
    // TODO: need a debug option on build/ dev
    // TODO: need an output hook/ plugin in webpack
    build.hook(({hooks}) => {
      hooks.configure.hook((configure) => {
        configure.webpackConfig.hook((config) => {
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

    dev.hook(({hooks}) => {
      hooks.configure.hook((configure) => {
        configure.webpackConfig.hook((config) => {
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

function webpackConfiguration() {
  return createProjectPlugin(
    'SewingKit.WebpackBuilds.Configuration',
    ({project, tasks}) => {
      tasks.build.hook(({hooks}) => {});
    },
  );
}
