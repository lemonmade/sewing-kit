import {join} from 'path';

import {Env, Service, createProjectDevPlugin} from '@sewing-kit/plugins';
import {createWebpackConfig} from '@sewing-kit/plugin-webpack';

const PLUGIN = 'SewingKit.ServiceBase';

export interface Options {
  readonly ip?: string;
  readonly port?: number;
}

export function webpackDevService({
  ip: defaultIp,
  port: defaultPort,
}: Options = {}) {
  return createProjectDevPlugin<Service>(
    PLUGIN,
    ({api, workspace, options, project, hooks}) => {
      hooks.configure.hook((hooks) => {
        hooks.webpackOutputFilename?.hook(() => 'main.js');
      });

      hooks.steps.hook((steps, configuration) => {
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

              const webpackConfig = await createWebpackConfig({
                api,
                project,
                workspace,
                env: Env.Development,
                hooks: configuration,
                sourceMaps: options.sourceMaps,
              });

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
                let warmupServer: ReturnType<typeof warmup.listen> | undefined;

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

                compiler.hooks.done.tap(PLUGIN, () => {
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
    },
  );
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
