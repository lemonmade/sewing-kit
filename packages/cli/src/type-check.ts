import {createCommand} from './common';

export const typeCheck = createCommand(
  {
    '--watch': Boolean,
    '--cache': Boolean,
    '--include': [String],
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      '--watch': watch,
      '--cache': cache = true,
      '--include': include,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    context,
  ) => {
    const {runTypeCheck} = await import('@sewing-kit/core');
    await runTypeCheck(context, {
      watch,
      cache,
      include,
      skip,
      skipPre,
      skipPost,
    });
  },
);
