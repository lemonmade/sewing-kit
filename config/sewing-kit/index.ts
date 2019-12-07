import {createComposedProjectPlugin} from '@sewing-kit/plugins';
import {babelProjectPlugin} from '@sewing-kit/plugin-babel';
import {jestProjectPlugin} from '@sewing-kit/plugin-jest';
import {javascriptProjectPlugin} from '@sewing-kit/plugin-javascript';
import {typeScriptProjectPlugin} from '@sewing-kit/plugin-typescript';
import {createPackageFlexibleOutputsPlugin} from '@sewing-kit/plugin-package-flexible-outputs';

export const createSewingKitPackagePlugin = ({typesAtRoot = false} = {}) =>
  createComposedProjectPlugin('SewingKit.InternalPackage', [
    babelProjectPlugin,
    jestProjectPlugin,
    javascriptProjectPlugin,
    typeScriptProjectPlugin,
    createPackageFlexibleOutputsPlugin({
      node: false,
      typescript: {typesAtRoot},
    }),
  ]);

// We use the internal babel preset to compile tests. As part of bootstrap,
// we already handle this package a bit differently; we build its source
// so a valid CommonJS representation exists for Babel to use. This is the
// last part of that: the jest plugin automatically adds a module name
// mapper for the package to map the module to its source, but that will
// also catch the attempted use of the plugin for Babel compiling the
// tests, which won't work because it's the source, not CommonJS. This
// just removes the name mapping so any references to this package
// point at the compiled output, which is a sloppy but workable solution.

// function createRemoveSourceMappingPlugin() {
//   return createProjectTestPlugin(REMOVE_SOURCE_MAPPING_PLUGIN, ({hooks}) => {
//     hooks.project.tap(REMOVE_SOURCE_MAPPING_PLUGIN, ({hooks}) => {
//       hooks.configure.tap(
//         REMOVE_SOURCE_MAPPING_PLUGIN,
//         ({jestModuleMapper}) => {
//           jestModuleMapper?.tap(
//             REMOVE_SOURCE_MAPPING_PLUGIN,
//             ({'@sewing-kit/babel-preset$': _, ...rest}) => rest,
//           );
//         },
//       );
//     });
//   });
// }
