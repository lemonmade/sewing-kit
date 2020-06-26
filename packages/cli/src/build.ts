import {
  WaterfallHook,
  SeriesHook,
  BuildServiceHooks,
  BuildServiceVariantHooks,
  BuildWebAppHooks,
  BuildWebAppVariantHooks,
  BuildPackageHooks,
  BuildPackageVariantHooks,
} from '@sewing-kit/hooks';
import {
  Env,
  BuildTaskOptions,
  BuildWorkspaceTaskHooks,
} from '@sewing-kit/tasks';

import {Runtime} from '@sewing-kit/model';
import {LogLevel} from './ui';
import {run, StepDetails} from './runner';
import {
  createStep,
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

type ArrayElement<T> = T extends (infer U)[]
  ? U
  : T extends readonly (infer U)[]
  ? U
  : never;

export const build = createCommand(
  {
    '--source-maps': Boolean,
    '--env': String,
  },
  async ({'--env': rawEnv, '--source-maps': sourceMaps}, context) => {
    const env = normalizeEnv(rawEnv);

    await runBuild(context, {
      env,
      simulateEnv: env,
      sourceMaps,
    });
  },
);

function normalizeEnv(rawEnv: string | undefined) {
  if (rawEnv == null) {
    return Env.Production;
  }

  return /prod(?:uction)?/i.test(rawEnv) ? Env.Production : Env.Development;
}

export async function runBuild(
  taskContext: TaskContext,
  options: BuildTaskOptions,
) {
  const {workspace} = taskContext;
  const {build} = await createWorkspaceTasksAndApplyPlugins(taskContext);

  const buildTaskHooks: BuildWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    post: new WaterfallHook(),
    project: new SeriesHook(),
    package: new SeriesHook(),
    service: new SeriesHook(),
    webApp: new SeriesHook(),
    context: new WaterfallHook(),
  };

  await build.run({
    hooks: buildTaskHooks,
    options,
  });

  const configuration = await buildTaskHooks.configureHooks.run({});
  await buildTaskHooks.configure.run(configuration);

  const workspaceContext = await buildTaskHooks.context.run({configuration});

  const webAppSteps = await Promise.all(
    workspace.webApps.map(async (webApp) => {
      const {build} = await createProjectTasksAndApplyPlugins(
        webApp,
        taskContext,
      );

      const hooks: BuildWebAppHooks = {
        variants: new WaterfallHook(),
        variant: new SeriesHook(),
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
      };

      const details = {
        options,
        hooks,
        context: workspaceContext,
      };

      const projectDetails = {
        project: webApp,
        ...details,
      };

      await buildTaskHooks.project.run(projectDetails);
      await buildTaskHooks.webApp.run(projectDetails);
      await build.run(details);

      const [variants, context] = await Promise.all([
        hooks.variants.run([]),
        hooks.context.run({}),
      ]);

      const stepsForVariant = async (
        variant: ArrayElement<typeof variants>,
      ) => {
        const variantHooks: BuildWebAppVariantHooks = {
          context: new WaterfallHook(),
          steps: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await hooks.variant.run({variant, hooks: variantHooks});

        const [configuration, variantContext] = await Promise.all([
          hooks.configureHooks.run({}),
          variantHooks.context.run({runtimes: [Runtime.Browser]}),
        ]);

        const baseHookContext = {workspace: workspaceContext, project: context};
        const variantHookContext = {
          ...baseHookContext,
          variant: variantContext,
        };

        await hooks.configure.run(configuration, baseHookContext);
        await variantHooks.configure.run(configuration, variantHookContext);

        return variantHooks.steps.run([], configuration, variantHookContext);
      };

      const variantSteps = await Promise.all(
        variants.map(
          async (variant): Promise<StepDetails> => {
            const steps = await stepsForVariant(variant);

            const step = createStep(
              {
                id: 'SewingKit.BuildWebAppVariant',
                label: (fmt) =>
                  fmt`build web app {emphasis ${
                    webApp.name
                  }} variant {subdued ${stringifyVariant(variant)}}`,
              },
              async (step) => {
                if (steps.length === 0) {
                  step.log('no build steps available', {level: LogLevel.Debug});
                  return;
                }

                await step.runNested(steps);
              },
            );

            return {step, target: webApp};
          },
        ),
      );

      const additionalSteps: StepDetails[] = [];

      if (hooks.steps.hasHooks) {
        const configuration = await hooks.configureHooks.run({});

        const hookContext = {
          project: context,
          workspace: workspaceContext,
        };

        await hooks.configure.run(configuration, hookContext);

        const nonVariantSteps = await hooks.steps.run(
          [],
          configuration,
          hookContext,
        );

        const step = createStep(
          {
            id: 'SewingKit.BuildWebApp',
            label: (fmt) => fmt`build web app {emphasis ${webApp.name}}`,
          },
          async (step) => {
            if (nonVariantSteps.length === 0) {
              step.log('no build steps available', {level: LogLevel.Debug});
              return;
            }

            await step.runNested(nonVariantSteps);
          },
        );

        additionalSteps.push({
          step,
          target: webApp,
          dependencies: variantSteps.map(({step}) => step),
        });
      }

      return [...variantSteps, ...additionalSteps];
    }),
  );

  const serviceSteps = await Promise.all(
    workspace.services.map(async (service) => {
      const {build} = await createProjectTasksAndApplyPlugins(
        service,
        taskContext,
      );

      const hooks: BuildServiceHooks = {
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
        variants: new WaterfallHook(),
        variant: new SeriesHook(),
      };

      const details = {
        options,
        hooks,
        context: workspaceContext,
      };

      const projectDetails = {
        project: service,
        ...details,
      };

      await buildTaskHooks.project.run(projectDetails);
      await buildTaskHooks.service.run(projectDetails);
      await build.run(details);

      const [variants, context] = await Promise.all([
        hooks.variants.run([]),
        hooks.context.run({}),
      ]);

      const stepsForVariant = async (
        variant: ArrayElement<typeof variants>,
      ) => {
        const variantHooks: BuildServiceVariantHooks = {
          context: new WaterfallHook(),
          steps: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await hooks.variant.run({variant, hooks: variantHooks});

        const [configuration, variantContext] = await Promise.all([
          hooks.configureHooks.run({}),
          variantHooks.context.run({runtimes: [Runtime.Node]}),
        ]);

        const baseHookContext = {workspace: workspaceContext, project: context};
        const variantHookContext = {
          ...baseHookContext,
          variant: variantContext,
        };

        await hooks.configure.run(configuration, baseHookContext);
        await variantHooks.configure.run(configuration, variantHookContext);

        return variantHooks.steps.run([], configuration, variantHookContext);
      };

      const variantSteps = await Promise.all(
        variants.map(async (variant) => {
          const steps = await stepsForVariant(variant);

          const step = createStep(
            {
              id: 'SewingKit.BuildServiceVariant',
              label: (fmt) =>
                fmt`build service {emphasis ${
                  service.name
                }} variant {subdued ${stringifyVariant(variant)}}`,
            },
            async (step) => {
              if (steps.length === 0) {
                step.log('no build steps available', {level: LogLevel.Debug});
                return;
              }

              await step.runNested(steps);
            },
          );

          return {step, target: service};
        }),
      );

      const additionalSteps: StepDetails[] = [];

      if (hooks.steps.hasHooks) {
        const configuration = await hooks.configureHooks.run({});

        const hookContext = {
          project: context,
          workspace: workspaceContext,
        };

        await hooks.configure.run(configuration, hookContext);

        const nonVariantSteps = await hooks.steps.run(
          [],
          configuration,
          hookContext,
        );

        const step = createStep(
          {
            id: 'SewingKit.BuildService',
            label: (fmt) => fmt`build package {emphasis ${service.name}}`,
          },
          async (step) => {
            if (nonVariantSteps.length === 0) {
              step.log('no build steps available', {level: LogLevel.Debug});
              return;
            }

            await step.runNested(nonVariantSteps);
          },
        );

        additionalSteps.push({
          step,
          target: service,
          dependencies: variantSteps.map(({step}) => step),
        });
      }

      return [...variantSteps, ...additionalSteps];
    }),
  );

  const packageSteps = await Promise.all(
    workspace.packages.map(async (pkg) => {
      const {build} = await createProjectTasksAndApplyPlugins(pkg, taskContext);

      const hooks: BuildPackageHooks = {
        variants: new WaterfallHook(),
        variant: new SeriesHook(),
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
        configure: new SeriesHook(),
        configureHooks: new WaterfallHook(),
      };

      const details = {
        options,
        hooks,
        context: workspaceContext,
      };

      const projectDetails = {
        project: pkg,
        ...details,
      };

      await buildTaskHooks.project.run(projectDetails);
      await buildTaskHooks.package.run(projectDetails);
      await build.run(details);

      const [variants, context] = await Promise.all([
        hooks.variants.run([]),
        hooks.context.run({}),
      ]);

      const stepsForVariant = async (
        variant: ArrayElement<typeof variants>,
      ) => {
        const variantHooks: BuildPackageVariantHooks = {
          context: new WaterfallHook(),
          steps: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await hooks.variant.run({variant, hooks: variantHooks});

        const [configuration, variantContext] = await Promise.all([
          hooks.configureHooks.run({}),
          variantHooks.context.run({
            runtimes: pkg.runtime == null ? [] : [pkg.runtime],
          }),
        ]);

        const baseHookContext = {workspace: workspaceContext, project: context};
        const variantHookContext = {
          ...baseHookContext,
          variant: variantContext,
        };

        await hooks.configure.run(configuration, baseHookContext);
        await variantHooks.configure.run(configuration, variantHookContext);

        return variantHooks.steps.run([], configuration, variantHookContext);
      };

      const variantSteps = await Promise.all(
        variants.map(async (variant) => {
          const steps = await stepsForVariant(variant);

          const step = createStep(
            {
              id: 'SewingKit.BuildPackageVariant',
              label: (fmt) =>
                fmt`build package {emphasis ${
                  pkg.name
                }} variant {subdued ${stringifyVariant(variant)}}`,
            },
            async (step) => {
              if (steps.length === 0) {
                step.log('no build steps available', {level: LogLevel.Debug});
                return;
              }

              await step.runNested(steps);
            },
          );

          return {step, target: pkg};
        }),
      );

      const additionalSteps: StepDetails[] = [];

      if (hooks.steps.hasHooks) {
        const configuration = await hooks.configureHooks.run({});

        const hookContext = {
          project: context,
          workspace: workspaceContext,
        };

        await hooks.configure.run(configuration, hookContext);

        const nonVariantSteps = await hooks.steps.run(
          [],
          configuration,
          hookContext,
        );

        const step = createStep(
          {
            id: 'SewingKit.BuildPackage',
            label: (fmt) => fmt`build package {emphasis ${pkg.name}}`,
          },
          async (step) => {
            if (nonVariantSteps.length === 0) {
              step.log('no build steps available', {level: LogLevel.Debug});
              return;
            }

            await step.runNested(nonVariantSteps);
          },
        );

        additionalSteps.push({
          step,
          target: pkg,
          dependencies: variantSteps.map(({step}) => step),
        });
      }

      return [...variantSteps, ...additionalSteps];
    }),
  );

  const allSteps = [
    ...packageSteps.flat(),
    ...webAppSteps.flat(),
    ...serviceSteps.flat(),
  ];

  const [pre, post] = await Promise.all([
    buildTaskHooks.pre.run([], workspaceContext),
    buildTaskHooks.post.run([], workspaceContext),
  ]);

  await run(taskContext, {
    title: 'build',
    pre,
    post,
    steps: allSteps,
    epilogue(log) {
      log((fmt) => fmt`{success build completed successfully!}`);
    },
  });
}

function stringifyVariant(variant: object) {
  return Object.entries(variant)
    .map(([key, value]) => {
      return value === true ? key : `${key}: ${value}`;
    })
    .join(', ');
}
