import {
  SeriesHook,
  WaterfallHook,
  TestPackageHooks,
  TestWebAppHooks,
} from '@sewing-kit/hooks';
import {TestTaskOptions, TestWorkspaceTaskHooks} from '@sewing-kit/tasks';
import {Package, WebApp, Service} from '@sewing-kit/model';

import {run} from './runner';
import {
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
  createProjectTasksAndApplyPlugins,
} from './common';

export const test = createCommand(
  {
    '--help': Boolean,
    '--no-watch': Boolean,
    '--coverage': Boolean,
    '--debug': Boolean,
    '--update-snapshots': Boolean,
    '--test-name-pattern': String,
  },
  async (
    {
      _: [testPattern],
      '--debug': debug,
      '--coverage': coverage,
      '--test-name-pattern': testNamePattern,
      '--update-snapshots': updateSnapshots,
      '--no-watch': noWatch,
    },
    context,
  ) => {
    await runTests(context, {
      debug,
      coverage,
      testPattern,
      testNamePattern,
      updateSnapshots,
      watch: noWatch == null ? noWatch : !noWatch,
    });
  },
);

export async function runTests(
  taskContext: TaskContext,
  options: TestTaskOptions,
) {
  const {workspace} = taskContext;

  const testTaskHooks: TestWorkspaceTaskHooks = {
    context: new WaterfallHook(),
    configure: new SeriesHook(),
    configureHooks: new WaterfallHook(),
    pre: new WaterfallHook(),
    post: new WaterfallHook(),
    steps: new WaterfallHook(),
    project: new SeriesHook(),
    package: new SeriesHook(),
    service: new SeriesHook(),
    webApp: new SeriesHook(),
  };

  const {test} = await createWorkspaceTasksAndApplyPlugins(taskContext);

  await test.run({hooks: testTaskHooks, options});

  const configuration = await testTaskHooks.configureHooks.run({});
  await testTaskHooks.configure.run(configuration);

  const workspaceContext = await testTaskHooks.context.run({configuration});

  await Promise.all(
    workspace.projects.map(async (project) => {
      const {test} = await createProjectTasksAndApplyPlugins(
        project,
        taskContext,
      );

      if (project instanceof Package) {
        const hooks: TestPackageHooks = {
          configureHooks: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        const details = {
          options,
          hooks,
          context: workspaceContext,
        };

        const projectDetails = {
          project,
          ...details,
        };

        await testTaskHooks.project.run(projectDetails);
        await testTaskHooks.webApp.run(projectDetails);
        await test.run(details);
        await hooks.configure.run(await hooks.configureHooks.run({}));
      } else if (project instanceof WebApp) {
        const hooks: TestWebAppHooks = {
          configureHooks: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        const details = {
          options,
          hooks,
          context: workspaceContext,
        };

        const projectDetails = {
          project,
          ...details,
        };

        await testTaskHooks.project.run(projectDetails);
        await testTaskHooks.webApp.run(projectDetails);
        await test.run(details);
        await hooks.configure.run(await hooks.configureHooks.run({}));
      } else if (project instanceof Service) {
        const hooks: TestWebAppHooks = {
          configureHooks: new WaterfallHook(),
          configure: new SeriesHook(),
        };

        const details = {
          options,
          hooks,
          context: workspaceContext,
        };

        const projectDetails = {
          project,
          ...details,
        };

        await testTaskHooks.project.run(projectDetails);
        await testTaskHooks.webApp.run(projectDetails);
        await test.run(details);
        await hooks.configure.run(await hooks.configureHooks.run({}));
      }
    }),
  );

  const pre = await testTaskHooks.pre.run([], workspaceContext);
  const steps = await testTaskHooks.steps.run([], workspaceContext);
  const post = await testTaskHooks.post.run([], workspaceContext);

  await run(taskContext, {
    title: 'test',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success tests completed successfully!}`);
    },
  });
}
