declare module 'webpack-plugin-hash-output' {
  import type {Plugin, Compiler} from 'webpack';

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace HashPlugin {
    export interface Options {
      validateOutput?: boolean;
      validateOutputRegex?: RegExp;
    }
  }

  class HashPlugin implements Plugin {
    apply(compiler: Compiler): void;
  }

  export = HashPlugin;
}
