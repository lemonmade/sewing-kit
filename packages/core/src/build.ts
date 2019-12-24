import {
  WaterfallHook,
  SeriesHook,
  BuildServiceHooks,
  BuildWebAppHooks,
  BuildPackageHooks,
} from '@sewing-kit/hooks';
import {BuildTaskOptions, BuildWorkspaceTaskHooks} from '@sewing-kit/tasks';
import {run, Step, Loggable, LogLevel} from '@sewing-kit/ui';
import {createStep} from '@sewing-kit/plugins';

import {
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

type ArrayElement<T> = T extends (infer U)[] ? U : never;

export async function runBuild(
  {workspace, delegate, ui}: TaskContext,
  options: BuildTaskOptions,
) {
  const {build} = await createWorkspaceTasksAndApplyPlugins(
    workspace,
    delegate,
  );

  const buildTaskHooks: BuildWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  await build.run({
    hooks: buildTaskHooks,
    options,
  });

  const webAppSteps = await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const {build} = await createProjectTasksAndApplyPlugins(
        webApp,
        workspace,
        delegate,
      );

      const hooks: BuildWebAppHooks = {
        variants: new WaterfallHook(),
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
      };

      await build.run({
        options,
        hooks,
      });

      const variants = await hooks.variants.run([]);

      const stepsForVariant = async (
        variant: ArrayElement<typeof variants>,
      ) => {
        const configuration = await hooks.configureHooks.run({});
        await hooks.configure.run(configuration, variant);

        const context = await hooks.context.run({variant, configuration});

        return hooks.steps.run([], context);
      };

      const steps =
        variants.length > 1
          ? await Promise.all(
              variants.map(async (variant) => {
                return createStepFromNestedSteps({
                  steps: await stepsForVariant(variant),
                  label: (fmt) =>
                    fmt`Build {emphasis ${stringifyVariant(
                      variant,
                    )}} web app variant`,
                });
              }),
            )
          : [
              createStepFromNestedSteps({
                steps: await stepsForVariant({}),
                label: (fmt) => fmt`Build web app`,
              }),
            ];

      return {webApp, steps};
    }),
  );

  const serviceSteps = await Promise.all(
    workspace.services.map(async (service) => {
      const {build} = await createProjectTasksAndApplyPlugins(
        service,
        workspace,
        delegate,
      );

      const hooks: BuildServiceHooks = {
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
      };

      await build.run({options, hooks});

      const configuration = await hooks.configureHooks.run({});
      await hooks.configure.run(configuration);

      const context = await hooks.context.run({configuration});
      const steps = await hooks.steps.run([], context);

      return {service, steps};
    }),
  );

  const packageSteps = await Promise.all(
    workspace.packages.map(async (pkg) => {
      const {build} = await createProjectTasksAndApplyPlugins(
        pkg,
        workspace,
        delegate,
      );

      const hooks: BuildPackageHooks = {
        variants: new WaterfallHook(),
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
      };

      await build.run({hooks, options});

      const variants = await hooks.variants.run([]);

      const steps = await Promise.all(
        variants.map(async (variant) => {
          const configuration = await hooks.configureHooks.run({});
          await hooks.configure.run(configuration, variant);

          const context = await hooks.context.run({variant, configuration});
          const steps = await hooks.steps.run([], context);

          return createStepFromNestedSteps({
            steps,
            label: (fmt) =>
              fmt`Build {emphasis ${stringifyVariant(
                variant,
              )}} package variant`,
          });
        }),
      );

      return {pkg, steps};
    }),
  );

  const configuration = await buildTaskHooks.configureHooks.run({});
  await buildTaskHooks.configure.run(configuration);

  const [pre, post] = await Promise.all([
    buildTaskHooks.pre.run([], {configuration}),
    buildTaskHooks.post.run([], {configuration}),
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

function stringifyVariant(variant: object) {
  return Object.entries(variant)
    .map(([key, value]) => {
      return value === true ? key : `${key}: ${value}`;
    })
    .join(', ');
}

function createStepFromNestedSteps({
  steps,
  label,
}: {
  readonly steps: readonly Step[];
  readonly label: Loggable;
}) {
  return createStep({label}, async (stepRunner) => {
    await Promise.all(
      steps.map(async (step) => {
        if (step.label) {
          stepRunner.log(
            (fmt) => fmt`starting sub-step: {info ${step.label!}}`,
            {
              level: LogLevel.Debug,
            },
          );
        } else {
          stepRunner.log(`starting unlabeled sub-step`, {
            level: LogLevel.Debug,
          });
        }

        await step.run(stepRunner);
      }),
    );
  });
}
