import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';

import {run} from '@sewing-kit/ui';
import {TypeCheckWorkspaceConfigurationHooks} from '@sewing-kit/hooks';
import {TypeCheckOptions, TypeCheckWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {TaskContext, createWorkspaceTasksAndApplyPlugins} from './common';

export async function runTypeCheck(
  {ui, workspace, delegate}: TaskContext,
  options: TypeCheckOptions,
) {
  const {typeCheck} = await createWorkspaceTasksAndApplyPlugins(
    workspace,
    delegate,
  );

  const hooks: TypeCheckWorkspaceTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
  };

  await typeCheck.promise({
    hooks,
    options,
    workspace,
  });

  const configurationHooks: TypeCheckWorkspaceConfigurationHooks = {};
  await hooks.configure.promise(configurationHooks);

  const pre = await hooks.pre.promise([], {configuration: configurationHooks});
  const steps = await hooks.steps.promise([], {
    configuration: configurationHooks,
  });
  const post = await hooks.post.promise([], {
    configuration: configurationHooks,
  });

  const {skip, skipPre, skipPost} = options;

  await run(ui, async (runner) => {
    runner.title('type-check');

    await runner.pre(pre, skipPre);
    await runner.steps(steps, {
      skip,
      id: 'type-check',
      separator: pre.length > 0,
    });
    await runner.post(post, skipPost);

    runner.epilogue((fmt) => fmt`{success type-check completed successfully}`);
  });
}
