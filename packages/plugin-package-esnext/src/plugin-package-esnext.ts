import {
  Project,
  Package,
  createProjectPlugin,
  createProjectBuildPlugin,
  Env,
} from '@sewing-kit/plugins';
import {
  createWriteEntriesStep,
  ExportStyle,
} from '@sewing-kit/plugin-package-utilities';
import {createCompileBabelStep} from '@sewing-kit/plugin-babel';
import {
  BaseBabelPresetModule,
  changeBaseJavaScriptBabelPreset,
  createJavaScriptWebpackRuleSet,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.PackageEsNext';
const VARIANT = 'esnext';
const EXTENSION = '.esnext';

declare module '@sewing-kit/hooks' {
  interface BuildPackageOptions {
    [VARIANT]: boolean;
  }
}

export function esnextOutput() {
  return createProjectPlugin<Project>(
    `${PLUGIN}.Consumer`,
    ({project, tasks: {build, dev}}) => {
      build.hook(({hooks, options}) => {
        hooks.configure.hook((configure) => {
          configure.webpackExtensions?.hook(addExtension);
          configure.webpackRules?.hook(async (rules) => [
            ...rules,
            {
              test: /\.esnext/,
              include: /node_modules/,
              use: await createJavaScriptWebpackRuleSet({
                project,
                env: options.simulateEnv,
                configuration: configure,
                cacheDirectory: 'esnext',
              }),
            },
          ]);
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.webpackExtensions?.hook(addExtension);
          configure.webpackRules?.hook(async (rules) => [
            ...rules,
            {
              test: /\.esnext/,
              include: /node_modules/,
              use: await createJavaScriptWebpackRuleSet({
                project,
                env: Env.Development,
                configuration: configure,
                cacheDirectory: 'esnext',
              }),
            },
          ]);
        });
      });
    },
  );
}

export function buildEsNextOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {hooks, project} = context;

    hooks.variants.hook((variants) => [...variants, {[VARIANT]: true}]);

    hooks.configure.hook((configure, {esnext}) => {
      if (!esnext) {
        return;
      }

      configure.babelConfig?.hook(
        changeBaseJavaScriptBabelPreset({
          modules: BaseBabelPresetModule.Preserve,
          target: ['last 1 chrome version'],
        }),
      );
    });

    hooks.steps.hook((steps, {configuration, variant: {esnext}}) => {
      if (!esnext) {
        return steps;
      }

      const outputPath = project.fs.buildPath('esnext');

      return [
        ...steps,
        createCompileBabelStep(context, configuration, {
          outputPath,
          extension: EXTENSION,
          configFile: 'babel.esnext.js',
        }),
        createWriteEntriesStep(context, {
          outputPath,
          extension: EXTENSION,
          exportStyle: ExportStyle.EsModules,
        }),
      ];
    });
  });
}

function addExtension(extensions: readonly string[]): readonly string[] {
  return [EXTENSION, ...extensions];
}
