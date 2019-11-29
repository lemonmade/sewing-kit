export enum Module {
  Preserve = 'preserve',
  CommonJs = 'commonjs',
}

export enum Polyfill {
  Usage = 'usage',
  Entry = 'entry',
}

export enum Target {
  Node = 'node',
}

export interface Options {
  debug?: boolean;
  modules?: Module;
  polyfill?: Polyfill;
  target?: Target | string[];
}

export default function babelPresetSewingKit(
  _: any,
  {
    target,
    debug = false,
    modules = Module.CommonJs,
    polyfill = Polyfill.Entry,
  }: Options = {},
) {
  return {
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      require.resolve('@babel/plugin-proposal-numeric-separator'),
      require.resolve('@babel/plugin-proposal-optional-chaining'),
      require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
      [
        require.resolve('@babel/plugin-proposal-class-properties'),
        {loose: true},
      ],
    ],
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          debug,
          useBuiltIns: polyfill,
          corejs: 3,
          modules: modules === Module.Preserve ? false : modules,
          targets: target === Target.Node ? {node: true} : target,
          ignoreBrowserslistConfig: true,
        },
      ],
    ],
  };
}
