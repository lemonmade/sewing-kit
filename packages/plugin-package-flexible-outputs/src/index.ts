import {createComposedProjectPlugin, ProjectPlugin} from '@sewing-kit/plugins';

const PLUGIN = 'SewingKit.PackageFlexibleOutputs';

export interface Options {
  readonly binaries?: boolean;
  readonly commonjs?: boolean;
  readonly esmodules?: boolean;
  readonly esnext?: boolean;
  readonly node?: boolean;
  readonly typescript?:
    | boolean
    | import('@sewing-kit/plugin-package-typescript').Options;
}

const emptyPromise = Promise.resolve(undefined);

export const createPackageFlexibleOutputsPlugin = ({
  binaries = true,
  commonjs = true,
  esmodules = true,
  esnext = true,
  node = true,
  typescript = true,
}: Options = {}) =>
  createComposedProjectPlugin(PLUGIN, async (composer) => {
    const composed = await Promise.all([
      binaries
        ? import('@sewing-kit/plugin-package-binaries').then(
            ({packageCreateBinariesPlugin}) => packageCreateBinariesPlugin,
          )
        : emptyPromise,
      commonjs
        ? import('@sewing-kit/plugin-package-commonjs').then(
            ({packageCreateCommonJsOutputPlugin}) =>
              packageCreateCommonJsOutputPlugin,
          )
        : emptyPromise,
      esmodules
        ? import('@sewing-kit/plugin-package-esmodules').then(
            ({packageCreateEsModulesOutputPlugin}) =>
              packageCreateEsModulesOutputPlugin,
          )
        : emptyPromise,
      esnext
        ? import('@sewing-kit/plugin-package-esnext').then(
            ({packageCreateEsNextOutputPlugin}) =>
              packageCreateEsNextOutputPlugin,
          )
        : emptyPromise,
      node
        ? import('@sewing-kit/plugin-package-node').then(
            ({packageCreateNodeOutputPlugin}) => packageCreateNodeOutputPlugin,
          )
        : emptyPromise,
      typescript
        ? import(
            '@sewing-kit/plugin-package-typescript'
          ).then(
            ({
              buildPackageTsDefinitionsPlugin,
              createBuildPackageTsDefinitionsPlugin,
            }) =>
              typeof typescript === 'boolean'
                ? buildPackageTsDefinitionsPlugin
                : createBuildPackageTsDefinitionsPlugin(typescript),
          )
        : emptyPromise,
    ]);

    composer.use(...(composed.filter(Boolean) as ProjectPlugin[]));
  });

export const packageFlexibleOutputsPlugin = createPackageFlexibleOutputsPlugin();

export interface ConsumerOptions
  extends Pick<Options, 'esnext' | 'esmodules'> {}

export const createPackageFlexibleOutputsConsumerPlugin = ({
  esmodules = true,
  esnext = true,
}: ConsumerOptions = {}) =>
  createComposedProjectPlugin(PLUGIN, async (composer) => {
    const composed = await Promise.all([
      esmodules
        ? import('@sewing-kit/plugin-package-esmodules').then(
            ({useEsModulesPlugin}) => useEsModulesPlugin,
          )
        : emptyPromise,
      esnext
        ? import('@sewing-kit/plugin-package-esnext').then(
            ({useEsNextPlugin}) => useEsNextPlugin,
          )
        : emptyPromise,
    ]);

    composer.use(...(composed.filter(Boolean) as ProjectPlugin[]));
  });

export const packageFlexibleOutputsConsumerPlugin = createPackageFlexibleOutputsConsumerPlugin();
