import {createProjectPlugin} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.Json';

function addJsonExtension(extensions: readonly string[]) {
  return ['.json', ...extensions];
}

export function json() {
  return createProjectPlugin(PLUGIN, ({tasks: {test, dev, build}}) => {
    test.hook(({hooks}) => {
      hooks.configure.hook((configure) => {
        configure.jestExtensions?.hook(addJsonExtension);
      });
    });

    build.hook(({hooks}) => {
      hooks.configure.hook(
        (
          configure: Partial<
            import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
              import('@sewing-kit/hooks').BuildServiceConfigurationHooks &
              import('@sewing-kit/hooks').BuildPackageConfigurationHooks
          >,
        ) => {
          configure.babelExtensions?.hook(addJsonExtension);
          configure.webpackExtensions?.hook(addJsonExtension);
        },
      );
    });

    dev.hook(({hooks}) => {
      hooks.configure.hook(
        (
          configure: Partial<
            import('@sewing-kit/hooks').DevWebAppConfigurationHooks &
              import('@sewing-kit/hooks').DevServiceConfigurationHooks &
              import('@sewing-kit/hooks').DevPackageConfigurationHooks
          >,
        ) => {
          configure.webpackExtensions?.hook(addJsonExtension);
        },
      );
    });
  });
}
