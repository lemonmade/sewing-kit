import {resolve, relative} from 'path';

import {Package, PackageEntry} from '@sewing-kit/model';
import {createStep} from '@sewing-kit/ui';

interface WriteEntriesOptions {
  extension?: string;
  outputPath: string;
  exportStyle?: ExportStyle;
  exclude?(entry: PackageEntry): boolean;
}

export enum ExportStyle {
  EsModules,
  CommonJs,
}

export function createWriteEntriesStep(
  pkg: Package,
  options: WriteEntriesOptions,
) {
  return createStep(async () => {
    const {
      extension = '.js',
      outputPath,
      exportStyle = ExportStyle.CommonJs,
      exclude,
    } = options;

    const sourceRoot = resolve(pkg.root, 'src');

    for (const entry of pkg.entries) {
      if (exclude?.(entry) ?? false) continue;

      const absoluteEntryPath = (await pkg.fs.hasDirectory(entry.root))
        ? pkg.fs.resolvePath(entry.root, 'index')
        : pkg.fs.resolvePath(entry.root);

      const relativeFromSourceRoot = relative(sourceRoot, absoluteEntryPath);
      const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
      const relativeFromRoot = normalizedRelative(
        pkg.root,
        destinationInOutput,
      );

      if (exportStyle === ExportStyle.CommonJs) {
        await pkg.fs.write(
          `${entry.name || 'index'}${extension}`,
          `module.exports = require(${JSON.stringify(relativeFromRoot)});`,
        );

        continue;
      }

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
      }

      await pkg.fs.write(
        `${entry.name || 'index'}${extension}`,
        [
          `export * from ${JSON.stringify(relativeFromRoot)};`,
          hasDefault
            ? `export {default} from ${JSON.stringify(relativeFromRoot)};`
            : false,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
  });
}

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
