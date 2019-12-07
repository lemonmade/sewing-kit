import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  TestPackageHooks,
  TestWebAppHooks,
  TestWorkspaceConfigurationHooks,
} from '@sewing-kit/hooks';
import {
  TestTaskOptions,
  TestWorkspaceTaskHooks,
  TestProjectTaskHooks,
} from '@sewing-kit/tasks';
import {Package, WebApp} from '@sewing-kit/model';
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
    context: new AsyncSeriesWaterfallHook(['context']),
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
  };

  const {test} = await createWorkspaceTasksAndApplyPlugins(workspace, delegate);

  await test.promise({hooks, workspace, options});

  const rootConfigHooks: TestWorkspaceConfigurationHooks = {};
  await hooks.configure.promise(rootConfigHooks);

  const context = await hooks.context.promise({});

  await Promise.all(
    workspace.projects.map(async (project) => {
      const hooks: TestProjectTaskHooks = {
        project: new AsyncSeriesHook(['projectWithHooks']),
        package: new AsyncSeriesHook(['packageWithHooks']),
        webApp: new AsyncSeriesHook(['webAppWithHooks']),
      };

      const {test: testProject} = await createProjectTasksAndApplyPlugins(
        project,
        workspace,
        delegate,
      );

      await testProject.promise({hooks, workspace, options, context});

      if (project instanceof Package) {
        const packageHooks: TestPackageHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        const projectDetails = {project, hooks: packageHooks};

        await hooks.project.promise(projectDetails);
        await hooks.package.promise({pkg: project, hooks: packageHooks});
        await packageHooks.configure.promise({});
      } else if (project instanceof WebApp) {
        const webAppHooks: TestWebAppHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        const projectDetails = {project, hooks: webAppHooks};

        await hooks.project.promise(projectDetails);
        await hooks.webApp.promise({webApp: project, hooks: webAppHooks});
        await webAppHooks.configure.promise({});
      }
    }),
  );

  const stepDetails = {configuration: rootConfigHooks, context};
  const pre = await hooks.pre.promise([], stepDetails);
  const steps = await hooks.steps.promise([], stepDetails);
  const post = await hooks.post.promise([], stepDetails);

  const {skip, skipPre, skipPost} = options;

  await run(ui, async (runner) => {
    runner.title('test');

    await runner.pre(pre, skipPre);
    await runner.steps(steps, {skip, id: 'test', separator: pre.length > 0});
    await runner.post(post, skipPost);

    runner.epilogue((fmt) => fmt`{success testing completed successfully}`);
  });
}
