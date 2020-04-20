import {join} from 'path';

import {
  Env,
  Service,
  Workspace,
  MissingPluginError,
  createProjectPlugin,
  createProjectDevPlugin,
} from '@sewing-kit/plugins';
import {updateBabelEnvPreset} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.ServiceBase';

export interface Options {
  readonly ip?: string;
  readonly port?: number;
}

export function buildServiceWithWebpack({
  ip: defaultIp,
  port: defaultPort,
}: Options = {}) {
  return createProjectPlugin<Service>(
    PLUGIN,
    ({api, workspace, project, tasks: {build, dev}}) => {
      const updatePreset = updateBabelEnvPreset({
        target: 'node',
        modules: 'preserve',
      });

      build.hook(({hooks, options}) => {
        hooks.configure.hook((configure) => {
          configure.babelConfig?.hook(updatePreset);
          configure.webpackOutputDirectory?.hook(() =>
            workspace.fs.buildPath('services'),
          );

          configure.webpackOutputFilename?.hook((filename) =>
            workspace.services.length > 1
              ? join(project.name, filename)
              : filename,
          );
        });

        hooks.steps.hook((steps, {configuration, webpackBuildManager}) => {
          const step = api.createStep(
            {id: 'ServiceBase.WebpackBuild', label: 'run webpack'},
            async () => {
              const stats = await buildWebpack(
                await createWebpackConfig(configuration, project, workspace, {
                  mode: toMode(options.simulateEnv),
                }),
              );

              webpackBuildManager?.emit(project, stats);
            },
          );

          return [...steps, step];
        });
      });

      dev.hook(({hooks}) => {
        hooks.configure.hook((hooks) => {
          hooks.babelConfig?.hook(updatePreset);
          hooks.webpackOutputFilename?.hook(() => 'main.js');
          hooks.webpackOutputDirectory?.hook(() =>
            workspace.fs.buildPath('services'),
          );
        });

        hooks.steps.hook((steps, {configuration, webpackBuildManager}) => {
          return [
            ...steps,
            api.createStep(
              {
                id: 'ServiceBase.WebpackWatch',
                label: 'start webpack in watch mode',
              },
              async (step) => {
                const {default: Koa} = await import('koa');
                const {default: webpack} = await import('webpack');

                const [port, ip = 'localhost'] = await Promise.all([
                  configuration.port.run(defaultPort),
                  configuration.ip.run(defaultIp),
                ]);

                const webpackConfig = await createWebpackConfig(
                  configuration,
                  project,
                  workspace,
                  {
                    mode: 'development',
                  },
                );

                const compiler = webpack(webpackConfig);
                const file = join(
                  webpackConfig.output!.path!,
                  webpackConfig.output!.filename as string,
                );

                step.indefinite(async ({stdio}) => {
                  const store = createSimpleStore(false);

                  const warmup = new Koa();
                  warmup.use((ctx) => {
                    ctx.body = `<html>We’re still compiling your app, reload in a moment!</html>`;
                  });

                  let server:
                    | import('execa').ExecaChildProcess<string>
                    | undefined;
                  let warmupServer:
                    | ReturnType<typeof warmup.listen>
                    | undefined;

                  // Super hacky, need better state management
                  const updateServers = async (ready = false) => {
                    if (warmupServer != null && ready) {
                      await new Promise((resolve, reject) =>
                        warmupServer!.close((error) => {
                          if (error) {
                            reject(error);
                            return;
                          }

                          warmupServer = undefined;
                          resolve();
                        }),
                      );
                    }

                    if (server != null && !ready) {
                      server.kill();
                      server = undefined;
                    }

                    if (ready) {
                      if (server != null) {
                        return;
                      }

                      server = step.exec('node', [file], {
                        env: {
                          PORT: String(port),
                          IP: ip,
                        },
                      });

                      server!.stdout!.pipe(stdio.stdout);
                      server!.stderr!.pipe(stdio.stderr);
                    } else {
                      if (warmupServer != null || port == null) {
                        return;
                      }

                      // eslint-disable-next-line require-atomic-updates
                      warmupServer = warmup.listen(port, ip, () => {
                        stdio.stdout.write(
                          `warmup server listening on ${ip}:${port}\n`,
                        );
                      });
                    }
                  };

                  store.subscribe(updateServers);
                  await updateServers();

                  compiler.hooks.done.tap(PLUGIN, (stats) => {
                    webpackBuildManager?.emit(project, stats);
                    store.set(true);
                  });

                  compiler.hooks.compile.tap(PLUGIN, () => {
                    store.set(false);
                  });

                  compiler.watch({ignored: 'node_modules/**'}, (err, stats) => {
                    if (err) {
                      stdio.stdout.write(err.toString());
                    }

                    if (stats.hasErrors()) {
                      stdio.stdout.write(stats.toString('errors-only'));
                    }
                  });
                });
              },
            ),
          ];
        });
      });
    },
  );
}

export interface DevServerOptions {
  ip?: string;
  port: number;
}

export function devNodeService({ip = 'localhost', port}: DevServerOptions) {
  const pluginId = `${PLUGIN}.DevServerConnection`;
  return createProjectDevPlugin<Service>(pluginId, ({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.port.hook(() => port);
      configure.ip.hook(() => ip);
    });
  });
}

async function buildWebpack(config: import('webpack').Configuration) {
  const {default: webpack} = await import('webpack');
  const compiler = webpack(config);

  return new Promise<import('webpack').Stats>((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(new Error(stats.toString('errors-warnings')));
        return;
      }

      resolve(stats);
    });
  });
}

async function createWebpackConfig(
  configure:
    | import('@sewing-kit/hooks').DevServiceConfigurationHooks
    | import('@sewing-kit/hooks').BuildServiceConfigurationHooks,
  service: Service,
  workspace: Workspace,
  explicitConfig: import('webpack').Configuration = {},
) {
  if (
    configure.webpackConfig == null ||
    configure.webpackPlugins == null ||
    configure.webpackRules == null
  ) {
    throw new MissingPluginError('@sewing-kit/plugin-webpack');
  }

  const rules = await configure.webpackRules!.run([]);
  const plugins = await configure.webpackPlugins!.run([]);
  const extensions = await configure.webpackExtensions!.run([]);
  const outputPath = await configure.webpackOutputDirectory!.run(
    workspace.fs.buildPath(),
  );
  const filename = await configure.webpackOutputFilename!.run('[name].js');

  return configure.webpackConfig.run({
    target: 'node',
    entry: (await configure.webpackEntries!.run(
      service.entry ? [service.fs.resolvePath(service.entry)] : [],
    )) as string[],
    resolve: {extensions: extensions as string[]},
    module: {rules: rules as any[]},
    output: {
      path: outputPath,
      filename,
      libraryTarget: 'commonjs2',
      publicPath: '/assets/',
    },
    plugins: plugins as any,
    ...explicitConfig,
  });
}

function toMode(env: Env) {
  switch (env) {
    case Env.Production:
    case Env.Staging:
      return 'production';
    default:
      return 'development';
  }
}

function createSimpleStore<T>(initialState: T) {
  const subscribers = new Set<(state: T) => void>();
  let state = initialState;

  return {
    get() {
      return state;
    },
    set(newState: T) {
      state = newState;

      for (const subscriber of subscribers) {
        subscriber(newState);
      }
    },
    subscribe(subscriber: (state: T) => void) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
  };
}
