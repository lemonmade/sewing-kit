import {
  toArgs,
  addHooks,
  WaterfallHook,
  createWorkspaceLintPlugin,
  DiagnosticError,
} from '@sewing-kit/plugins';

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
    readonly eslintExtensions: WaterfallHook<string[]>;
    readonly eslintFlags: WaterfallHook<EslintFlags>;
  }
}

const PLUGIN = 'SewingKit.Eslint';

const addRootConfigurationHooks = addHooks<
  import('@sewing-kit/hooks').LintWorkspaceConfigurationHooks
>(() => ({
  eslintExtensions: new WaterfallHook(),
  eslintFlags: new WaterfallHook(),
}));

export function eslint() {
  return createWorkspaceLintPlugin(PLUGIN, ({hooks, options, api}) => {
    hooks.configure.hook(addRootConfigurationHooks);

    hooks.steps.hook((steps, {configuration}) => [
      ...steps,
      api.createStep({label: 'Linting scripts with ESLint'}, async (step) => {
        const {fix = false} = options;
        const extensions = await configuration.eslintExtensions!.run([]);
        const args = toArgs(
          await configuration.eslintFlags!.run({
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
  });
}
