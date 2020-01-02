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
  context: TaskContext,
  options: TypeCheckOptions,
) {
  const {workspace} = context;
  const {typeCheck} = await createWorkspaceTasksAndApplyPlugins(context);

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

  await run(context, {
    title: 'type-check',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success type-check completed successfully!}`);
    },
  });
}
