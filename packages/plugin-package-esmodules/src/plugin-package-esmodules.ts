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
  interface BuildPackageOptions {
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
        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook(addWebpackRule);
            configure.webpackExtensions?.hook(addExtension);
          },
        );
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(
          (
            configure: Partial<
              import('@sewing-kit/hooks').BuildWebAppConfigurationHooks &
                import('@sewing-kit/hooks').BuildServiceConfigurationHooks
            >,
          ) => {
            configure.webpackRules?.hook(addWebpackRule);
            configure.webpackExtensions?.hook(addExtension);
          },
        );
      });
    },
  );
}

export function buildEsModulesOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {api, hooks, project} = context;

    hooks.variants.hook((variants) => [...variants, {[VARIANT]: true}]);

    hooks.variant.hook(({variant: {esmodules}, hooks}) => {
      if (!esmodules) return;

      hooks.configure.hook((configuration) => {
        configuration.babelConfig?.hook(updateBabelPreset);
      });

      hooks.steps.hook((steps, configuration) => {
        if (!esmodules) {
          return steps;
        }

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
