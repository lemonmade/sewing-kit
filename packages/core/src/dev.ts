import {
  SeriesHook,
  WaterfallHook,
  DevServiceHooks,
  DevWebAppHooks,
  DevPackageHooks,
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
    configureHooks: new WaterfallHook(),
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
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
        context: new WaterfallHook(),
        steps: new WaterfallHook(),
      };

      await dev.run({options, hooks});

      const configuration = await hooks.configureHooks.run({});
      await hooks.configure.run(configuration);

      const context = await hooks.context.run({configuration});
      const steps = await hooks.steps.run([], context);

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
        configureHooks: new WaterfallHook(),
        configure: new SeriesHook(),
        context: new WaterfallHook(),
        steps: new WaterfallHook(),
      };

      await dev.run({options, hooks});

      const configuration = await hooks.configureHooks.run({
        ip: new WaterfallHook(),
        port: new WaterfallHook(),
      });
      await hooks.configure.run(configuration);

      const context = await hooks.context.run({configuration});
      const steps = await hooks.steps.run([], context);

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
              configureHooks: new WaterfallHook(),
              configure: new SeriesHook(),
              context: new WaterfallHook(),
              steps: new WaterfallHook(),
            };

            await dev.run({options, hooks});

            const configuration = await hooks.configureHooks.run({});
            await hooks.configure.run(configuration);

            const context = await hooks.context.run({configuration});
            const steps = await hooks.steps.run([], context);

            return {pkg, steps};
          }),
        )
      ).flat();

  const configuration = await devTaskHooks.configureHooks.run({});
  await devTaskHooks.configure.run(configuration);

  const [pre, post] = await Promise.all([
    devTaskHooks.pre.run([], {configuration}),
    devTaskHooks.post.run([], {configuration}),
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
