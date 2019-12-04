import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {run} from '@sewing-kit/ui';

import {Runner} from '../../runner';
import {Workspace} from '../../workspace';

import {TypeCheckOptions, TypeCheckTaskHooks} from './types';

export async function runTypeCheck(
  options: TypeCheckOptions,
  workspace: Workspace,
  runner: Runner,
) {
  const hooks: TypeCheckTaskHooks = {
    configure: new AsyncSeriesHook(['configurationHooks']),
    pre: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    steps: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
    post: new AsyncSeriesWaterfallHook(['steps', 'stepDetails']),
  };

  await runner.tasks.typeCheck.promise({
    hooks,
    options,
    workspace,
  });

  const configurationHooks = {};
  await hooks.configure.promise(configurationHooks);

  const pre = await hooks.pre.promise([], {configuration: configurationHooks});
  const steps = await hooks.steps.promise([], {
    configuration: configurationHooks,
  });
  const post = await hooks.post.promise([], {
    configuration: configurationHooks,
  });

  const {skip, skipPre, skipPost} = options;

  await run(runner.ui, async (runner) => {
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
