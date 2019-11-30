import {createCommand} from './common';

export const lint = createCommand(
  {
    '--fix': Boolean,
    '--cache': Boolean,
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      '--fix': fix,
      '--cache': cache = true,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    workspace,
    runner,
  ) => {
    const {runLint} = await import('@sewing-kit/core');
    await runLint({fix, cache, skip, skipPre, skipPost}, workspace, runner);
  },
);
