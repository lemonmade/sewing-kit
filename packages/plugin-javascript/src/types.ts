import type {WaterfallHook} from '@sewing-kit/plugins';

export interface BabelConfig {
  presets?: (string | [string, object?])[];
  plugins?: (string | [string, object?])[];
}

export interface BabelHooks {
  readonly babelConfig: WaterfallHook<BabelConfig>;
  readonly babelExtensions: WaterfallHook<readonly string[]>;
  readonly babelIgnorePatterns: WaterfallHook<readonly string[]>;
  readonly babelCacheDependencies: WaterfallHook<readonly string[]>;
}
