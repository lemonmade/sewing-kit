import {createCommand} from './common';

export const typeCheck = createCommand(
  {
    '--watch': Boolean,
    '--cache': Boolean,
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      '--watch': watch,
      '--cache': cache = true,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    context,
  ) => {
    const {runTypeCheck} = await import('@sewing-kit/core');
    await runTypeCheck(context, {watch, cache, skip, skipPre, skipPost});
  },
);
