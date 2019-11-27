import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Env,
  Step,
  DevServiceHooks,
  DevServiceConfigurationHooks,
  BuildServiceHooks,
  BuildServiceConfigurationHooks,
  DevWebAppHooks,
  DevWebAppConfigurationHooks,
  BuildWebAppHooks,
  BuildBrowserConfigurationHooks,
  DevPackageHooks,
  DevPackageConfigurationHooks,
  BuildPackageHooks,
  BuildPackageConfigurationHooks,
  PluginTarget,
} from '@sewing-kit/types';
import {run, createStep} from '@sewing-kit/ui';

import {Workspace} from '../../workspace';
import {Runner} from '../../runner';

import {BuildTaskHooks} from '../build';

import {DevTaskHooks, DevTaskOptions} from './types';

export async function runDev(
  options: DevTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const devTaskHooks: DevTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),

    project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
    package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
    webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
    service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),

    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
  };

  const buildTaskHooks: BuildTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),

    project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
    package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
    webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
    service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),

    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
  };

  await runner.tasks.dev.promise({
    hooks: devTaskHooks,
    options,
    workspace,
  });

  await runner.tasks.build.promise({
    hooks: buildTaskHooks,
    options: {...options, env: Env.Development, simulateEnv: Env.Development},
    workspace,
  });

  const webAppSteps: Step[] = (await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const hooks: DevWebAppHooks = {
        details: new AsyncSeriesHook(['details']),
        configure: new AsyncSeriesHook(['configuration']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
      };

      const buildHooks: BuildWebAppHooks = {
        variants: new AsyncSeriesWaterfallHook(['variants']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration', 'variant']),
        configureBrowser: new AsyncSeriesHook(['configuration', 'variant']),
        configureServiceWorker: new AsyncSeriesHook([
          'configuration',
          'variant',
        ]),
      };

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildProject),
        ...webApp.pluginsForTarget(PluginTarget.BuildProject),
      ]) {
        plugin({project: webApp, hooks: buildHooks});
      }

      await devTaskHooks.project.promise({project: webApp, hooks});

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildWebApp),
        ...webApp.pluginsForTarget(PluginTarget.BuildWebApp),
      ]) {
        plugin({webApp, hooks: buildHooks});
      }

      await devTaskHooks.webApp.promise({webApp, hooks});

      await buildTaskHooks.project.promise({
        project: webApp,
        hooks: buildHooks,
      });
      await buildTaskHooks.webApp.promise({webApp, hooks: buildHooks});

      const configurationHooks: DevWebAppConfigurationHooks = {};
      await hooks.configure.promise(configurationHooks);

      const buildConfigurationHooks: BuildBrowserConfigurationHooks = {
        entries: new AsyncSeriesWaterfallHook(['entries']),
        extensions: new AsyncSeriesWaterfallHook(['extensions', 'options']),
        filename: new AsyncSeriesWaterfallHook(['filename']),
        output: new AsyncSeriesWaterfallHook(['output']),
      };

      await buildHooks.configure.promise(buildConfigurationHooks, {});
      await buildHooks.configureBrowser.promise(buildConfigurationHooks, {});

      const details = {
        config: configurationHooks,
        buildBrowserConfig: buildConfigurationHooks,
        buildServiceWorkerConfig: buildConfigurationHooks,
      };

      await hooks.details.promise(details);
      const steps = await hooks.steps.promise([], details);

      return steps.length > 0
        ? [
            createStep({
              steps,
              label: (fmt) =>
                fmt`Starting development mode for web app {emphasis ${webApp.name}}`,
            }),
          ]
        : [];
    }),
  )).flat();

  const serviceSteps: Step[] = (await Promise.all(
    workspace.services.map(async (service) => {
      const hooks: DevServiceHooks = {
        configure: new AsyncSeriesHook(['configuration']),
        details: new AsyncSeriesHook(['details']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
      };

      const buildHooks: BuildServiceHooks = {
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration']),
      };

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildProject),
        ...service.pluginsForTarget(PluginTarget.BuildProject),
      ]) {
        plugin({project: service, hooks: buildHooks});
      }

      await devTaskHooks.project.promise({project: service, hooks});

      for (const plugin of [
        ...workspace.pluginsForTarget(PluginTarget.BuildService),
        ...service.pluginsForTarget(PluginTarget.BuildService),
      ]) {
        plugin({service, hooks: buildHooks});
      }

      await devTaskHooks.service.promise({service, hooks});

      await buildTaskHooks.project.promise({
        project: service,
        hooks: buildHooks,
      });
      await buildTaskHooks.service.promise({service, hooks: buildHooks});

      const configurationHooks: DevServiceConfigurationHooks = {
        ip: new AsyncSeriesWaterfallHook(['ip']),
        port: new AsyncSeriesWaterfallHook(['port']),
      };
      await hooks.configure.promise(configurationHooks);

      const buildConfigurationHooks: BuildServiceConfigurationHooks = {
        entries: new AsyncSeriesWaterfallHook(['entries']),
        extensions: new AsyncSeriesWaterfallHook(['extensions', 'options']),
        filename: new AsyncSeriesWaterfallHook(['filename']),
        output: new AsyncSeriesWaterfallHook(['output']),
      };

      await buildHooks.configure.promise(buildConfigurationHooks);

      const details = {
        config: configurationHooks,
        buildConfig: buildConfigurationHooks,
      };

      await hooks.details.promise(details);
      const steps = await hooks.steps.promise([], details);

      return steps.length > 0
        ? [
            createStep({
              steps,
              label: (fmt) =>
                fmt`Starting development mode for service {emphasis ${service.name}}`,
            }),
          ]
        : [];
    }),
  )).flat();

  const packageSteps: Step[] = workspace.private
    ? []
    : (await Promise.all(
        workspace.packages.map(async (pkg) => {
          const hooks: DevPackageHooks = {
            configure: new AsyncSeriesHook(['buildTarget', 'options']),
            details: new AsyncSeriesHook(['details']),
            steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
          };

          const buildHooks: BuildPackageHooks = {
            variants: new AsyncSeriesWaterfallHook(['variants']),
            steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
            configure: new AsyncSeriesHook(['buildTarget', 'options']),
          };

          for (const plugin of [
            ...workspace.pluginsForTarget(PluginTarget.BuildProject),
            ...pkg.pluginsForTarget(PluginTarget.BuildProject),
          ]) {
            plugin({project: pkg, hooks: buildHooks});
          }

          await devTaskHooks.project.promise({project: pkg, hooks});

          for (const plugin of [
            ...workspace.pluginsForTarget(PluginTarget.BuildPackage),
            ...pkg.pluginsForTarget(PluginTarget.BuildPackage),
          ]) {
            plugin({pkg, hooks: buildHooks});
          }

          await devTaskHooks.package.promise({pkg, hooks});

          await buildTaskHooks.project.promise({
            project: pkg,
            hooks: buildHooks,
          });
          await buildTaskHooks.package.promise({pkg, hooks: buildHooks});

          const configurationHooks: DevPackageConfigurationHooks = {};
          await hooks.configure.promise(configurationHooks);

          const buildConfigurationHooks: BuildPackageConfigurationHooks = {
            extensions: new AsyncSeriesWaterfallHook(['extensions']),
          };
          await buildHooks.configure.promise(buildConfigurationHooks);

          const details = {
            config: configurationHooks,
            buildConfig: buildConfigurationHooks,
          };

          await hooks.details.promise(details);
          const steps = await hooks.steps.promise([], details);

          return steps.length > 0
            ? [
                createStep({
                  steps,
                  label: (fmt) =>
                    fmt`Starting development mode for web app {emphasis ${pkg.name}}`,
                }),
              ]
            : [];
        }),
      )).flat();

  const configurationHooks = {};
  await devTaskHooks.configure.promise(configurationHooks);

  const [pre, post] = await Promise.all([
    devTaskHooks.pre.promise([], {configuration: configurationHooks}),
    devTaskHooks.post.promise([], {configuration: configurationHooks}),
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
