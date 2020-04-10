import type {WaterfallHook} from '@sewing-kit/plugins';

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
  readonly modules?: CSSWebpackLoaderModule | boolean;
  readonly sourceMap?: boolean;
  readonly importLoaders?: number;
  readonly localsConvention?: string;
  readonly onlyLocals?: boolean;
  readonly esModule?: boolean;
}

export interface CSSWebpackPostcssLoaderOptions {
  readonly exec?: boolean;
  readonly parser?: string;
  readonly syntax?: string;
  readonly stringifier?: string;
  readonly sourceMap?: boolean | 'inline';
  readonly config?: {
    readonly path?: string;
    readonly ctx?: {[key: string]: any};
  };
  readonly ident?: string;
  readonly plugins?: (
    loader: import('webpack').Loader,
  ) => import('postcss').Plugin<any>[];
}

export interface CSSWebpackPostcssPlugins {
  [key: string]: object | true;
}

export interface CSSWebpackHooks {
  readonly cssWebpackIgnoreOrder: WaterfallHook<boolean>;
  readonly cssWebpackFileName: WaterfallHook<string>;
  readonly cssWebpackMiniExtractOptions: WaterfallHook<
    import('mini-css-extract-plugin').PluginOptions
  >;
  readonly cssModuleClassNamePattern: WaterfallHook<string>;
  readonly cssWebpackLoaderOptions: WaterfallHook<CSSWebpackLoaderOptions>;
  readonly cssWebpackLoaderModule: WaterfallHook<
    CSSWebpackLoaderModule | false
  >;
  readonly cssWebpackPostcssPlugins: WaterfallHook<CSSWebpackPostcssPlugins>;
  readonly cssWebpackPostcssLoaderOptions: WaterfallHook<
    CSSWebpackPostcssLoaderOptions
  >;
  readonly cssWebpackPostcssLoaderContext: WaterfallHook<{[key: string]: any}>;
  readonly cssWebpackOptimizeOptions: WaterfallHook<
    import('optimize-css-assets-webpack-plugin').Options
  >;
  readonly cssWebpackCacheDependencies: WaterfallHook<readonly string[]>;
}

export interface CSSTestingHooks {
  readonly cssModuleIdentityProxyExtensions: WaterfallHook<readonly string[]>;
}
