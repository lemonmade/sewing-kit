import {SeriesHook, WaterfallHook} from '@sewing-kit/hooks';
import {LintTaskOptions, LintWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {run} from './runner';
import {
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
} from './common';

export const lint = createCommand(
  {
    '--fix': Boolean,
    '--cache': Boolean,
    '--allow-empty': Boolean,
  },
  async (
    {
      '--fix': fix,
      '--cache': cache = true,
      '--allow-empty': allowEmpty = false,
    },
    context,
  ) => {
    await runLint(context, {fix, cache, allowEmpty});
  },
);

export async function runLint(
  taskContext: TaskContext,
  options: LintTaskOptions,
) {
  const {workspace} = taskContext;
  const {lint} = await createWorkspaceTasksAndApplyPlugins(taskContext);

  const hooks: LintWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
    context: new WaterfallHook(),
  };

  await lint.run({
    hooks,
    options,
  });

  const configuration = await hooks.configureHooks.run({});
  await hooks.configure.run(configuration);

  const context = await hooks.context.run({configuration});

  const pre = await hooks.pre.run([], context);
  const steps = await hooks.steps.run([], context);
  const post = await hooks.post.run([], context);

  await run(taskContext, {
    title: 'lint',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success lint completed successfully!}`);
    },
  });
}
