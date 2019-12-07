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
    context,
  ) => {
    const {runLint} = await import('@sewing-kit/core');
    await runLint(context, {fix, cache, skip, skipPre, skipPost});
  },
);
