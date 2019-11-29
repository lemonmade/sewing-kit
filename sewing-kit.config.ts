import {createWorkspace} from '@sewing-kit/config';
import {
  composePlugins,
  createPlugin,
  PluginTarget,
} from '@sewing-kit/plugin-utilities';
import babel from '@sewing-kit/plugin-babel';
import eslint from '@sewing-kit/plugin-eslint';
import json from '@sewing-kit/plugin-json';
import javascript from '@sewing-kit/plugin-javascript';
import typescript from '@sewing-kit/plugin-typescript';
import jest from '@sewing-kit/plugin-jest';
import packageBase from '@sewing-kit/plugin-package-base';
import packageBinaries from '@sewing-kit/plugin-package-binaries';
import packageCommonJS from '@sewing-kit/plugin-package-commonjs';
import packageEsnext from '@sewing-kit/plugin-package-esnext';
import packageTypeScript from '@sewing-kit/plugin-package-typescript';

const REMOVE_SOURCE_MAPPING_PLUGIN =
  'SewingKit.removeTestSourceMappingForBabelPreset';

const plugin = composePlugins('SewingKit.self', [
  babel,
  eslint,
  jest,
  json,
  javascript,
  typescript,
  packageBase,
  packageBinaries,
  packageCommonJS,
  packageEsnext,
  packageTypeScript,
  createRemoveSourceMappingPlugin(),
]);

export default createWorkspace((workspace) => {
  workspace.plugin(plugin);
});

// We use the internal babel preset to compile tests. As part of bootstrap,
// we already handle this package a bit differently; we build its source
// so a valid CommonJS representation exists for Babel to use. This is the
// last part of that: the jest plugin automatically adds a module name
// mapper for the package to map the module to its source, but that will
// also catch the attempted use of the plugin for Babel compiling the
// tests, which won't work because it's the source, not CommonJS. This
// just removes the name mapping so any references to this package
// point at the compiled output, which is a sloppy but workable solution.
function createRemoveSourceMappingPlugin() {
  return createPlugin(
    {id: REMOVE_SOURCE_MAPPING_PLUGIN, target: PluginTarget.Root},
    ({test}) => {
      test.tap(REMOVE_SOURCE_MAPPING_PLUGIN, ({hooks}) => {
        hooks.project.tap(REMOVE_SOURCE_MAPPING_PLUGIN, ({hooks}) => {
          hooks.configure.tap(
            REMOVE_SOURCE_MAPPING_PLUGIN,
            ({jestModuleMapper}) => {
              jestModuleMapper?.tap(
                REMOVE_SOURCE_MAPPING_PLUGIN,
                ({'@sewing-kit/babel-preset$': _, ...rest}) => rest,
              );
            },
          );
        });
      });
    },
  );
}
