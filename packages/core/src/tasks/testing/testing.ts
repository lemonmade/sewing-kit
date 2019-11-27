import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  TestPackageHooks,
  TestWebAppHooks,
  PluginTarget,
} from '@sewing-kit/types';
import {run} from '@sewing-kit/ui';

import {Runner} from '../../runner';
import {Workspace, Package, WebApp} from '../../workspace';

import {TestTaskHooks, TestTaskOptions} from './types';

export async function runTests(
  options: TestTaskOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const hooks: TestTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    project: new AsyncSeriesHook(['projectWithHooks']),
    package: new AsyncSeriesHook(['packageWithHooks']),
    webApp: new AsyncSeriesHook(['webAppWithHooks']),
  };

  await runner.tasks.test.promise({hooks, workspace, options});

  const rootConfigHooks = {};
  await hooks.configure.promise(rootConfigHooks);

  await Promise.all(
    workspace.projects.map(async (project) => {
      if (project instanceof Package) {
        const packageHooks: TestPackageHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        const projectDetails = {project, hooks: packageHooks};

        for (const plugin of project.pluginsForTarget(
          PluginTarget.TestProject,
        )) {
          plugin(projectDetails);
        }

        await hooks.project.promise(projectDetails);
        await hooks.package.promise({pkg: project, hooks: packageHooks});
        await packageHooks.configure.promise({});
      } else if (project instanceof WebApp) {
        const webAppHooks: TestWebAppHooks = {
          configure: new AsyncSeriesHook(['configHooks']),
        };

        const projectDetails = {project, hooks: webAppHooks};

        for (const plugin of project.pluginsForTarget(
          PluginTarget.TestProject,
        )) {
          plugin(projectDetails);
        }

        await hooks.project.promise(projectDetails);
        await hooks.webApp.promise({webApp: project, hooks: webAppHooks});
        await webAppHooks.configure.promise({});
      }
    }),
  );

  const stepDetails = {configuration: rootConfigHooks};
  const pre = await hooks.pre.promise([], stepDetails);
  const steps = await hooks.steps.promise([], stepDetails);
  const post = await hooks.post.promise([], stepDetails);

  const {skip, skipPre, skipPost} = options;
  await run(steps, {ui: runner.ui, pre, post, skip, skipPre, skipPost});
}
