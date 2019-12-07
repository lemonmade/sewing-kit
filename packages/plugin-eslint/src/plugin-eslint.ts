import {AsyncSeriesWaterfallHook} from 'tapable';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {} from '@sewing-kit/hooks';
import {addHooks, toArgs, createWorkspaceLintPlugin} from '@sewing-kit/plugins';

interface EslintFlags {
  fix?: boolean;
  maxWarnings?: number;
  format?: string;
  cache?: boolean;
  cacheLocation?: string;
  ext?: string[];
}

declare module '@sewing-kit/hooks' {
  interface LintWorkspaceConfigurationCustomHooks {
    readonly eslintExtensions: AsyncSeriesWaterfallHook<string[]>;
    readonly eslintFlags: AsyncSeriesWaterfallHook<EslintFlags>;
  }
}

const PLUGIN = 'SewingKit.eslint';

const addRootConfigurationHooks = addHooks<
  import('@sewing-kit/hooks').LintWorkspaceConfigurationHooks
>(() => ({
  eslintExtensions: new AsyncSeriesWaterfallHook(['extensions']),
  eslintFlags: new AsyncSeriesWaterfallHook(['flags']),
}));

export const eslintWorkspacePlugin = createWorkspaceLintPlugin(
  PLUGIN,
  ({hooks, options}, api) => {
    hooks.configure.tap(PLUGIN, addRootConfigurationHooks);

    hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
      ...steps,
      createStep({label: 'Linting scripts with ESLint'}, async (step) => {
        const {fix = false} = options;
        const extensions = await configuration.eslintExtensions!.promise([]);
        const args = toArgs(
          await configuration.eslintFlags!.promise({
            fix,
            maxWarnings: 0,
            format: 'codeframe',
            cache: true,
            cacheLocation: api.cachePath('eslint/'),
            ext: extensions,
          }),
          {dasherize: true},
        );

        try {
          await step.exec('node_modules/.bin/eslint', ['.', ...args], {
            all: true,
            env: {FORCE_COLOR: '1'},
          });
        } catch (error) {
          throw new DiagnosticError({
            title: 'ESLint found lint errors.',
            content: error.all,
          });
        }
      }),
    ]);
  },
);
