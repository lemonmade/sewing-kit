import {createCommand} from './common';

export const build = createCommand(
  {
    '--source-maps': Boolean,
    '--env': String,
    '--include': [String],
    '--skip': [String],
    '--skip-pre': [String],
    '--skip-post': [String],
  },
  async (
    {
      '--env': rawEnv,
      '--source-maps': sourceMaps,
      '--include': include,
      '--skip': skip,
      '--skip-pre': skipPre,
      '--skip-post': skipPost,
    },
    context,
  ) => {
    const {runBuild, Env} = await import('@sewing-kit/core');
    const env = normalizeEnv(rawEnv, Env);

    await runBuild(context, {
      env,
      simulateEnv: env,
      sourceMaps,
      include,
      skip,
      skipPre,
      skipPost,
    });
  },
);

function normalizeEnv(
  rawEnv: string | undefined,
  Env: typeof import('@sewing-kit/tasks').Env,
) {
  if (rawEnv == null) {
    return Env.Production;
  }

  return /prod(?:uction)?/i.test(rawEnv) ? Env.Production : Env.Development;
}
