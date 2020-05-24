import {WaterfallHook, SeriesHook} from '@sewing-kit/hooks';
import {TypeCheckOptions, TypeCheckWorkspaceTaskHooks} from '@sewing-kit/tasks';

import {run} from './runner';
import {
  createCommand,
  TaskContext,
  createWorkspaceTasksAndApplyPlugins,
} from './common';

export const typeCheck = createCommand(
  {
    '--watch': Boolean,
    '--cache': Boolean,
  },
  async ({'--watch': watch, '--cache': cache = true}, context) => {
    await runTypeCheck(context, {
      watch,
      cache,
    });
  },
);

export async function runTypeCheck(
  taskContext: TaskContext,
  options: TypeCheckOptions,
) {
  const {workspace} = taskContext;
  const {typeCheck} = await createWorkspaceTasksAndApplyPlugins(taskContext);

  const hooks: TypeCheckWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
    context: new WaterfallHook(),
  };

  await typeCheck.run({
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
    title: 'type-check',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success type-check completed successfully!}`);
    },
  });
}
