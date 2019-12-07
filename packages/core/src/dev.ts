import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
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
} from '@sewing-kit/hooks';
import {
  Env,
  DevTaskOptions,
  DevProjectTaskHooks,
  DevWorkspaceTaskHooks,
  BuildProjectTaskHooks,
  BuildWorkspaceTaskHooks,
} from '@sewing-kit/tasks';
import {run} from '@sewing-kit/ui';

import {
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

export async function runDev(
  {workspace, delegate, ui}: TaskContext,
  options: DevTaskOptions,
) {
  const {build, dev} = await createWorkspaceTasksAndApplyPlugins(
    workspace,
    delegate,
  );

  const devTaskHooks: DevWorkspaceTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),
    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
  };

  const buildTaskHooks: BuildWorkspaceTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),
    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
  };

  await dev.promise({
    hooks: devTaskHooks,
    options,
    workspace,
  });

  const buildOptions = {
    ...options,
    env: Env.Development,
    simulateEnv: Env.Development,
  };

  await build.promise({
    hooks: buildTaskHooks,
    options: buildOptions,
    workspace,
  });

  const webAppSteps = await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const {dev, build} = await createProjectTasksAndApplyPlugins(
        webApp,
        workspace,
        delegate,
      );

      const devTaskHooks: DevProjectTaskHooks = {
        project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
        package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
        webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
        service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),
      };

      const buildTaskHooks: BuildProjectTaskHooks = {
        project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
        package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
        webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
        service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),
      };

      await dev.promise({options, hooks: devTaskHooks, workspace});
      await build.promise({
        options: buildOptions,
        hooks: buildTaskHooks,
        workspace,
      });

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

      await devTaskHooks.project.promise({project: webApp, hooks});
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

      return {steps, webApp};
    }),
  );

  const serviceSteps = await Promise.all(
    workspace.services.map(async (service) => {
      const {dev, build} = await createProjectTasksAndApplyPlugins(
        service,
        workspace,
        delegate,
      );

      const devTaskHooks: DevProjectTaskHooks = {
        project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
        package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
        webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
        service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),
      };

      const buildTaskHooks: BuildProjectTaskHooks = {
        project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
        package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
        webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
        service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),
      };

      await dev.promise({options, hooks: devTaskHooks, workspace});
      await build.promise({
        options: buildOptions,
        hooks: buildTaskHooks,
        workspace,
      });

      const hooks: DevServiceHooks = {
        configure: new AsyncSeriesHook(['configuration']),
        details: new AsyncSeriesHook(['details']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
      };

      const buildHooks: BuildServiceHooks = {
        steps: new AsyncSeriesWaterfallHook(['steps', 'options']),
        configure: new AsyncSeriesHook(['configuration']),
      };

      await devTaskHooks.project.promise({project: service, hooks});
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

      return {service, steps};
    }),
  );

  const packageSteps = workspace.private
    ? []
    : (
        await Promise.all(
          workspace.packages.map(async (pkg) => {
            const {dev, build} = await createProjectTasksAndApplyPlugins(
              pkg,
              workspace,
              delegate,
            );

            const devTaskHooks: DevProjectTaskHooks = {
              project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
              package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
              webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
              service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),
            };

            const buildTaskHooks: BuildProjectTaskHooks = {
              project: new AsyncSeriesHook(['project', 'projectBuildHooks']),
              package: new AsyncSeriesHook(['pkg', 'packageBuildHooks']),
              webApp: new AsyncSeriesHook(['app', 'webAppBuildHooks']),
              service: new AsyncSeriesHook(['service', 'serviceBuildHooks']),
            };

            await dev.promise({options, hooks: devTaskHooks, workspace});
            await build.promise({
              options: buildOptions,
              hooks: buildTaskHooks,
              workspace,
            });

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

            await devTaskHooks.project.promise({project: pkg, hooks});
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

            return {pkg, steps};
          }),
        )
      ).flat();

  const configurationHooks = {};
  await devTaskHooks.configure.promise(configurationHooks);

  const [pre, post] = await Promise.all([
    devTaskHooks.pre.promise([], {configuration: configurationHooks}),
    devTaskHooks.post.promise([], {configuration: configurationHooks}),
  ]);

  const {skip, skipPre, skipPost} = options;

  await run(ui, async (runner) => {
    runner.title('build');

    await runner.pre(pre, skipPre);

    runner.separator();

    for (const {webApp, steps} of webAppSteps) {
      await runner.steps(steps, {id: webApp.name, skip});
    }

    for (const {pkg, steps} of packageSteps) {
      await runner.steps(steps, {id: pkg.name, skip});
    }

    for (const {service, steps} of serviceSteps) {
      await runner.steps(steps, {id: service.name, skip});
    }

    await runner.post(post, skipPost);

    runner.epilogue((fmt) => fmt`{success build completed successfully!}`);
  });
}
