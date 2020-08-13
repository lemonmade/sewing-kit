import {
  Runtime,
  Package,
  createProjectBuildPlugin,
  createProjectTestPlugin,
} from '@sewing-kit/plugins';
import {
  ExportStyle,
  createCompileBabelStep,
  updateSewingKitBabelPreset,
} from '@sewing-kit/plugin-javascript';

import {} from '@sewing-kit/plugin-jest';

const PLUGIN = 'SewingKit.PackageNode';
const VARIANT = 'node';
const EXTENSION = '.node';

declare module '@sewing-kit/hooks' {
  interface BuildPackageTargetOptions {
    [VARIANT]: boolean;
  }
}

export function nodeOutput() {
  return createProjectTestPlugin(`${PLUGIN}.Consumer`, ({hooks}) => {
    hooks.configure.hook((hooks) => {
      hooks.jestExtensions?.hook((extensions) => [EXTENSION, ...extensions]);
    });
  });
}

export function buildNodeOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {
      api,
      hooks,
      project,
      options: {cache},
    } = context;

    hooks.targets.hook((targets) =>
      targets.map((target) => {
        if (!target.default) return target;

        // If all the entries already target node, there is no need to do a
        // node-only build (it will match the CommonJS build).
        if (
          target.runtime.includes(Runtime.Node) &&
          target.runtime.runtimes.size === 1
        ) {
          return target;
        }

        return target.add({node: true});
      }),
    );

    hooks.target.hook(({target, hooks}) => {
      if (!target.options.node) return;

      hooks.configure.hook((configurationHooks) => {
        configurationHooks.babelConfig?.hook(
          updateSewingKitBabelPreset({
            polyfill: 'inline',
            modules: 'commonjs',
            target: 'node',
          }),
        );
      });

      hooks.steps.hook((steps, configuration) => {
        const outputPath = project.fs.buildPath('node');

        return [
          ...steps,
          createCompileBabelStep({
            api,
            project,
            outputPath,
            configuration,
            configFile: 'babel.node.js',
            exportStyle: ExportStyle.CommonJs,
            cache,
          }),
        ];
      });
    });
  });
}
