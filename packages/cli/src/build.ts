import {
  WaterfallHook,
  SeriesHook,
  BuildServiceHooks,
  BuildServiceTargetHooks,
  BuildWebAppHooks,
  BuildWebAppTargetHooks,
  BuildPackageHooks,
  BuildPackageTargetHooks,
  BuildWebAppTargetOptions,
  BuildServiceTargetOptions,
  BuildPackageTargetOptions,
} from '@sewing-kit/hooks';
import {
  Env,
  BuildTaskOptions,
  BuildWorkspaceTaskHooks,
} from '@sewing-kit/tasks';
import {TargetBuilder, Target, Step} from '@sewing-kit/core';
import {WebApp, Service, Package} from '@sewing-kit/model';

import {LogLevel} from './ui';
import {run, StepDetails} from './runner';
import {
  createStep,
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

export const build = createCommand(
  {
    '--source-maps': Boolean,
    '--env': String,
    '--cache': Boolean,
  },
  async (
    {'--env': rawEnv, '--source-maps': sourceMaps, '--cache': cache = true},
    context,
  ) => {
    const env = normalizeEnv(rawEnv);

    await runBuild(context, {
      env,
      simulateEnv: env,
      sourceMaps,
      cache,
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
        targets: new WaterfallHook(),
        target: new SeriesHook(),
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
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

      const [targets, context] = await Promise.all([
        hooks.targets.run([new TargetBuilder({project: webApp})]),
        hooks.context.run({}),
      ]);

      const hookContext = {workspace: workspaceContext, project: context};

      const stepsForTarget = async (
        target: Target<WebApp, BuildWebAppTargetOptions>,
      ) => {
        const targetHooks: BuildWebAppTargetHooks = {
          steps: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await hooks.target.run({
          target,
          context: hookContext,
          hooks: targetHooks,
        });

        const configuration = await hooks.configureHooks.run({});

        await targetHooks.configure.run(configuration);
        return targetHooks.steps.run([], configuration);
      };

      const targetBuilderToSteps = new Map<
        TargetBuilder<WebApp, BuildWebAppTargetOptions>,
        readonly Step[]
      >();

      for (const targetBuilder of targets) {
        const targets = targetBuilder.toTargets();

        const steps = targets.map((target) => {
          return createStep(
            {
              id: 'SewingKit.BuildWebAppTarget',
              label: (fmt) =>
                fmt`build web app {emphasis ${
                  webApp.name
                }} variant {subdued ${stringifyVariant(target.options)}}`,
            },
            async (step) => {
              const steps = await stepsForTarget(target);

              if (steps.length === 0) {
                step.log('no build steps available', {
                  level: LogLevel.Debug,
                });
                return;
              }

              await step.runNested(steps);
            },
          );
        });

        targetBuilderToSteps.set(targetBuilder, steps);
      }

      const targetSteps: StepDetails[] = [...targetBuilderToSteps.entries()]
        .map(([builder, steps]) =>
          steps.map(
            (step): StepDetails => ({
              step,
              target: webApp,
              dependencies: [...builder.needs].flatMap(
                (needed) => targetBuilderToSteps.get(needed) ?? [],
              ),
            }),
          ),
        )
        .flat();

      const additionalSteps: StepDetails[] = [];

      if (hooks.steps.hasHooks) {
        const nonVariantSteps = await hooks.steps.run([], hookContext);

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
          dependencies: targetSteps.map(({step}) => step),
        });
      }

      return [...targetSteps, ...additionalSteps];
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
        configureHooks: new WaterfallHook(),
        targets: new WaterfallHook(),
        target: new SeriesHook(),
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

      const [targets, context] = await Promise.all([
        hooks.targets.run([new TargetBuilder({project: service})]),
        hooks.context.run({}),
      ]);

      const hookContext = {workspace: workspaceContext, project: context};

      const stepsForTarget = async (
        target: Target<Service, BuildServiceTargetOptions>,
      ) => {
        const targetHooks: BuildServiceTargetHooks = {
          steps: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await hooks.target.run({
          target,
          context: hookContext,
          hooks: targetHooks,
        });

        const configuration = await hooks.configureHooks.run({});

        await targetHooks.configure.run(configuration);
        return targetHooks.steps.run([], configuration);
      };

      const targetBuilderToSteps = new Map<
        TargetBuilder<Service, BuildServiceTargetOptions>,
        readonly Step[]
      >();

      for (const targetBuilder of targets) {
        const targets = targetBuilder.toTargets();

        const steps = targets.map((target) => {
          return createStep(
            {
              id: 'SewingKit.BuildServiceTarget',
              label: (fmt) =>
                fmt`build service {emphasis ${
                  service.name
                }} variant {subdued ${stringifyVariant(target.options)}}`,
            },
            async (step) => {
              const steps = await stepsForTarget(target);

              if (steps.length === 0) {
                step.log('no build steps available', {
                  level: LogLevel.Debug,
                });
                return;
              }

              await step.runNested(steps);
            },
          );
        });

        targetBuilderToSteps.set(targetBuilder, steps);
      }

      const targetSteps: StepDetails[] = [...targetBuilderToSteps.entries()]
        .map(([builder, steps]) =>
          steps.map(
            (step): StepDetails => ({
              step,
              target: service,
              dependencies: [...builder.needs].flatMap(
                (needed) => targetBuilderToSteps.get(needed) ?? [],
              ),
            }),
          ),
        )
        .flat();

      const additionalSteps: StepDetails[] = [];

      if (hooks.steps.hasHooks) {
        const nonVariantSteps = await hooks.steps.run([], hookContext);

        const step = createStep(
          {
            id: 'SewingKit.BuildWebApp',
            label: (fmt) => fmt`build service {emphasis ${service.name}}`,
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
          dependencies: targetSteps.map(({step}) => step),
        });
      }

      return [...targetSteps, ...additionalSteps];
    }),
  );

  const packageSteps = await Promise.all(
    workspace.packages.map(async (pkg) => {
      const {build} = await createProjectTasksAndApplyPlugins(pkg, taskContext);

      const hooks: BuildPackageHooks = {
        targets: new WaterfallHook(),
        target: new SeriesHook(),
        steps: new WaterfallHook(),
        context: new WaterfallHook(),
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

      const [targets, context] = await Promise.all([
        hooks.targets.run([new TargetBuilder({project: pkg})]),
        hooks.context.run({}),
      ]);

      const hookContext = {workspace: workspaceContext, project: context};

      const stepsForTarget = async (
        target: Target<Package, BuildPackageTargetOptions>,
      ) => {
        const targetHooks: BuildPackageTargetHooks = {
          steps: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await hooks.target.run({
          target,
          context: hookContext,
          hooks: targetHooks,
        });

        const configuration = await hooks.configureHooks.run({});

        await targetHooks.configure.run(configuration);
        return targetHooks.steps.run([], configuration);
      };

      const targetBuilderToSteps = new Map<
        TargetBuilder<Package, BuildPackageTargetOptions>,
        readonly Step[]
      >();

      for (const targetBuilder of targets) {
        const targets = targetBuilder.toTargets();

        const steps = targets.map((target) => {
          return createStep(
            {
              id: 'SewingKit.BuildPackageTarget',
              label: (fmt) =>
                fmt`build package {emphasis ${
                  pkg.name
                }} variant {subdued ${stringifyVariant(target.options)}}`,
            },
            async (step) => {
              const steps = await stepsForTarget(target);

              if (steps.length === 0) {
                step.log('no build steps available', {
                  level: LogLevel.Debug,
                });
                return;
              }

              await step.runNested(steps);
            },
          );
        });

        targetBuilderToSteps.set(targetBuilder, steps);
      }

      const targetSteps: StepDetails[] = [...targetBuilderToSteps.entries()]
        .map(([builder, steps]) =>
          steps.map(
            (step): StepDetails => ({
              step,
              target: pkg,
              dependencies: [...builder.needs].flatMap(
                (needed) => targetBuilderToSteps.get(needed) ?? [],
              ),
            }),
          ),
        )
        .flat();

      const additionalSteps: StepDetails[] = [];

      if (hooks.steps.hasHooks) {
        const nonVariantSteps = await hooks.steps.run([], hookContext);

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
          dependencies: targetSteps.map(({step}) => step),
        });
      }

      return [...targetSteps, ...additionalSteps];
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
