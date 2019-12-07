import {resolve, relative} from 'path';
import {produce} from 'immer';
import {BabelConfig} from '@sewing-kit/plugin-babel';

import {symlink, utimes} from 'fs-extra';
import {Package} from '@sewing-kit/model';

export const addTypeScriptBabelConfig = produce((babelConfig: BabelConfig) => {
  babelConfig.plugins = babelConfig.plugins ?? [];
  babelConfig.presets = babelConfig.presets ?? [];

  // @note https://babeljs.io/docs/en/babel-plugin-proposal-decorators#note-compatibility-with-babel-plugin-proposal-class-properties
  babelConfig.plugins.push([
    require.resolve('@babel/plugin-proposal-decorators'),
    {legacy: true},
  ]);
  babelConfig.presets.push(require.resolve('@babel/preset-typescript'));
});

export enum EntryStrategy {
  Symlink,
  ReExport,
}

export async function writeTypeScriptEntries(
  pkg: Package,
  {strategy}: {strategy: EntryStrategy},
) {
  const outputPath = await getOutputPath(pkg);

  const sourceRoot = pkg.fs.resolvePath('src');

  for (const entry of pkg.entries) {
    const absoluteEntryPath = (await pkg.fs.hasDirectory(entry.root))
      ? pkg.fs.resolvePath(entry.root, 'index')
      : pkg.fs.resolvePath(entry.root);
    const relativeFromSourceRoot = relative(sourceRoot, absoluteEntryPath);
    const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
    const relativeFromRoot = normalizedRelative(pkg.root, destinationInOutput);

    if (strategy === EntryStrategy.ReExport) {
      let hasDefault = true;
      let content = '';

      try {
        content = await pkg.fs.read(
          (await pkg.fs.glob(`${absoluteEntryPath}.*`))[0],
        );

        // export default ...
        // export {Foo as default} from ...
        // export {default} from ...
        hasDefault =
          /(?:export|as) default\b/.test(content) || /{default}/.test(content);
      } catch {
        // intentional no-op
        content = '';
      }

      await pkg.fs.write(
        `${entry.name || 'index'}.d.ts`,
        [
          `export * from ${JSON.stringify(relativeFromRoot)};`,
          hasDefault
            ? `export {default} from ${JSON.stringify(relativeFromRoot)};`
            : false,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    } else {
      const symlinkFile = `${relativeFromRoot}.d.ts`;
      if (!(await pkg.fs.hasFile(symlinkFile))) {
        await pkg.fs.write(symlinkFile, '');
        await utimes(
          pkg.fs.resolvePath(symlinkFile),
          201001010000,
          201001010000,
        );
      }

      try {
        await symlink(
          symlinkFile,
          pkg.fs.resolvePath(`${entry.name || 'index'}.d.ts`),
        );
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }
}

async function getOutputPath(pkg: Package) {
  if (await pkg.fs.hasFile('tsconfig.json')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tsconfig = require(pkg.fs.resolvePath('tsconfig.json'));
      const relativePath =
        (tsconfig.compilerOptions && tsconfig.compilerOptions.outDir) ||
        'build/ts';

      return pkg.fs.resolvePath(relativePath);
    } catch {
      // Fall through to the default below
    }
  }

  return pkg.fs.resolvePath('build/ts');
}

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
