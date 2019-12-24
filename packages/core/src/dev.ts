import {
  SeriesHook,
  WaterfallHook,
  DevServiceHooks,
  DevServiceConfigurationHooks,
  DevWebAppHooks,
  DevWebAppConfigurationHooks,
  DevPackageHooks,
  DevPackageConfigurationHooks,
} from '@sewing-kit/hooks';
import {DevTaskOptions, DevWorkspaceTaskHooks} from '@sewing-kit/tasks';
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
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  await dev.run({
    hooks: devTaskHooks,
    options,
  });

  const webAppSteps = await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const {dev} = await createProjectTasksAndApplyPlugins(
        webApp,
        workspace,
        delegate,
      );

      const hooks: DevWebAppHooks = {
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        steps: new WaterfallHook(),
      };

      await dev.run({options, hooks});

      const configurationHooks: DevWebAppConfigurationHooks = {};
      await hooks.configure.run(configurationHooks);

      const context = await hooks.context.run({});
      const steps = await hooks.steps.run(
        [],
        {config: configurationHooks},
        context,
      );

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

      const hooks: DevServiceHooks = {
        configure: new SeriesHook(),
        context: new WaterfallHook(),
        steps: new WaterfallHook(),
      };

      await dev.run({options, hooks});

      const configurationHooks: DevServiceConfigurationHooks = {
        ip: new WaterfallHook(),
        port: new WaterfallHook(),
      };
      await hooks.configure.run(configurationHooks);

      const context = await hooks.context.run({});

      const steps = await hooks.steps.run(
        [],
        {
          config: configurationHooks,
        },
        context,
      );

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

            const hooks: DevPackageHooks = {
              configure: new SeriesHook(),
              context: new WaterfallHook(),
              steps: new WaterfallHook(),
            };

            await dev.run({options, hooks});

            const configurationHooks: DevPackageConfigurationHooks = {};
            await hooks.configure.run(configurationHooks);

            const context = await hooks.context.run({});
            const steps = await hooks.steps.run(
              [],
              {
                config: configurationHooks,
              },
              context,
            );

            return {pkg, steps};
          }),
        )
      ).flat();

  const configurationHooks = {};
  await devTaskHooks.configure.run(configurationHooks);

  const [pre, post] = await Promise.all([
    devTaskHooks.pre.run([], {configuration: configurationHooks}),
    devTaskHooks.post.run([], {configuration: configurationHooks}),
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
