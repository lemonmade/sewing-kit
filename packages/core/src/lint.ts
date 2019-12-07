import {AsyncSeriesHook, AsyncSeriesWaterfallHook} from 'tapable';

import {run} from '@sewing-kit/ui';
import {LintWorkspaceConfigurationHooks} from '@sewing-kit/hooks';
import {LintTaskOptions, LintWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {TaskContext, createWorkspaceTasksAndApplyPlugins} from './common';

export async function runLint(
  {delegate, workspace, ui}: TaskContext,
  options: LintTaskOptions,
) {
  const {lint} = await createWorkspaceTasksAndApplyPlugins(workspace, delegate);

  const hooks: LintWorkspaceTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
  };

  await lint.promise({
    hooks,
    options,
    workspace,
  });

  const configurationHooks: LintWorkspaceConfigurationHooks = {};
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
    runner.title('lint');

    await runner.pre(pre, skipPre);
    await runner.steps(steps, {skip, id: 'lint', separator: pre.length > 0});
    await runner.post(post, skipPost);

    runner.epilogue((fmt) => fmt`{success linting completed successfully}`);
  });
}
