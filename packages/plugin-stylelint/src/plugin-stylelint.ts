import {
  toArgs,
  LogLevel,
  WaterfallHook,
  createWorkspaceLintPlugin,
  DiagnosticError,
} from '@sewing-kit/plugins';

export interface StylelintFlags {
  readonly fix?: boolean;
  readonly quiet?: boolean;
  readonly color?: boolean;
  readonly cache?: boolean;
  readonly config?: string;
  readonly syntax?: string;
  readonly formatter?: string;
  readonly maxWarnings?: number;
  readonly customSyntax?: string;
  readonly cacheLocation?: string;
  readonly ignorePattern?: readonly string[];
  readonly ignoreDisables?: boolean;
  readonly allowEmptyInput?: boolean;
  readonly reportNeedlessDisables?: boolean;
  readonly reportInvalidScopeDisables?: boolean;
}

declare module '@sewing-kit/hooks' {
  interface LintWorkspaceConfigurationCustomHooks {
    readonly stylelintFlags: WaterfallHook<StylelintFlags>;
    readonly stylelintExtensions: WaterfallHook<readonly string[]>;
    readonly stylelintIgnorePatterns: WaterfallHook<readonly string[]>;
  }
}

interface Options {
  readonly flags?: StylelintFlags;
  readonly extensions?: string[];
  readonly ignorePatterns?: string[];
}

const PLUGIN = 'SewingKit.Stylelint';

export function stylelint({
  flags: baseFlags = {},
  extensions: baseExtensions = ['.css'],
  ignorePatterns: baseIgnorePatterns = [],
}: Options = {}) {
  return createWorkspaceLintPlugin(PLUGIN, ({hooks, options, api}) => {
    hooks.configureHooks.hook((hooks) => ({
      ...hooks,
      stylelintFlags: new WaterfallHook(),
      stylelintExtensions: new WaterfallHook(),
      stylelintIgnorePatterns: new WaterfallHook(),
    }));

    hooks.steps.hook((steps, {configuration}) => [
      ...steps,
      api.createStep(
        {id: 'Stylelint.Lint', label: 'run stylelint'},
        async (step) => {
          const {fix = false, allowEmpty = false} = options;
          const [extensions, ignorePatterns] = await Promise.all([
            configuration.stylelintExtensions!.run(baseExtensions),
            configuration.stylelintIgnorePatterns!.run(baseIgnorePatterns),
          ] as const);

          if (extensions.length === 0) {
            if (allowEmpty) {
              step.log(
                'passing stylelint despite the absence of extensions from the stylelintExtensions hook because the allowEmpty option was passed',
                {
                  level: LogLevel.Debug,
                },
              );

              return;
            }

            throw new DiagnosticError({
              title: 'no stylelint extensions found',
              content:
                'After processing the stylelintExtensions hook, no extensions were found. This means stylelint will not run on any files.',
              suggestion:
                'Add a plugin that will add extensions to the stylelintExtensions array, or remove whatever plugin is currently removing the default .css extension.',
            });
          }

          const args = toArgs(
            await configuration.stylelintFlags!.run({
              fix,
              maxWarnings: 0,
              cache: true,
              color: true,
              cacheLocation: api.cachePath('stylelint/'),
              reportNeedlessDisables: true,
              // re-enable once https://github.com/stylelint/stylelint/pull/4498 is released
              // reportInvalidScopeDisables: true,
              ignorePattern: ignorePatterns,
              allowEmptyInput: allowEmpty,
              ...baseFlags,
            }),
            {dasherize: true},
          );

          const normalizedExtensions = [
            ...new Set(extensions.map((ext) => ext.replace(/^\./, ''))),
          ];
          const globs = normalizedExtensions.map(
            (extension) => `./**/*.${extension}`,
          );

          try {
            await step.exec(
              'node_modules/.bin/stylelint',
              [...globs, ...args],
              {
                all: true,
              },
            );
          } catch (error) {
            // @see https://github.com/stylelint/stylelint/blob/master/docs/user-guide/cli.md#exit-codes

            if (error.exitCode === 78) {
              if (allowEmpty) {
                step.log(
                  'passing stylelint despite configuration file errors because the allowEmpty option was passed',
                  {
                    level: LogLevel.Debug,
                  },
                );
                step.log('error from stylelint:', {level: LogLevel.Debug});
                step.log(error.all, {level: LogLevel.Debug});

                return;
              }

              throw new DiagnosticError({
                title:
                  'stylelint could not find any rules in your configuration file',
                suggestion: (fmt) =>
                  fmt`Add a {code rules} property to your {link stylelint config https://stylelint.io/user-guide/configuration#rules}.`,
              });
            }

            if (
              /No configuration provided/.test(error.all ?? '') ||
              /TypeError: Cannot read property 'rules' of undefined/.test(
                error.all ?? '',
              )
            ) {
              if (allowEmpty) {
                step.log(
                  'passing stylelint despite the absence of a configuration file because the allowEmpty option was passed',
                  {
                    level: LogLevel.Debug,
                  },
                );

                return;
              }

              throw new DiagnosticError({
                title:
                  'stylelint failed because there was no configuration file',
                suggestion: (fmt) =>
                  fmt`Add a {code stylelint.config.js} somewhere in your project. Learn more about configuring stylelint on its {link configuration help page https://stylelint.io/user-guide/configuration}.`,
              });
            }

            if (
              /No files matching the pattern/.test(error.all ?? '') ||
              error.exitCode === 80
            ) {
              if (allowEmpty) {
                step.log(
                  'passing stylelint despite the absence of lint-able files because the allowEmpty option was passed',
                  {
                    level: LogLevel.Debug,
                  },
                );

                return;
              }

              throw new DiagnosticError({
                title: 'stylelint failed because no files were found to lint',
                suggestion: (fmt) =>
                  fmt`Add at least one file with a .${
                    normalizedExtensions.length === 1
                      ? normalizedExtensions[0]
                      : `{${normalizedExtensions.join(',')}}`
                  } extension, or add additional sewing-kit plugins that will add more file extensions to the {code stylelintExtensions} hook. Alternatively, you can remove the stylelint plugin, or pass the {code --allow-empty} flag to the {code sewing-kit lint} command.`,
              });
            }

            throw new DiagnosticError({
              title: 'stylelint found lint errors',
              content: error.all?.trim(),
            });
          }
        },
      ),
    ]);
  });
}

