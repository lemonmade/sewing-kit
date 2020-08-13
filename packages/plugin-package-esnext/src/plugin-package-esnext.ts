import {
  Project,
  Package,
  createProjectPlugin,
  createProjectBuildPlugin,
  Env,
  Runtime,
  TargetRuntime,
} from '@sewing-kit/plugins';
import {
  ExportStyle,
  updateSewingKitBabelPreset,
  createCompileBabelStep,
  createJavaScriptWebpackRuleSet,
} from '@sewing-kit/plugin-javascript';

import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.PackageEsNext';
const VARIANT = 'esnext';
const EXTENSION = '.esnext';

declare module '@sewing-kit/hooks' {
  interface BuildPackageTargetOptions {
    [VARIANT]: boolean;
  }
}

export function esnextOutput() {
  return createProjectPlugin<Project>(
    `${PLUGIN}.Consumer`,
    ({api, project, tasks: {build, dev}}) => {
      build.hook(({hooks, options}) => {
        hooks.target.hook(({target, hooks}) => {
          hooks.configure.hook((configuration) => {
            configuration.webpackExtensions?.hook(addExtension);
            configuration.webpackConfig?.hook(
              createMainFieldAdder(target.runtime),
            );
            configuration.webpackRules?.hook(async (rules) => [
              ...rules,
              {
                test: /\.esnext/,
                include: /node_modules/,
                use: await createJavaScriptWebpackRuleSet({
                  api,
                  target,
                  env: options.simulateEnv,
                  configuration,
                  cacheDirectory: 'esnext',
                }),
              },
            ]);
          });
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.webpackExtensions?.hook(addExtension);
          configure.webpackConfig?.hook(
            createMainFieldAdder(TargetRuntime.fromProject(project)),
          );
          configure.webpackRules?.hook(async (rules) => [
            ...rules,
            {
              test: /\.esnext/,
              include: /node_modules/,
              use: await createJavaScriptWebpackRuleSet({
                api,
                target: {
                  project,
                  options: {},
                  runtime: TargetRuntime.fromProject(project),
                },
                env: Env.Development,
                configuration: configure,
                cacheDirectory: 'esnext',
              }),
            },
          ]);
        });
      });

      function createMainFieldAdder(runtime: TargetRuntime) {
        return (config: import('webpack').Configuration) => {
          return {
            ...config,
            resolve: {
              ...config.resolve,
              mainFields: [
                'esnext',
                ...(config.resolve?.mainFields ??
                  (runtime.includes(Runtime.Node) && runtime.runtimes.size === 1
                    ? ['module', 'main']
                    : ['browser', 'module', 'main'])),
              ] as string[] | string[][],
            },
          };
        };
      }
    },
  );
}

export function buildEsNextOutput() {
  return createProjectBuildPlugin<Package>(PLUGIN, (context) => {
    const {
      api,
      hooks,
      project,
      options: {cache},
    } = context;

    hooks.targets.hook((targets) =>
      targets.map((target) =>
        target.default ? target.add({esnext: true}) : target,
      ),
    );

    hooks.target.hook(({target, hooks}) => {
      if (!target.options.esnext) return;

      hooks.configure.hook((configuration) => {
        configuration.babelConfig?.hook(
          updateSewingKitBabelPreset({
            polyfill: 'inline',
            modules: 'preserve',
            target: ['last 1 chrome version'],
          }),
        );
      });

      hooks.steps.hook((steps, configuration) => {
        const outputPath = project.fs.buildPath('esnext');

        return [
          ...steps,
          createCompileBabelStep({
            api,
            project,
            outputPath,
            configuration,
            extension: EXTENSION,
            configFile: 'babel.esnext.js',
            exportStyle: ExportStyle.EsModules,
            cache,
          }),
        ];
      });
    });
  });
}

function addExtension(extensions: readonly string[]): readonly string[] {
  return [EXTENSION, ...extensions];
}
