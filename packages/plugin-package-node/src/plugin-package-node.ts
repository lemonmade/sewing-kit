import {
  Runtime,
  Package,
  createProjectBuildPlugin,
  createProjectTestPlugin,
} from '@sewing-kit/plugins';
import {
  createWriteEntriesStep,
  ExportStyle,
} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
  BaseBabelPresetTarget,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-jest';

const PLUGIN = 'SewingKit.PackageNode';
const VARIANT = 'node';
const EXTENSION = '.node';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
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
    const {api, hooks, project} = context;

    hooks.variants.hook((variants) => {
      // If all the entries already target node, there is no need to do a
      // node-only build (it will match the CommonJS build).
      if (project.entries.every(({runtime}) => runtime === Runtime.Node)) {
        return variants;
      }

      return [...variants, {[VARIANT]: true}];
    });

    hooks.configure.hook((configurationHooks, {node}) => {
      if (!node) {
        return;
      }

      configurationHooks.babelConfig?.hook(
        changeBaseJavaScriptBabelPreset({
          modules: BaseBabelPresetModule.CommonJs,
          target: BaseBabelPresetTarget.Node,
        }),
      );
    });

    hooks.steps.hook((steps, {configuration, variant: {node}}) => {
      if (!node) {
        return steps;
      }

      const outputPath = project.fs.buildPath('node');

      return [
        ...steps,
        createCompileBabelStep({
          api,
          project,
          outputPath,
          configuration,
          configFile: 'babel.node.js',
        }),
        createWriteEntriesStep(context, {
          outputPath,
          exportStyle: ExportStyle.CommonJs,
          extension: EXTENSION,
        }),
      ];
    });
  });
}