type ConfigurationGetter<T> =
  | T
  | ((
      configure: import('@sewing-kit/hooks').LintWorkspaceConfigurationHooks,
    ) => T | Promise<T>);

export function stylelintFlags(getFlags: ConfigurationGetter<StylelintFlags>) {
  return createWorkspaceLintPlugin(`${PLUGIN}.SetFlags`, ({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.stylelintFlags!.hook(async (flags) => ({
        ...flags,
        ...(await unwrapConfigurationGetter(getFlags, configure)),
      }));
    });
  });
}

export function stylelintExtensions(
  getExtensions: ConfigurationGetter<string[]>,
) {
  return createWorkspaceLintPlugin(`${PLUGIN}.SetExtensions`, ({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.stylelintExtensions!.hook(async (extensions) => [
        ...extensions,
        ...(await unwrapConfigurationGetter(getExtensions, configure)),
      ]);
    });
  });
}

export function stylelintIgnorePatterns(
  getIgnorePatterns: ConfigurationGetter<string[]>,
) {
  return createWorkspaceLintPlugin(`${PLUGIN}.SetIgnorePatterns`, ({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.stylelintIgnorePatterns!.hook(async (ignorePatterns) => [
        ...ignorePatterns,
        ...(await unwrapConfigurationGetter(getIgnorePatterns, configure)),
      ]);
    });
  });
}

function unwrapConfigurationGetter<T>(
  getter: ConfigurationGetter<T>,
  configure: import('@sewing-kit/hooks').LintWorkspaceConfigurationHooks,
): T | Promise<T> {
  return typeof getter === 'function' ? (getter as any)(configure) : getter;
}
