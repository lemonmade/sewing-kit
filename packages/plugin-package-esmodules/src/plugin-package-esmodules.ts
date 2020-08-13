import {
  WebApp,
  Service,
  Package,
  createProjectPlugin,
  createProjectBuildPlugin,
} from '@sewing-kit/plugins';
import {
  ExportStyle,
  updateSewingKitBabelPreset,
  createCompileBabelStep,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-webpack';
import {} from '@sewing-kit/hooks';

const PLUGIN = 'SewingKit.PackageEsModules';
const VARIANT = 'esmodules';

declare module '@sewing-kit/hooks' {
  interface BuildPackageTargetOptions {
    [VARIANT]: boolean;
  }
}

const updateBabelPreset = updateSewingKitBabelPreset({
  polyfill: 'inline',
  modules: 'preserve',
});

export function esmodulesOutput() {
  return createProjectPlugin<WebApp | Service>(
    `${PLUGIN}.Consumer`,
    ({tasks: {build, dev}}) => {
      build.hook(({hooks}) => {
        hooks.target.hook(({hooks}) => {
          hooks.configure.hook((configuration) => {
            configuration.webpackRules?.hook(addWebpackRule);
            configuration.webpackExtensions?.hook(addExtension);
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook((configuration) => {
          configuration.webpackRules?.hook(addWebpackRule);
          configuration.webpackExtensions?.hook(addExtension);
        });
      });
    },
  );
}

export function buildEsModulesOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {
      api,
      hooks,
      project,
      options: {cache},
    } = context;

    hooks.targets.hook((targets) =>
      targets.map((target) =>
        target.default ? target.add({esmodules: true}) : target,
      ),
    );

    hooks.target.hook(({target, hooks}) => {
      if (!target.options.esmodules) return;

      hooks.configure.hook((configuration) => {
        configuration.babelConfig?.hook(updateBabelPreset);
      });

      hooks.steps.hook((steps, configuration) => {
        const outputPath = project.fs.buildPath('esm');

        return [
          ...steps,
          createCompileBabelStep({
            api,
            project,
            configuration,
            outputPath,
            extension: '.mjs',
            configFile: 'babel.esm.js',
            exportStyle: ExportStyle.EsModules,
            cache,
          }),
        ];
      });
    });
  });
}

function addExtension(extensions: readonly string[]): readonly string[] {
  return ['.mjs', ...extensions];
}

function addWebpackRule(rules: readonly any[]) {
  return [
    ...rules,
    {
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    },
  ];
}
