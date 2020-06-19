export type Module = 'preserve' | 'commonjs';

export type Polyfill = 'usage' | 'entry';

export type Target = 'node';

export interface Options {
  debug?: boolean;
  modules?: Module;
  polyfill?: Polyfill;
  target?: Target | string | readonly string[];
}

export default function babelPresetSewingKit(
  _: any,
  {
    target,
    debug = false,
    modules = 'commonjs',
    polyfill = 'entry',
  }: Options = {},
) {
  return {
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      require.resolve('@babel/plugin-proposal-numeric-separator'),
      require.resolve('@babel/plugin-proposal-optional-chaining'),
      require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
      require.resolve('@babel/plugin-proposal-class-properties'),
    ],
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          debug,
          useBuiltIns: polyfill,
          corejs: 3,
          modules: modules === 'preserve' ? false : modules,
          targets: target === 'node' ? {node: 'current'} : target,
          ignoreBrowserslistConfig: target != null,
          bugfixes: true,
        },
      ],
    ],
  };
}
