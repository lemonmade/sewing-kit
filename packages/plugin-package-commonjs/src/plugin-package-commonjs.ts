import {Package, Runtime, createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  createWriteEntriesStep,
  ExportStyle,
} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetModule,
  BaseBabelPresetTarget,
  BaseBabelPresetPolyfill,
} from '@sewing-kit/plugin-javascript';

const PLUGIN = 'SewingKit.PackageCommonJs';
const VARIANT = 'commonjs';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

const setCommonJsModules = changeBaseJavaScriptBabelPreset({
  modules: BaseBabelPresetModule.CommonJs,
  polyfill: BaseBabelPresetPolyfill.Usage,
});

const setNodeTarget = changeBaseJavaScriptBabelPreset({
  target: BaseBabelPresetTarget.Node,
  polyfill: BaseBabelPresetPolyfill.Usage,
});

export function buildCommonJsOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {hooks, project} = context;

    hooks.variants.hook((variants) => [...variants, {[VARIANT]: true}]);

    hooks.configure.hook((configurationHooks, {commonjs}) => {
      if (!commonjs) {
        return;
      }

      configurationHooks.babelConfig?.hook((babelConfig) => {
        const allEntriesAreNode = project.entries.every(
          ({runtime}) => runtime === Runtime.Node,
        );

        return allEntriesAreNode
          ? setNodeTarget(babelConfig)
          : setCommonJsModules(babelConfig);
      });
    });

    hooks.steps.hook((steps, {configuration, variant: {commonjs}}) => {
      if (!commonjs) {
        return steps;
      }

      const outputPath = project.fs.buildPath('cjs');

      return [
        ...steps,
        createCompileBabelStep(context, configuration, {
          outputPath,
          configFile: 'babel.cjs.js',
        }),
        createWriteEntriesStep(context, {
          outputPath,
          exportStyle: ExportStyle.CommonJs,
          extension: '.js',
        }),
      ];
    });
  });
}
