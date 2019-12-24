import {run} from '@sewing-kit/ui';
import {
  WaterfallHook,
  SeriesHook,
  TypeCheckWorkspaceConfigurationHooks,
} from '@sewing-kit/hooks';
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
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  await typeCheck.run({
    hooks,
    options,
  });

  const configurationHooks: TypeCheckWorkspaceConfigurationHooks = {};
  await hooks.configure.run(configurationHooks);

  const pre = await hooks.pre.run([], {configuration: configurationHooks});
  const steps = await hooks.steps.run([], {
    configuration: configurationHooks,
  });
  const post = await hooks.post.run([], {
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
