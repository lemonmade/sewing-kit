import {join} from 'path';
import Koa from 'koa';
import {produce} from 'immer';

import {createStep} from '@sewing-kit/ui';
import {
  changeBaseJavaScriptBabelPreset,
  BaseBabelPresetTarget,
} from '@sewing-kit/plugin-javascript';
import {} from '@sewing-kit/plugin-webpack';

import {PLUGIN as BASE_PLUGIN, createWebpackConfig} from './common';

const PLUGIN = `${BASE_PLUGIN}.build`;

export function devService({
  hooks,
  workspace,
}: import('@sewing-kit/tasks').DevProjectTask) {
  hooks.service.tap(PLUGIN, ({service, hooks}) => {
    hooks.configure.tap(PLUGIN, (hooks) => {
      hooks.babelConfig?.tap(
        PLUGIN,
        produce(
          changeBaseJavaScriptBabelPreset({
            target: BaseBabelPresetTarget.Node,
          }),
        ),
      );
    });

    hooks.steps.tap(PLUGIN, (steps, {config}) => {
      return [
        ...steps,
        createStep(
          {indefinite: true, label: 'Compiling for development mode'},
          async (step) => {
            const {default: webpack} = await import('webpack');

            const [port = 8082, ip = 'localhost'] = await Promise.all([
              config.port.promise(undefined),
              config.ip.promise(undefined),
            ]);

            const webpackConfig = await createWebpackConfig(
              config,
              service,
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

            const store = createSimpleStore(false);

            const warmup = new Koa();
            warmup.use((ctx) => {
              ctx.body = `<html>We’re still compiling your app, reload in a moment!</html>`;
            });

            let server: import('execa').ExecaChildProcess<string> | undefined;
            let warmupServer: ReturnType<typeof warmup.listen> | undefined;

            // Super hacky, need better state management
            const updateServers = async (ready = false) => {
              if (warmupServer != null && ready) {
                await new Promise((resolve, reject) =>
                  warmupServer!.close((error) =>
                    error ? reject(error) : resolve(),
                  ),
                );
              }

              if (server != null && !ready) {
                server.kill();
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

                server!.stdout!.on('data', (chunk) => {
                  // eslint-disable-next-line no-console
                  console.log(chunk.toString().trim());
                });
              } else {
                if (warmupServer != null) {
                  return;
                }

                // eslint-disable-next-line require-atomic-updates
                warmupServer = warmup.listen(port, ip, () => {
                  // eslint-disable-next-line no-console
                  console.log(`Warmup server listening on ${ip}:${port}`);
                });
              }
            };

            setTimeout(async () => {
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
                  // eslint-disable-next-line no-console
                  console.log(err);
                }

                if (stats.hasErrors()) {
                  // eslint-disable-next-line no-console
                  console.log(stats.toString('errors-only'));
                }
              });
            });
          },
        ),
      ];
    });
  });
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
