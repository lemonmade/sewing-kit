import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Step,
  BuildServiceHooks,
  BuildServiceConfigurationHooks,
  BuildWebAppHooks,
  BuildBrowserConfigurationHooks,
  BuildPackageHooks,
  BuildPackageConfigurationHooks,
  PluginTarget,
} from '@sewing-kit/types';
import {run, createStep} from '@sewing-kit/ui';
import {ArrayElement} from '@shopify/useful-types';

import {Workspace} from '../../workspace';
import {Runner} from '../../runner';

import {BuildTaskOptions, BuildTaskHooks} from './types';

export async function runBuild(
  options: BuildTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const buildTaskHooks: BuildTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),

    project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
    package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
    webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
    service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),

    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
  };

  await runner.tasks.build.promise({
    hooks: buildTaskHooks,
    options,
    workspace,
  });

  const webAppSteps: Step[] = await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const hooks: BuildWebAppHooks = {
        variants: new AsyncSeriesWaterfallHook(['variants']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration', 'variant']),
        configureBrowser: new AsyncSeriesHook(['configuration', 'variant']),
        configureServiceWorker: new AsyncSeriesHook([
          'configuration',
          'variant',
        ]),
      };

      const projectDetails = {project: webApp, hooks};

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildProject),
        ...webApp.pluginsForTarget(PluginTarget.BuildProject),
      ]) {
        plugin(projectDetails);
      }

      await buildTaskHooks.project.promise(projectDetails);

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildWebApp),
        ...webApp.pluginsForTarget(PluginTarget.BuildWebApp),
      ]) {
        plugin({webApp, hooks});
      }

      await buildTaskHooks.webApp.promise({webApp, hooks});

      const variants = await hooks.variants.promise([]);

      const stepsForVariant = async (
        variant: ArrayElement<typeof variants>,
      ) => {
        const configurationHooks: BuildBrowserConfigurationHooks = {
          entries: new AsyncSeriesWaterfallHook(['entries']),
          extensions: new AsyncSeriesWaterfallHook(['extensions', 'options']),
          filename: new AsyncSeriesWaterfallHook(['filename']),
          output: new AsyncSeriesWaterfallHook(['output']),
        };

        await hooks.configure.promise(configurationHooks, variant);
        await hooks.configureBrowser.promise(configurationHooks, variant);

        return hooks.steps.promise([], {
          variant,
          browserConfig: configurationHooks,
          serviceWorkerConfig: configurationHooks,
        });
      };

      const steps =
        variants.length > 1
          ? await Promise.all(
              variants.map(async (variant) => {
                return createStep({
                  label: (fmt) =>
                    fmt`Building variant {${stringifyVariant(variant)}}`,
                  steps: await stepsForVariant(variant),
                });
              }),
            )
          : await stepsForVariant({});

      return createStep({
        label: (fmt) => fmt`Building app {emphasis ${webApp.name}}`,
        steps,
      });
    }),
  );

  const serviceSteps: Step[] = await Promise.all(
    workspace.services.map(async (service) => {
      const hooks: BuildServiceHooks = {
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration']),
      };

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildProject),
        ...service.pluginsForTarget(PluginTarget.BuildProject),
      ]) {
        plugin({project: service, hooks});
      }

      await buildTaskHooks.project.promise({project: service, hooks});

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildService),
        ...service.pluginsForTarget(PluginTarget.BuildService),
      ]) {
        plugin({service, hooks});
      }

      await buildTaskHooks.service.promise({service, hooks});

      const configurationHooks: BuildServiceConfigurationHooks = {
        entries: new AsyncSeriesWaterfallHook(['entries']),
        extensions: new AsyncSeriesWaterfallHook(['extensions', 'options']),
        filename: new AsyncSeriesWaterfallHook(['filename']),
        output: new AsyncSeriesWaterfallHook(['output']),
      };

      await hooks.configure.promise(configurationHooks);

      const steps = await hooks.steps.promise([], {
        config: configurationHooks,
      });

      return createStep({
        steps,
        label: (fmt) => fmt`Building service {emphasis ${service.name}}`,
      });
    }),
  );

  const packageSteps: Step[] = workspace.private
    ? []
    : await Promise.all(
        workspace.packages.map(async (pkg) => {
          const hooks: BuildPackageHooks = {
            variants: new AsyncSeriesWaterfallHook(['variants']),
            steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
            configure: new AsyncSeriesHook(['buildTarget', 'options']),
          };

          const projectDetails = {project: pkg, hooks};

          for (const plugin of [
            ...workspace.pluginsForTarget(PluginTarget.BuildProject),
            ...pkg.pluginsForTarget(PluginTarget.BuildProject),
          ]) {
            plugin(projectDetails);
          }

          await buildTaskHooks.project.promise(projectDetails);

          for (const plugin of [
            ...workspace.pluginsForTarget(PluginTarget.BuildPackage),
            ...pkg.pluginsForTarget(PluginTarget.BuildPackage),
          ]) {
            plugin({pkg, hooks});
          }

          await buildTaskHooks.package.promise({pkg, hooks});

          const variants = await hooks.variants.promise([]);

          const steps = await Promise.all(
            variants.map(async (variant) => {
              const configurationHooks: BuildPackageConfigurationHooks = {
                extensions: new AsyncSeriesWaterfallHook(['extensions']),
              };

              await hooks.configure.promise(configurationHooks, variant);

              const steps = await hooks.steps.promise([], {
                variant,
                config: configurationHooks,
              });

              return createStep({
                steps,
                label: (fmt) =>
                  fmt`Build {emphasis ${stringifyVariant(variant)}} variant`,
              });
            }),
          );

          return createStep({
            steps,
            label: (fmt) => fmt`Build package {emphasis ${pkg.name}}`,
          });
        }),
      );

  const configurationHooks = {};
  await buildTaskHooks.configure.promise(configurationHooks);

  const [pre, post] = await Promise.all([
    buildTaskHooks.pre.promise([], {configuration: configurationHooks}),
    buildTaskHooks.post.promise([], {configuration: configurationHooks}),
  ]);

  const {skip, skipPre, skipPost} = options;

  await run([...webAppSteps, ...serviceSteps, ...packageSteps], {
    ui: runner.ui,
    pre,
    post,
    skip,
    skipPre,
    skipPost,
  });
}

function stringifyVariant(variant: object) {
  return Object.entries(variant)
    .map(([key, value]) => {
      return value === true ? key : `${key}: ${value}`;
    })
    .join(', ');
}
