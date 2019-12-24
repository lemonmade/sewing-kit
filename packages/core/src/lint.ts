import {run} from '@sewing-kit/ui';
import {SeriesHook, WaterfallHook} from '@sewing-kit/hooks';
import {LintTaskOptions, LintWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {TaskContext, createWorkspaceTasksAndApplyPlugins} from './common';

export async function runLint(
  {delegate, workspace, ui}: TaskContext,
  options: LintTaskOptions,
) {
  const {lint} = await createWorkspaceTasksAndApplyPlugins(workspace, delegate);

  const hooks: LintWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  await lint.run({
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
    runner.title('lint');

    await runner.pre(pre, skipPre);
    await runner.steps(steps, {skip, id: 'lint', separator: pre.length > 0});
    await runner.post(post, skipPost);

    runner.epilogue((fmt) => fmt`{success linting completed successfully}`);
  });
}
