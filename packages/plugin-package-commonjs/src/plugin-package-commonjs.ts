import {Package, Runtime, createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  ExportStyle,
  updateSewingKitBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-javascript';

const PLUGIN = 'SewingKit.PackageCommonJs';
const VARIANT = 'commonjs';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

const setCommonJsModules = updateSewingKitBabelPreset({
  modules: 'commonjs',
  polyfill: 'usage',
});

const setNodeTarget = updateSewingKitBabelPreset({
  target: 'node',
  polyfill: 'usage',
});

export function buildCommonJsOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {api, hooks, project} = context;

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
        createCompileBabelStep({
          api,
          project,
          configuration,
          outputPath,
          configFile: 'babel.cjs.js',
          exportStyle: ExportStyle.CommonJs,
        }),
      ];
    });
  });
}
