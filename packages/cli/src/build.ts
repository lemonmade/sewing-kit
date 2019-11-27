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
    workspace,
    runner,
  ) => {
    const {Env} = await import('@sewing-kit/types');
    const {runBuild} = await import('@sewing-kit/core');
    await runBuild(
      {
        env: Env.Development,
        simulateEnv: Env.Development,
        sourceMaps,
        skip,
        skipPre,
        skipPost,
      },
      workspace,
      runner,
    );
  },
);
