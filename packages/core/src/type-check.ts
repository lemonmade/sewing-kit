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

  const {skip, include, skipPre, skipPost} = options;

  await run(ui, {
    title: 'type-check',
    pre: {
      steps: pre.map((step) => ({step, target: workspace})),
      skip: skipPre,
      flagNames: {skip: 'skip-pre', include: 'include-pre'},
    },
    post: {
      steps: post.map((step) => ({step, target: workspace})),
      skip: skipPost,
      flagNames: {skip: 'skip-post', include: 'include-post'},
    },
    steps: {
      steps: steps.map((step) => ({step, target: workspace})),
      skip,
      include,
      flagNames: {skip: 'skip', include: 'include'},
    },
    epilogue(log) {
      log((fmt) => fmt`{success type-check completed successfully!}`);
    },
  });
}
