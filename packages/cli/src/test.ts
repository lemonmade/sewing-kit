import {createCommand} from './common';

export const test = createCommand(
  {
    '--help': Boolean,
    '--no-watch': Boolean,
    '--coverage': Boolean,
    '--debug': Boolean,
    '--update-snapshots': Boolean,
    '--test-name-pattern': String,
    '--include': [String],
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      _: [testPattern],
      '--debug': debug,
      '--coverage': coverage,
      '--test-name-pattern': testNamePattern,
      '--update-snapshots': updateSnapshots,
      '--no-watch': noWatch,
      '--include': include,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    context,
  ) => {
    const {runTests} = await import('@sewing-kit/core');

    await runTests(context, {
      debug,
      coverage,
      testPattern,
      testNamePattern,
      updateSnapshots,
      watch: noWatch == null ? noWatch : !noWatch,
      include,
      skip,
      skipPre,
      skipPost,
    });
  },
);
