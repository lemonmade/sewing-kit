import {createCommand} from './common';

export const test = createCommand(
  {
    '--help': Boolean,
    '--no-watch': Boolean,
    '--coverage': Boolean,
    '--debug': Boolean,
    '--update-snapshot': Boolean,
    '--test-name-pattern': String,
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
      '--update-snapshot': updateSnapshot,
      '--no-watch': noWatch,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    workspace,
    runner,
  ) => {
    const {runTests} = await import('@sewing-kit/core');

    await runTests(
      {
        debug,
        coverage,
        testPattern,
        testNamePattern,
        updateSnapshot,
        watch: noWatch == null ? noWatch : !noWatch,
        skip,
        skipPre,
        skipPost,
      },
      workspace,
      runner,
    );
  },
);
