import {resolve, relative} from 'path';

import {Package, PackageEntry} from '@sewing-kit/model';
import {ProjectPluginContext} from '@sewing-kit/plugins';
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
  {project}: Pick<ProjectPluginContext<Package>, 'project' | 'api'>,
  options: WriteEntriesOptions,
) {
  return createStep(async () => {
    const {
      extension = '.js',
      outputPath,
      exportStyle = ExportStyle.CommonJs,
      exclude,
    } = options;

    const sourceRoot = resolve(project.root, 'src');

    for (const entry of project.entries) {
      if (exclude?.(entry) ?? false) continue;

      const absoluteEntryPath = (await project.fs.hasDirectory(entry.root))
        ? project.fs.resolvePath(entry.root, 'index')
        : project.fs.resolvePath(entry.root);

      const relativeFromSourceRoot = relative(sourceRoot, absoluteEntryPath);
      const destinationInOutput = resolve(outputPath, relativeFromSourceRoot);
      const relativeFromRoot = normalizedRelative(
        project.root,
        destinationInOutput,
      );

      if (exportStyle === ExportStyle.CommonJs) {
        await project.fs.write(
          `${entry.name || 'index'}${extension}`,
          `module.exports = require(${JSON.stringify(relativeFromRoot)});`,
        );

        continue;
      }

      let hasDefault = true;
      let content = '';

      try {
        content = await project.fs.read(
          (await project.fs.glob(`${absoluteEntryPath}.*`))[0],
        );

        // export default ...
        // export {Foo as default} from ...
        // export {default} from ...
        hasDefault =
          /(?:export|as) default\b/.test(content) || /{default}/.test(content);
      } catch {
        // intentional no-op
      }

      await project.fs.write(
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
