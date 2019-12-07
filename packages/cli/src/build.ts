import {createCommand} from './common';

export const build = createCommand(
  {
    '--source-maps': Boolean,
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      '--source-maps': sourceMaps,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    context,
  ) => {
    const {runBuild, Env} = await import('@sewing-kit/core');
    await runBuild(context, {
      env: Env.Development,
      simulateEnv: Env.Development,
      sourceMaps,
      skip,
      skipPre,
      skipPost,
    });
  },
);
