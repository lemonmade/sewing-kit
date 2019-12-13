import {createProjectPlugin} from '@sewing-kit/plugins';
import {} from '@sewing-kit/plugin-jest';
import {} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.json';

function addJsonExtension(extensions: readonly string[]) {
  return ['.json', ...extensions];
}

export const jsonProjectPlugin = createProjectPlugin({
  id: PLUGIN,
  run({build, test}) {
    build.tap(PLUGIN, ({hooks}) => {
      hooks.package.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.babelExtensions?.tap(PLUGIN, addJsonExtension);
        });
      });

      hooks.webApp.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.webpackExtensions?.tap(PLUGIN, addJsonExtension);
        });
      });

      hooks.service.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (configurationHooks) => {
          configurationHooks.webpackExtensions?.tap(PLUGIN, addJsonExtension);
        });
      });
    });

    test.tap(PLUGIN, ({hooks}) => {
      hooks.project.tap(PLUGIN, ({hooks}) => {
        hooks.configure.tap(PLUGIN, (hooks) => {
          hooks.jestExtensions?.tap(PLUGIN, addJsonExtension);
        });
      });
    });
  },
});
