import {
  WebApp,
  Package,
  Service,
  createComposedProjectPlugin,
} from '@sewing-kit/plugins';

const PLUGIN = 'SewingKit.PackageFlexibleOutputs';

export interface Options {
  readonly binaries?: boolean;
  readonly commonjs?: boolean;
  readonly esmodules?: boolean;
  readonly esnext?: boolean;
  readonly node?: boolean;
  readonly typescript?:
    | boolean
    | Parameters<
        typeof import('@sewing-kit/plugin-package-typescript').buildTypeScriptDefinitions
      >[0];
}

const emptyPromise = Promise.resolve(undefined);

export function buildFlexibleOutputs({
  binaries = true,
  commonjs = true,
  esmodules = true,
  esnext = true,
  node = true,
  typescript = true,
}: Options = {}) {
  return createComposedProjectPlugin<Package>(PLUGIN, async (composer) => {
    const composed = await Promise.all([
      binaries
        ? import(
            '@sewing-kit/plugin-package-binaries'
          ).then(({buildBinaries}) => buildBinaries())
        : emptyPromise,
      commonjs
        ? import(
            '@sewing-kit/plugin-package-commonjs'
          ).then(({buildCommonJsOutput}) => buildCommonJsOutput())
        : emptyPromise,
      esmodules
        ? import(
            '@sewing-kit/plugin-package-esmodules'
          ).then(({buildEsModulesOutput}) => buildEsModulesOutput())
        : emptyPromise,
      esnext
        ? import(
            '@sewing-kit/plugin-package-esnext'
          ).then(({buildEsNextOutput}) => buildEsNextOutput())
        : emptyPromise,
      node
        ? import('@sewing-kit/plugin-package-node').then(({buildNodeOutput}) =>
            buildNodeOutput(),
          )
        : emptyPromise,
      typescript
        ? import(
            '@sewing-kit/plugin-package-typescript'
          ).then(({buildTypeScriptDefinitions}) =>
            typeof typescript === 'boolean'
              ? buildTypeScriptDefinitions()
              : buildTypeScriptDefinitions(typescript),
          )
        : emptyPromise,
    ]);

    composer.use(...composed);
  });
}

export interface ConsumerOptions
  extends Pick<Options, 'esnext' | 'esmodules'> {}

export function flexibleOutputs({
  esmodules = true,
  esnext = true,
}: ConsumerOptions = {}) {
  return createComposedProjectPlugin<WebApp | Service>(
    PLUGIN,
    async (composer) => {
      const composed = await Promise.all([
        esmodules
          ? import(
              '@sewing-kit/plugin-package-esmodules'
            ).then(({esmodulesOutput}) => esmodulesOutput())
          : emptyPromise,
        esnext
          ? import('@sewing-kit/plugin-package-esnext').then(({esnextOutput}) =>
              esnextOutput(),
            )
          : emptyPromise,
      ]);

      composer.use(...composed);
    },
  );
}
