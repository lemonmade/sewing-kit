import {resolve, relative} from 'path';
import {Package, PackageEntry} from '@sewing-kit/core';
import {createStep} from '@sewing-kit/ui';

interface WriteEntriesOptions {
  extension?: string;
  outputPath: string;
  exclude?(entry: PackageEntry): boolean;
  contents(relativePath: string): string;
}

const defaultExclude = () => false;

export function createWriteEntriesStep(
  pkg: Package,
  options: WriteEntriesOptions,
) {
  return createStep(async () => {
    const {
      extension = '.js',
      outputPath,
      contents,
      exclude = defaultExclude,
    } = options;

    const sourceRoot = resolve(pkg.root, 'src');

    for (const entry of pkg.entries) {
      if (exclude(entry)) {
        continue;
      }

      const relativeFromSourceRoot = relative(
        sourceRoot,
        pkg.fs.resolvePath(entry.root),
      );
      const destinationInOutput = pkg.fs.resolvePath(
        outputPath,
        relativeFromSourceRoot,
      );

      const relativeFromRoot = normalizedRelative(
        pkg.root,
        destinationInOutput,
      );

      await pkg.fs.write(
        `${entry.name || 'index'}${extension}`,
        contents(relativeFromRoot),
      );
    }
  });
}

function normalizedRelative(from: string, to: string) {
  const rel = relative(from, to);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
