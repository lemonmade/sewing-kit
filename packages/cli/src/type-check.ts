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
    workspace,
    runner,
  ) => {
    const {runTypeCheck} = await import('@sewing-kit/core');
    await runTypeCheck(
      {watch, cache, skip, skipPre, skipPost},
      workspace,
      runner,
    );
  },
);
