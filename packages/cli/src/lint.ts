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
  },
  async ({'--fix': fix, '--cache': cache = true}, context) => {
    await runLint(context, {fix, cache});
  },
);

async function runLint(context: TaskContext, options: LintTaskOptions) {
  const {workspace} = context;
  const {lint} = await createWorkspaceTasksAndApplyPlugins(context);

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

  await run(context, {
    title: 'lint',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success lint completed successfully!}`);
    },
  });
}
