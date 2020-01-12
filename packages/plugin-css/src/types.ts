export interface CSSWebpackLoaderModule {
  readonly mode?: 'local' | 'global';
  readonly context?: string;
  readonly hashPrefix?: string;
  readonly localIdentName?: string;
  getLocalIdent?(
    context: string,
    localIdentName: string,
    localName: string,
    options: any,
  ): string | null;
}

export interface CSSWebpackLoaderOptions {
  readonly import?: boolean;
  readonly modules?: CSSWebpackLoaderModule;
  readonly sourceMap?: boolean;
  readonly importLoaders?: number;
  readonly localsConvention?: string;
  readonly onlyLocals?: boolean;
  readonly esModule?: boolean;
}

export interface CSSWebpackHooks {
  readonly cssWebpackFileName: import('@sewing-kit/hooks').WaterfallHook<
    string
  >;
  readonly cssWebpackMiniExtractOptions: import('@sewing-kit/hooks').WaterfallHook<
    import('mini-css-extract-plugin').PluginOptions
  >;
  readonly cssModuleClassNamePattern: import('@sewing-kit/hooks').WaterfallHook<
    string
  >;
  readonly cssWebpackLoaderOptions: import('@sewing-kit/hooks').WaterfallHook<
    CSSWebpackLoaderOptions
  >;
  readonly cssWebpackLoaderModule: import('@sewing-kit/hooks').WaterfallHook<
    CSSWebpackLoaderModule
  >;
}
