// We want sewing-kit to be able to build itself. Unfortunately, when cloning
// this repo for the first time, there are some problems with doing so. First
// and foremost is the problem that, even if we use babel-node to run the CLI
// from /packages/cli/src, that command will attempt to read the various
// sewing-kit.config.ts files, which generally import from /packages/config,
// which doesn't exist yet. Classic chicken and egg problem!
//
// To address this case, we write a tiny index file at the root of each package
// that points to the source, rather than the compiled output. Since we run with
// babel-node, this entry will be enough to make everything resolve properly. This
// is basically the same way we build type definitions for packages in `sewing-kit build`,
// but outside of sewing-kit.

import {resolve, basename} from 'path';

import exec from 'execa';
import {writeFile, removeSync, symlink} from 'fs-extra';
import {sync as glob} from 'glob';

for (const file of glob('packages/*/*.{js,mjs,node,esnext,ts}', {
  ignore: '**/sewing-kit.config.*',
})) {
  removeSync(file);
}

const CUSTOM_ENTRIES = new Map([
  ['config', ['index', 'load']],
  ['plugin-javascript', ['index', 'babel-preset']],
  [
    'plugin-typescript',
    ['index', 'babel-plugin-convert-empty-file-to-esmodule'],
  ],
]);
const NEEDS_FULL_BUILD = new Set([
  // Needs a full build so it’s available for editor feedback
  'eslint-plugin',
  // Needs a full build so that the Babel configuration is available
  // for self builds (Babel can’t reference sewing-kit’s source).
  'plugin-javascript',
  'plugin-typescript',
]);

const COMMONJS_DIRECTORY = 'build/cjs';
const TS_DEFINITIONS_DIRECTORY = 'build/ts';
const SOURCE_DIRECTORY = 'src';

const jsExport = (name = 'index', {compiled = false} = {}) =>
  `module.exports = require("./${
    compiled ? COMMONJS_DIRECTORY : SOURCE_DIRECTORY
  }/${name}");`;

(async () => {
  await Promise.all(
    glob('packages/*/').map(async (pkg) => {
      const directory = basename(pkg);
      const compile = NEEDS_FULL_BUILD.has(directory);
      await Promise.all([
        compile ? compileCommonJs(pkg) : Promise.resolve(),
        ...(CUSTOM_ENTRIES.get(directory) ?? ['index']).map(async (entry) => {
          await Promise.all([
            writeFile(
              resolve(pkg, `${entry}.js`),
              jsExport(entry, {compiled: compile}),
            ),
            symlink(
              `./${TS_DEFINITIONS_DIRECTORY}/${entry}.d.ts`,
              resolve(pkg, `${entry}.d.ts`),
            ),
          ]);
        }),
      ]);
    }),
  );
})();

async function compileCommonJs(pkg: string) {
  await exec(resolve(__dirname, '../node_modules/.bin/babel'), [
    resolve(pkg, SOURCE_DIRECTORY),
    '--out-dir',
    resolve(pkg, COMMONJS_DIRECTORY),
    '--extensions',
    '.ts,.js,.json',
  ]);
}
