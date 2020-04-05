// import {compilation, Compiler, Plugin, Stats} from 'webpack';

import type {Plugin, Compiler, Stats, compilation} from 'webpack';

export class IgnoreMissingTypeExportWarningsPlugin implements Plugin {
  apply(compiler: Compiler) {
    compiler.hooks.done.intercept({
      call: (stats: Stats) => {
        filterWarnings(stats.compilation);
      },
      loop: (_: any) => {},
      tap: (_: any) => {},
      register: (tap: import('tapable').Tap) => tap,
      context: false,
    });
  }
}

function filterWarnings(compilation: compilation.Compilation) {
  compilation.warnings = compilation.warnings
    .filter((warning) => warning.name === 'ModuleDependencyWarning')
    .filter((warning) => Boolean(warning.module.resource))
    .filter((warning) => warning.module.resource.match(/\.tsx?$/))
    .filter((warning) => !warning.message.match(/export .+ was not found/));

  for (const child of compilation.children ?? []) {
    filterWarnings(child);
  }
}
