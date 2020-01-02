import {createCommand} from './common';

export const dev = createCommand(
  {
    '--source-maps': Boolean,
    '--include': [String],
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      '--source-maps': sourceMaps,
      '--include': include,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    context,
  ) => {
    const {runDev} = await import('@sewing-kit/core');
    await runDev(context, {sourceMaps, include, skip, skipPre, skipPost});
  },
);
