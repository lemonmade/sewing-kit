import {
  toArgs,
  addHooks,
  WaterfallHook,
  createWorkspaceLintPlugin,
  DiagnosticError,
  LogLevel,
} from '@sewing-kit/plugins';

export interface ESLintFlags {
  readonly eslintrc?: false;
  readonly config?: string;
  readonly env?: string[];
  readonly ext?: string[];
  readonly global?: string[];
  readonly parser?: string;
  readonly parserOptions?: object;
  readonly resolvePluginsRelativeTo?: string;
  readonly rulesdir?: string;
  readonly plugin?: string[];
  readonly rule?: object;
  readonly fix?: boolean;
  readonly fixDryRun?: boolean;
  readonly fixType?: ('problem' | 'suggestion' | 'layout')[];
  readonly ignorePath?: string;
  readonly ignore?: false;
  readonly ignorePattern?: string[];
  readonly quite?: boolean;
  readonly maxWarnings?: number;
  readonly outputFile?: string;
  readonly format?: string;
  readonly color?: boolean;
  readonly cache?: boolean;
  readonly cacheFile?: string;
  readonly cacheLocation?: string;
  readonly noErrorOnUnmatchedPattern?: boolean;
  readonly debug?: true;
}

export interface ESLintHooks {
  readonly eslintExtensions: WaterfallHook<readonly string[]>;
  readonly eslintFlags: WaterfallHook<ESLintFlags>;
}

declare module '@sewing-kit/hooks' {
  interface LintWorkspaceConfigurationCustomHooks extends ESLintHooks {}
}

const PLUGIN = 'SewingKit.ESLint';

export function eslint() {
  return createWorkspaceLintPlugin(PLUGIN, ({hooks, options, api}) => {
    hooks.configureHooks.hook(
      addHooks<ESLintHooks>(() => ({
        eslintExtensions: new WaterfallHook(),
        eslintFlags: new WaterfallHook(),
      })),
    );

    hooks.steps.hook((steps, {configuration}) => [
      ...steps,
      api.createStep({id: 'ESLint.Lint', label: 'run eslint'}, async (step) => {
        const {fix = false} = options;
        const extensions = await configuration.eslintExtensions!.run([
          '.mjs',
          '.js',
        ]);
        const args = toArgs(
          await configuration.eslintFlags!.run({
            fix,
            maxWarnings: 0,
            format: 'codeframe',
            cache: true,
            cacheLocation: api.cachePath('eslint/'),
            ext: [...extensions],
            noErrorOnUnmatchedPattern: options.allowEmpty,
          }),
          {dasherize: true},
        );

        try {
          await step.exec('node_modules/.bin/eslint', ['.', ...args], {
            all: true,
            env: {FORCE_COLOR: '1'},
          });
        } catch (error) {
          if (/No files matching the pattern .* were found/.test(error.all)) {
            step.log(`ESLint failed with error output:\n${error.all}`, {
              level: LogLevel.Debug,
            });

            throw new DiagnosticError({
              title: 'eslint failed because no files were found to lint',
              suggestion: (fmt) =>
                fmt`Add at least one file with a .${
                  extensions.length === 1
                    ? extensions[0]
                    : `{${extensions.join(',')}}`
                } extension, or add additional sewing-kit plugins that will add more file extensions to the {code eslintExtensions} hook. Alternatively, you can remove the eslint plugin, or pass the {code --allow-empty} flag to the {code sewing-kit lint} command.`,
            });
          }

          throw new DiagnosticError({
            title: 'ESLint found lint errors.',
            content: error.all,
          });
        }
      }),
    ]);
  });
}
