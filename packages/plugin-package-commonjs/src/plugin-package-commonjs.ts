import {Package, Runtime, createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  ExportStyle,
  updateSewingKitBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-javascript';

const PLUGIN = 'SewingKit.PackageCommonJs';
const VARIANT = 'commonjs';

declare module '@sewing-kit/hooks' {
  interface BuildPackageTargetOptions {
    [VARIANT]: boolean;
  }
}

const setCommonJsModules = updateSewingKitBabelPreset({
  polyfill: 'inline',
  modules: 'commonjs',
});

const setNodeTarget = updateSewingKitBabelPreset({
  polyfill: 'inline',
  modules: 'commonjs',
  target: 'node',
});

export function buildCommonJsOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {
      api,
      hooks,
      project,
      options: {cache},
    } = context;

    hooks.targets.hook((targets) =>
      targets.map((target) =>
        target.default ? target.add({commonjs: true}) : target,
      ),
    );

    hooks.target.hook(({target, hooks}) => {
      if (!target.options.commonjs) return;

      hooks.configure.hook((configuration) => {
        configuration.babelConfig?.hook((babelConfig) => {
          const allEntriesAreNode =
            target.runtime.includes(Runtime.Node) &&
            target.runtime.runtimes.size === 1;

          return allEntriesAreNode
            ? setNodeTarget(babelConfig)
            : setCommonJsModules(babelConfig);
        });
      });

      hooks.steps.hook((steps, configuration) => {
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
            cache,
          }),
        ];
      });
    });
  });
}
