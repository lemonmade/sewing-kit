import getPort from 'get-port';

import {
  Env,
  WebApp,
  addHooks,
  WaterfallHook,
  createProjectDevPlugin,
} from '@sewing-kit/plugins';
import {createWebpackConfig} from '@sewing-kit/plugin-webpack';
import {updateSewingKitBabelPreset} from '@sewing-kit/plugin-javascript';

const PLUGIN = 'SewingKit.WebAppBase';

interface Hooks {
  readonly assetServerIp: WaterfallHook<string | undefined>;
  readonly assetServerPort: WaterfallHook<number | undefined>;
}

declare module '@sewing-kit/hooks' {
  interface DevWebAppConfigurationCustomHooks extends Hooks {}
}

enum BuildStatus {
  Building,
  BuildError,
  Error,
  Done,
}

type State =
  | {status: BuildStatus.Done; stats: import('webpack').Stats}
  | {status: BuildStatus.Error; error: Error}
  | {status: BuildStatus.BuildError; stats: import('webpack').Stats}
  | {status: BuildStatus.Building};

interface AssetServer {
  readonly ip?: string;
  readonly port?: number;
}

export interface Options {
  readonly assetServer?: AssetServer;
}

export function webpackDevWebApp({
  assetServer: {ip: defaultIp, port: defaultPort} = {},
}: Options = {}) {
  return createProjectDevPlugin<WebApp>(
    PLUGIN,
    ({api, workspace, project, hooks, options}) => {
      hooks.configureHooks.hook(
        addHooks<Hooks>(() => ({
          assetServerIp: new WaterfallHook(),
          assetServerPort: new WaterfallHook(),
        })),
      );

      hooks.configure.hook((hooks) => {
        hooks.babelConfig?.hook(
          updateSewingKitBabelPreset({
            target: [
              'last 1 chrome versions',
              'last 1 chromeandroid versions',
              'last 1 firefox versions',
              'last 1 opera versions',
              'last 1 edge versions',
              'safari >= 11',
              'ios >= 11',
            ],
          }),
        );
      });

      hooks.steps.hook((steps, {configuration, webpackBuildManager}) => {
        return [
          ...steps,
          api.createStep(
            {
              id: 'WebAppBase.WebpackWatch',
              label: 'start webpack in watch mode',
            },
            indefinite(async () => {
              const {default: webpack} = await import('webpack');
              const {default: koaWebpack} = await import('koa-webpack');
              const {default: Koa} = await import('koa');

              const [
                port = await getPort(),
                ip = 'localhost',
              ] = await Promise.all([
                configuration.assetServerPort?.run(defaultPort),
                configuration.assetServerIp?.run(defaultIp),
              ]);

              const store = createSimpleStore<State>({
                status: BuildStatus.Building,
              });

              configuration.webpackPublicPath!.hook(
                () => `http://${ip}:${port}/assets`,
              );

              const webpackConfig = await createWebpackConfig({
                api,
                env: Env.Development,
                hooks: configuration,
                project,
                workspace,
                sourceMaps: options.sourceMaps,
              });

              const compiler = webpack(webpackConfig);

              compiler.hooks.compile.tap(PLUGIN, () => {
                store.set({status: BuildStatus.Building});
              });

              compiler.hooks.done.tap(PLUGIN, (stats) => {
                webpackBuildManager?.emit(project, stats);

                if (stats.hasErrors()) {
                  store.set({status: BuildStatus.BuildError, stats});
                } else {
                  store.set({status: BuildStatus.Done, stats});
                }
              });

              compiler.hooks.failed.tap(PLUGIN, (error) => {
                store.set({status: BuildStatus.Error, error});
              });

              const app = new Koa();

              app.use(async (ctx, next) => {
                ctx.set('Access-Control-Allow-Origin', '*');
                ctx.set('Timing-Allow-Origin', '*');
                await next();
              });

              app.use(async (ctx, next) => {
                const state = store.get();

                if (state.status === BuildStatus.Building) {
                  ctx.type = 'application/javascript';
                  ctx.body = `
                    const event = new CustomEvent('SewingKit.BrowserAssetCompiling', {asset: ${JSON.stringify(
                      ctx.URL.href,
                    )}});
                    document.dispatchEvent(event);
                    
                    if (!event.defaultPrevented) {
                      document.addEventListener('SewingKit.BrowserAssetCompiling', () => {
                        // TODO: add list of assets being compiled
                      });
    
                      const root = document.createElement('div');
                      root.setAttribute('style', 'background-color: white; padding: 1rem; box-shadow: 0 0 0 1px rgba(63, 63, 68, 0.05), 0 1px 3px 0 rgba(63, 63, 68, 0.15); position: fixed; bottom: 1rem; right: 1rem; max-width: calc(100% - 2rem); box-sizing: border-box; z-index: 1000000;');
                      root.textContent = 'Requested asset ${JSON.stringify(
                        ctx.URL.href,
                      )} is still compiling';
    
                      // TODO: add link to see all assets
                      // TODO: clear and reload when asset is available (open a websocket)
    
                      document.body.appendChild(root);
                    }
                  `;
                  return;
                }

                await next();
              });

              app.use(
                await koaWebpack({
                  compiler,
                  hotClient: options.reload === 'fast' && {
                    logLevel: 'silent',
                  },
                  devMiddleware: {logLevel: 'silent'} as any,
                }),
              );

              app.listen(port, ip, () => {
                // eslint-disable-next-line no-console
                console.log(`Asset server listening on ${ip}:${port}`);
              });
            }),
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

function indefinite(run: import('@sewing-kit/core').Step['run']): typeof run {
  return (step) => step.indefinite(() => run(step));
}
