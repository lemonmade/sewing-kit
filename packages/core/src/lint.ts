import {run} from '@sewing-kit/ui';
import {
  SeriesHook,
  WaterfallHook,
  LintWorkspaceConfigurationHooks,
} from '@sewing-kit/hooks';
import {LintTaskOptions, LintWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {TaskContext, createWorkspaceTasksAndApplyPlugins} from './common';

export async function runLint(
  {delegate, workspace, ui}: TaskContext,
  options: LintTaskOptions,
) {
  const {lint} = await createWorkspaceTasksAndApplyPlugins(workspace, delegate);

  const hooks: LintWorkspaceTaskHooks = {
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
  };

  await lint.run({
    hooks,
    options,
  });

  const configurationHooks: LintWorkspaceConfigurationHooks = {};
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
    runner.title('lint');

    await runner.pre(pre, skipPre);
    await runner.steps(steps, {skip, id: 'lint', separator: pre.length > 0});
    await runner.post(post, skipPost);

    runner.epilogue((fmt) => fmt`{success linting completed successfully}`);
  });
}
