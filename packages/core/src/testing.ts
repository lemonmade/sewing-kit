import {
  SeriesHook,
  WaterfallHook,
  TestPackageHooks,
  TestWebAppHooks,
} from '@sewing-kit/hooks';
import {TestTaskOptions, TestWorkspaceTaskHooks} from '@sewing-kit/tasks';
import {Package, WebApp, Service} from '@sewing-kit/model';
import {run} from '@sewing-kit/ui';

import {
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

export async function runTests(
  {ui, workspace, delegate}: TaskContext,
  options: TestTaskOptions,
) {
  const hooks: TestWorkspaceTaskHooks = {
    context: new WaterfallHook(),
    configure: new SeriesHook(),
    configureHooks: new WaterfallHook(),
    pre: new WaterfallHook(),
    post: new WaterfallHook(),
    steps: new WaterfallHook(),
  };

  const {test} = await createWorkspaceTasksAndApplyPlugins(workspace, delegate);

  await test.run({hooks, options});

  const configuration = await hooks.configureHooks.run({});
  await hooks.configure.run(configuration);

  const context = await hooks.context.run({configuration});

  await Promise.all(
    workspace.projects.map(async (project) => {
      const {test: testProject} = await createProjectTasksAndApplyPlugins(
        project,
        workspace,
        delegate,
      );

      if (project instanceof Package) {
        const hooks: TestPackageHooks = {
          configureHooks: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await testProject.run({hooks, options, context});
        await hooks.configure.run(await hooks.configureHooks.run({}));
      } else if (project instanceof WebApp) {
        const hooks: TestWebAppHooks = {
          configureHooks: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await testProject.run({hooks, options, context});
        await hooks.configure.run(await hooks.configureHooks.run({}));
      } else if (project instanceof Service) {
        const hooks: TestWebAppHooks = {
          configureHooks: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        await testProject.run({hooks, options, context});
        await hooks.configure.run(await hooks.configureHooks.run({}));
      }
    }),
  );

  const stepDetails = {configuration, context};
  const pre = await hooks.pre.run([], stepDetails);
  const steps = await hooks.steps.run([], stepDetails);
  const post = await hooks.post.run([], stepDetails);

  const {include, skip, skipPre, skipPost} = options;

  await run(ui, {
    title: 'test',
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
      steps: steps.map((step) => ({step, target: workspace})),
      skip,
      include,
      flagNames: {skip: 'skip', include: 'include'},
    },
    epilogue(log) {
      log((fmt) => fmt`{success tests completed successfully!}`);
    },
  });
}
