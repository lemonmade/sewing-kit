import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  DevServiceHooks,
  DevServiceConfigurationHooks,
  DevWebAppHooks,
  DevWebAppConfigurationHooks,
  DevPackageHooks,
  DevPackageConfigurationHooks,
} from '@sewing-kit/hooks';
import {
  DevTaskOptions,
  DevProjectTaskHooks,
  DevWorkspaceTaskHooks,
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
  const {dev} = await createWorkspaceTasksAndApplyPlugins(workspace, delegate);

  const devTaskHooks: DevWorkspaceTaskHooks = {
    configure: new AsyncSeriesHook(['hooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'details']),
    post: new AsyncSeriesWaterfallHook(['steps', 'details']),
  };

  await dev.promise({
    hooks: devTaskHooks,
    options,
    workspace,
  });

  const webAppSteps = await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const {dev} = await createProjectTasksAndApplyPlugins(
        webApp,
        workspace,
        delegate,
      );

      const devTaskHooks: DevProjectTaskHooks = {
        project: new AsyncSeriesHook(['project', 'projectDevHooks']),
        package: new AsyncSeriesHook(['pkg', 'packageDevHooks']),
        webApp: new AsyncSeriesHook(['app', 'webAppDevHooks']),
        service: new AsyncSeriesHook(['service', 'serviceDevHooks']),
      };

      await dev.promise({options, hooks: devTaskHooks, workspace});

      const hooks: DevWebAppHooks = {
        details: new AsyncSeriesHook(['details']),
        configure: new AsyncSeriesHook(['configuration']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
      };

      await devTaskHooks.project.promise({project: webApp, hooks});
      await devTaskHooks.webApp.promise({webApp, hooks});

      const configurationHooks: DevWebAppConfigurationHooks = {};
      await hooks.configure.promise(configurationHooks);

      const details = {
        config: configurationHooks,
      };

      await hooks.details.promise(details);
      const steps = await hooks.steps.promise([], details);

      return {steps, webApp};
    }),
  );

  const serviceSteps = await Promise.all(
    workspace.services.map(async (service) => {
      const {dev} = await createProjectTasksAndApplyPlugins(
        service,
        workspace,
        delegate,
      );

      const devTaskHooks: DevProjectTaskHooks = {
        project: new AsyncSeriesHook(['project', 'projectDevHooks']),
        package: new AsyncSeriesHook(['pkg', 'packageDevHooks']),
        webApp: new AsyncSeriesHook(['app', 'webAppDevHooks']),
        service: new AsyncSeriesHook(['service', 'serviceDevHooks']),
      };

      await dev.promise({options, hooks: devTaskHooks, workspace});

      const hooks: DevServiceHooks = {
        configure: new AsyncSeriesHook(['configuration']),
        details: new AsyncSeriesHook(['details']),
        steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
      };

      await devTaskHooks.project.promise({project: service, hooks});
      await devTaskHooks.service.promise({service, hooks});

      const configurationHooks: DevServiceConfigurationHooks = {
        ip: new AsyncSeriesWaterfallHook(['ip']),
        port: new AsyncSeriesWaterfallHook(['port']),
      };
      await hooks.configure.promise(configurationHooks);

      const details = {
        config: configurationHooks,
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
            const {dev} = await createProjectTasksAndApplyPlugins(
              pkg,
              workspace,
              delegate,
            );

            const devTaskHooks: DevProjectTaskHooks = {
              project: new AsyncSeriesHook(['project', 'projectDevHooks']),
              package: new AsyncSeriesHook(['pkg', 'packageDevHooks']),
              webApp: new AsyncSeriesHook(['app', 'webAppDevHooks']),
              service: new AsyncSeriesHook(['service', 'serviceDevHooks']),
            };

            await dev.promise({options, hooks: devTaskHooks, workspace});

            const hooks: DevPackageHooks = {
              configure: new AsyncSeriesHook(['buildTarget', 'options']),
              details: new AsyncSeriesHook(['details']),
              steps: new AsyncSeriesWaterfallHook(['steps', 'details']),
            };

            await devTaskHooks.project.promise({project: pkg, hooks});
            await devTaskHooks.package.promise({pkg, hooks});

            const configurationHooks: DevPackageConfigurationHooks = {};
            await hooks.configure.promise(configurationHooks);

            const details = {
              config: configurationHooks,
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
    runner.title('dev');

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

    runner.epilogue((fmt) => fmt`{success dev completed successfully!}`);
  });
}
