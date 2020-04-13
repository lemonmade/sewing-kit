import postcss from 'postcss';

export type Stage = 0 | 1 | 2 | 3 | 4 | false;

export interface ImportFromConfig {
  readonly customMedia: {readonly [key: string]: string};
  readonly customProperties: {readonly [key: string]: string};
  readonly customSelectors: {readonly [key: string]: string};
  readonly environmentVariables: {readonly [key: string]: string};
}

export type ImportFrom<
  T extends keyof ImportFromConfig = keyof ImportFromConfig
> = string | Pick<ImportFromConfig, T>;

type Writable<T> = {-readonly [K in keyof T]: T[K]};

export type ExportTo<
  T extends keyof ImportFromConfig = keyof ImportFromConfig
> =
  | string
  | Partial<Writable<Pick<ImportFromConfig, T>>>
  | ((config: Partial<Pick<ImportFromConfig, T>>) => void);

export interface Features {
  // @see https://github.com/maximkoretskiy/postcss-initial
  'all-property'?: boolean | {reset?: 'all' | 'inherited'; replace?: boolean};
  // @see https://github.com/jonathantneal/postcss-pseudo-class-any-link
  'any-link-pseudo-class'?: boolean | {preserve?: boolean};
  // @see https://github.com/csstools/css-blank-pseudo
  'blank-pseudo-class'?: boolean;
  // @see https://github.com/shrpne/postcss-page-break
  'break-properties'?: boolean;
  // @see https://github.com/Semigradsky/postcss-attribute-case-insensitive
  'case-insensitive-attributes'?: boolean;
  // @see https://github.com/jonathantneal/postcss-color-functional-notation
  'color-functional-notation'?: boolean | {preserve?: boolean};
  // @see https://github.com/jonathantneal/postcss-color-mod-function
  'color-mod-function'?:
    | boolean
    | {
        stringifier?(color: string): string;
        unresolved?: 'throw' | 'warn' | 'ignore';
        transformVars?: boolean;
        importFrom?:
          | ImportFrom<'customProperties'>
          | ImportFrom<'customProperties'>[];
      };
  // @see https://github.com/postcss/postcss-custom-media
  'custom-media-queries'?:
    | boolean
    | {
        preserve?: boolean;
        importFrom?: ImportFrom<'customMedia'> | ImportFrom<'customMedia'>[];
        exportTo?: ExportTo<'customMedia'> | ExportTo<'customMedia'>[];
      };
  // @see https://github.com/postcss/postcss-custom-properties
  'custom-properties'?:
    | boolean
    | {
        preserve?: boolean;
        importFrom?:
          | ImportFrom<'customProperties'>
          | ImportFrom<'customProperties'>[];
        exportTo?:
          | ExportTo<'customProperties'>
          | ExportTo<'customProperties'>[];
      };
  // @see https://github.com/postcss/postcss-custom-selectors
  'custom-selectors'?:
    | boolean
    | {
        preserve?: boolean;
        importFrom?:
          | ImportFrom<'customSelectors'>
          | ImportFrom<'customSelectors'>[];
        exportTo?: ExportTo<'customSelectors'> | ExportTo<'customSelectors'>[];
      };
  // @see https://github.com/jonathantneal/postcss-dir-pseudo-class
  'dir-pseudo-class'?:
    | boolean
    | {
        dir?: 'rtl' | 'ltr';
        preserve?: boolean;
      };
  // @see https://github.com/jonathantneal/postcss-double-position-gradients
  'double-position-gradients'?: boolean | {preserve?: boolean};
  // @see https://github.com/csstools/postcss-env-function
  'environment-variables'?:
    | boolean
    | {
        importFrom?:
          | ImportFrom<'environmentVariables'>
          | ImportFrom<'environmentVariables'>[];
      };
  // @see https://github.com/jonathantneal/postcss-focus-visible
  'focus-visible-pseudo-class'?:
    | boolean
    | {
        preserve?: boolean;
        replaceWith?: string;
      };
  // @see https://github.com/jonathantneal/postcss-focus-within
  'focus-within-pseudo-class'?:
    | boolean
    | {
        preserve?: boolean;
        replaceWith?: string;
      };
  // @see https://github.com/postcss/postcss-font-variant
  'font-variant-property'?: boolean;
  // @see https://github.com/jonathantneal/postcss-gap-properties
  'gap-properties'?: boolean | {preserve?: boolean};
  // @see https://github.com/postcss/postcss-color-gray
  'gray-function'?: boolean | {preserve?: boolean};
  // @see https://github.com/csstools/css-has-pseudo
  'has-pseudo-class'?: boolean;
  // @see https://github.com/postcss/postcss-color-hex-alpha
  'hexadecimal-alpha-notation'?: boolean | {preserve?: boolean};
  // @see https://github.com/jonathantneal/postcss-image-set-function
  'image-set-function'?:
    | boolean
    | {preserve?: boolean; oninvalid?: 'warning' | 'throw'};
  // @see https://github.com/jonathantneal/postcss-lab-function
  'lab-function'?: boolean | {preserve?: boolean};
  // @see https://github.com/csstools/postcss-logical
  'logical-properties-and-values'?:
    | boolean
    | {preserve?: boolean; dir?: 'ltr' | 'rtl'};
  // @see https://github.com/postcss/postcss-selector-matches
  'matches-pseudo-class'?: boolean | {lineBreak?: boolean};
  // @see https://github.com/postcss/postcss-media-minmax
  'media-query-ranges'?: boolean;
  // @see https://github.com/jonathantneal/postcss-nesting
  'nesting-rules'?: boolean;
  // @see https://github.com/postcss/postcss-selector-not
  'not-pseudo-class'?: boolean;
  // @see https://github.com/jonathantneal/postcss-overflow-shorthand
  'overflow-property'?: boolean | {preserve?: boolean};
  // @see https://github.com/MattDiMu/postcss-replace-overflow-wrap
  'overflow-wrap-property'?: boolean;
  // @see https://github.com/jonathantneal/postcss-place
  'place-properties'?: boolean | {preserve?: boolean};
  // @see https://github.com/csstools/css-prefers-color-scheme
  'prefers-color-scheme-query'?: boolean;
  // @see https://github.com/postcss/postcss-color-rebeccapurple
  'rebeccapurple-color'?: boolean | object;
  // @see https://github.com/csstools/postcss-preset-env/blob/ca9d4ff2daf34dc0a83f0cb29de087027235e27b/src/patch/postcss-system-ui-font-family.js
  'system-ui-font-family'?: boolean;
}

// @see https://github.com/postcss/autoprefixer#options
export interface Autoprefixer {
  readonly env?: string;
  readonly cascade?: boolean;
  readonly add?: boolean;
  readonly remove?: boolean;
  readonly supports?: boolean;
  readonly flexbox?: boolean | 'no-2009';
  readonly grid?: false | 'autoplace' | 'no-autoplace';
  readonly stats?: object;
  readonly ignoreUnknownVersions?: boolean;
}

// @see https://github.com/csstools/postcss-preset-env#options
export interface Options {
  readonly stage?: Stage;
  readonly features?: Features;
  readonly browsers?: string | readonly string[];
  readonly autoprefixer?: Autoprefixer | boolean;
  readonly preserve?: boolean;
  readonly importFrom?: ImportFrom | readonly ImportFrom[];
  readonly exportTo?: ExportTo | readonly ExportTo[];
}

export default postcss.plugin<Options>(
  '@shopify/postcss-plugin',
  (options: Options = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const presetEnv = require('postcss-preset-env')(options);

    return (root, result) => {
      return presetEnv(root, result);
    };
  },
);
