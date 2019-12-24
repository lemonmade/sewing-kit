import {run} from '@sewing-kit/ui';
import {WaterfallHook, SeriesHook} from '@sewing-kit/hooks';
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
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  await typeCheck.run({
    hooks,
    options,
  });

  const configuration = await hooks.configureHooks.run({});
  await hooks.configure.run(configuration);

  const pre = await hooks.pre.run([], {configuration});
  const steps = await hooks.steps.run([], {
    configuration,
  });
  const post = await hooks.post.run([], {
    configuration,
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
