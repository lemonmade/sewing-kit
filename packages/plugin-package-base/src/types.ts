import {AsyncSeriesWaterfallHook} from 'tapable';

declare module '@sewing-kit/types' {
  interface BuildRootConfigurationCustomHooks {
    readonly packageBuildArtifacts: AsyncSeriesWaterfallHook<string[]>;
  }
}
