export interface CSSWebpackLoaderOptions {
  readonly sourceMap?: boolean;
  readonly minimize?: boolean;
  readonly modules?: boolean;
  readonly importLoaders?: number;
  readonly localIdentName?: string;
  getLocalIdent?(
    context: any,
    localIdentName: any,
    localName: any,
    options: any,
  ): string | null;
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
}
