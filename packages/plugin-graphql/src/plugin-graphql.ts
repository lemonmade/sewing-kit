import {
  Env,
  WebApp,
  Service,
  createProjectPlugin,
  createWorkspaceLintPlugin,
} from '@sewing-kit/plugins';
import type {ExportStyle} from '@sewing-kit/graphql';
import type {} from '@sewing-kit/plugin-jest';
import type {} from '@sewing-kit/plugin-webpack';
import type {} from '@sewing-kit/plugin-eslint';

const PLUGIN = 'SewingKit.GraphQL';

export interface Options {
  readonly export?: ExportStyle;
  readonly extensions?: string[];
}

const DEFAULT_EXTENSIONS = ['.graphql'];

export function graphql({
  export: exportStyle = 'document',
  extensions = DEFAULT_EXTENSIONS,
}: Options = {}) {
  const {jestMatcher, webpackMatcher} = extensionsToMatchers(extensions);

  return createProjectPlugin<Service | WebApp>(
    PLUGIN,
    ({api, project, tasks: {build, dev, test}}) => {
      build.hook(({hooks, options: {simulateEnv}}) => {
        hooks.configure.hook(
          (
            configure: import('@sewing-kit/hooks').BuildProjectConfigurationHooks,
          ) => {
            configure.webpackRules?.hook(async (rules) => {
              const {createCacheLoaderRule} = await import(
                '@sewing-kit/plugin-webpack'
              );

              return [
                ...rules,
                {
                  test: webpackMatcher,
                  use: [
                    await createCacheLoaderRule({
                      env: simulateEnv,
                      api,
                      project,
                      configuration: configure,
                      cachePath: 'graphql',
                      dependencies: ['graphql'],
                    }),
                    {
                      loader: require.resolve('@sewing-kit/graphql/webpack'),
                      options: {export: exportStyle},
                    },
                  ],
                } as import('webpack').RuleSetRule,
              ];
            });
          },
        );
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook(
          (
            configure: import('@sewing-kit/hooks').DevProjectConfigurationHooks,
          ) => {
            configure.webpackRules?.hook(async (rules) => {
              const {createCacheLoaderRule} = await import(
                '@sewing-kit/plugin-webpack'
              );

              return [
                ...rules,
                {
                  test: webpackMatcher,
                  use: [
                    await createCacheLoaderRule({
                      env: Env.Development,
                      api,
                      project,
                      configuration: configure,
                      cachePath: 'graphql',
                      dependencies: ['graphql'],
                    }),
                    {
                      loader: require.resolve('@sewing-kit/graphql/webpack'),
                      options: {export: exportStyle},
                    },
                  ],
                } as import('webpack').RuleSetRule,
              ];
            });
          },
        );
      });

      test.hook(({hooks}) => {
        hooks.configure.hook((hooks) => {
          hooks.jestTransforms?.hook((transforms) => ({
            ...transforms,
            [jestMatcher]:
              exportStyle === 'document'
                ? require.resolve('@sewing-kit/graphql/jest')
                : require.resolve('@sewing-kit/graphql/jest-simple'),
          }));
        });
      });
    },
  );
}

function extensionsToMatchers(extensions: string[]) {
  let extensionPart = '';

  if (extensions.length === 1) {
    extensionPart = stripLeadingDot(extensions[0]);
  } else if (extensions.length > 1) {
    extensionPart = `(${extensions.map(stripLeadingDot).join('|')})`;
  }

  return {
    jestMatcher: `\\.${extensionPart}$`,
    webpackMatcher: new RegExp(`\\.(${extensionPart})$`),
  };
}

// TODO: add pre-build, -lint, -dev, and -type-check step to download
// remote GraphQL schemas, or to generate the necessary representation
// of local schemas
export function workspaceGraphQL({
  extensions: includeExtensions = DEFAULT_EXTENSIONS,
}: Pick<Options, 'extensions'> = {}) {
  return createWorkspaceLintPlugin(PLUGIN, ({hooks}) => {
    hooks.configure.hook((configuration) => {
      configuration.eslintExtensions?.hook((extensions) => [
        ...extensions,
        ...includeExtensions.map(
          (extension) => `.${stripLeadingDot(extension)}`,
        ),
      ]);
    });
  });
}

function stripLeadingDot(extension: string) {
  return extension.startsWith('.') ? extension.substring(1) : extension;
}
