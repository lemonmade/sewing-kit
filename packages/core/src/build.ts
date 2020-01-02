import {
  WaterfallHook,
  SeriesHook,
  BuildServiceHooks,
  BuildWebAppHooks,
  BuildPackageHooks,
} from '@sewing-kit/hooks';
import {BuildTaskOptions, BuildWorkspaceTaskHooks} from '@sewing-kit/tasks';
import {run, LogLevel} from '@sewing-kit/ui';

import {
  createStep,
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

      return Promise.all(
        variants.map(async (variant) => {
          const steps = await stepsForVariant(variant);

          const variantLabel: import('@sewing-kit/ui').Loggable =
            variants.length > 1
              ? (fmt) =>
                  fmt`web app {emphasis ${
                    webApp.name
                  }} variant {subdued ${stringifyVariant(variant)}}`
              : (fmt) => fmt`web app {emphasis ${webApp.name}}`;

          const step = createStep(
            {
              id:
                variants.length > 1
                  ? 'SewingKit.BuildPackageVariant'
                  : 'SewingKit.BuildPackage',
              label: (fmt) => fmt`build ${variantLabel}`,
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
        }),
      );
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

      const serviceLabel: import('@sewing-kit/ui').Loggable = (fmt) =>
        fmt`service {emphasis ${service.name}}`;

      const step = createStep(
        {
          id: 'SewingKit.BuildService',
          label: (fmt) => fmt`build ${serviceLabel}`,
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

      return Promise.all(
        variants.map(async (variant) => {
          const configuration = await hooks.configureHooks.run({});
          await hooks.configure.run(configuration, variant);

          const context = await hooks.context.run({variant, configuration});
          const steps = await hooks.steps.run([], context);

          const variantLabel: import('@sewing-kit/ui').Loggable =
            variants.length > 1
              ? (fmt) =>
                  fmt`package {emphasis ${
                    pkg.name
                  }} variant {subdued ${stringifyVariant(variant)}}`
              : (fmt) => fmt`package {emphasis ${pkg.name}}`;

          const step = createStep(
            {
              id:
                variants.length > 1
                  ? 'SewingKit.BuildWebAppVariant'
                  : 'SewingKit.BuildWebApp',
              label: (fmt) => fmt`build ${variantLabel}`,
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
    }),
  );

  const allSteps = [
    ...packageSteps.flat(),
    ...webAppSteps.flat(),
    ...serviceSteps.flat(),
  ];

  const configuration = await buildTaskHooks.configureHooks.run({});
  await buildTaskHooks.configure.run(configuration);

  const [pre, post] = await Promise.all([
    buildTaskHooks.pre.run([], {configuration}),
    buildTaskHooks.post.run([], {configuration}),
  ]);

  const {include, skip, skipPre, skipPost} = options;

  await run(ui, {
    title: 'build',
    pre: {
      steps: pre.map((step) => ({step, target: workspace})),
      skip: skipPre,
      flagNames: {skip: 'skip-pre', include: 'include-pre'},
    },
    post: {
      steps: post.map((step) => ({step, target: workspace})),
      skip: skipPost,
      flagNames: {skip: 'skip-post', include: 'include-post'},
    },
    steps: {
      steps: allSteps,
      skip,
      include,
      flagNames: {skip: 'skip', include: 'include'},
    },
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
