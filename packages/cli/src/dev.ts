import {
  SeriesHook,
  WaterfallHook,
  DevServiceHooks,
  DevWebAppHooks,
  DevPackageHooks,
} from '@sewing-kit/hooks';
import {DevTaskOptions, DevWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {LogLevel} from './ui';
import {run} from './runner';
import {
  createStep,
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

export const dev = createCommand(
  {
    '--reload': String,
    '--source-maps': Boolean,
  },
  async ({'--source-maps': sourceMaps, '--reload': reload}, context) => {
    await runDev(context, {
      sourceMaps,
      reload: reload == null ? undefined : normalizeReload(reload),
    });
  },
);

function normalizeReload(reload: string): DevTaskOptions['reload'] {
  switch (reload) {
    case 'none':
      return false;
    case 'fast':
      return 'fast';
    default: {
      throw new Error(`Unknown --reload option: ${reload}`);
    }
  }
}

export async function runDev(
  taskContext: TaskContext,
  options: DevTaskOptions,
) {
  const {workspace} = taskContext;
  const {dev} = await createWorkspaceTasksAndApplyPlugins(taskContext);

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
        taskContext,
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

      const step = createStep(
        {
          id: 'SewingKit.DevWebApp',
          label: (fmt) => fmt`start dev mode for {emphasis ${webApp.name}}`,
        },
        async (step) => {
          if (steps.length === 0) {
            step.log('no development steps available', {level: LogLevel.Debug});
            return;
          }

          await step.runNested(steps);
        },
      );

      return {step, target: webApp};
    }),
  );

  const serviceSteps = await Promise.all(
    workspace.services.map(async (service) => {
      const {dev} = await createProjectTasksAndApplyPlugins(
        service,
        taskContext,
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

      const step = createStep(
        {
          id: 'SewingKit.DevService',
          label: (fmt) => fmt`start dev mode for {emphasis ${service.name}}`,
        },
        async (step) => {
          if (steps.length === 0) {
            step.log('no development steps available', {level: LogLevel.Debug});
            return;
          }

          await step.runNested(steps);
        },
      );

      return {step, target: service};
    }),
  );

  const packageSteps = await Promise.all(
    workspace.packages.map(async (pkg) => {
      const {dev} = await createProjectTasksAndApplyPlugins(pkg, taskContext);

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

      const step = createStep(
        {
          id: 'SewingKit.DevPackage',
          label: (fmt) => fmt`start dev mode for {emphasis ${pkg.name}}`,
        },
        async (step) => {
          if (steps.length === 0) {
            step.log('no development steps available', {level: LogLevel.Debug});
            return;
          }

          await step.runNested(steps);
        },
      );

      return {step, target: pkg};
    }),
  );

  const allSteps = [...packageSteps, ...webAppSteps, ...serviceSteps];

  const configuration = await devTaskHooks.configureHooks.run({});
  await devTaskHooks.configure.run(configuration);

  const [pre, post] = await Promise.all([
    devTaskHooks.pre.run([], {configuration}),
    devTaskHooks.post.run([], {configuration}),
  ]);

  await run(taskContext, {
    title: 'dev',
    pre,
    post,
    steps: allSteps,
    epilogue(log) {
      log((fmt) => fmt`{success dev completed successfully!}`);
    },
  });
}
