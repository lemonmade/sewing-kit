import {statSync as stat} from 'fs';

import {Package} from '@sewing-kit/plugins';

import {withWorkspace, Workspace} from '../../../tests/utilities';
import {
  ExportStyle,
  getLatestModifiedTime,
  generateBabelPackageCacheValue,
} from '../src/utilities';

function getModifiedTime(filepath: string) {
  return stat(filepath).mtimeMs;
}

async function writeToSrc(workspace: Workspace, filepath: string) {
  await workspace.writeFile(
    `src/${filepath}`,
    `export function pkg(greet) { console.log(\`Hello, \${greet}!\`); }`,
  );
}

describe('utilities', () => {
  describe('getLatestModifiedTime()', () => {
    it('gets the latest modified time', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });
        const fileExtensions = ['.js'];

        await writeToSrc(workspace, 'index.js');

        const latestModifiedTime = getLatestModifiedTime(
          testPackage,
          fileExtensions,
        );

        await writeToSrc(workspace, 'index.js');

        const updatedLatestModifiedTime = getLatestModifiedTime(
          testPackage,
          fileExtensions,
        );

        expect(updatedLatestModifiedTime).toBeGreaterThan(latestModifiedTime);
      });
    });

    it('gets the latest modified time of a group of files', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });
        const fileExtensions = ['.js', '.ts', '.mjs'];

        await writeToSrc(workspace, 'index.js');
        const indexModifiedTime = getModifiedTime(
          testPackage.fs.resolvePath('src', 'index.js'),
        );

        await writeToSrc(workspace, 'file-a.ts');
        const fileAModifiedTime = getModifiedTime(
          testPackage.fs.resolvePath('src', 'file-a.ts'),
        );

        await writeToSrc(workspace, 'file-b.mjs');
        const fileBModifiedTime = getModifiedTime(
          testPackage.fs.resolvePath('src', 'file-b.mjs'),
        );

        const latestModifiedTime = getLatestModifiedTime(
          testPackage,
          fileExtensions,
        );

        expect(latestModifiedTime).toBeGreaterThan(indexModifiedTime);
        expect(latestModifiedTime).toBeGreaterThan(fileAModifiedTime);
        expect(latestModifiedTime).toEqual(fileBModifiedTime);
      });
    });

    it('excludes files with extensions not included in the provided list', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });
        const fileExtensions = ['.js'];

        await writeToSrc(workspace, 'index.js');

        const latestModifiedTime = getLatestModifiedTime(
          testPackage,
          fileExtensions,
        );

        await writeToSrc(workspace, 'typescript-file.ts');

        const updatedLatestModifiedTime = getLatestModifiedTime(
          testPackage,
          fileExtensions,
        );

        expect(updatedLatestModifiedTime).toEqual(latestModifiedTime);
      });
    });
  });

  describe('generateBabelPackageCacheValue()', () => {
    const options = {
      babelConfig: {
        presets: ['@babel/some-preset', '@babel/some-other-preset'],
        plugins: ['@babel/some-plugin', '@babel/some-other-plugin'],
      },
      outputPath: 'build/esm',
      extension: '.mjs',
      exportStyle: ExportStyle.EsModules,
      babelCacheDependencies: [
        '@babel/some-plugin',
        '@babel/some-other-plugin',
      ],
      babelIgnorePatterns: ['.json', '.graphql'],
      babelExtensions: ['.js', '.mjs', '.ts'],
    };

    it('generates the same hash for unchanged options/dependencies/modified time', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);
        const hash2 = generateBabelPackageCacheValue(testPackage, options);

        expect(hash1).toEqual(hash2);
      });
    });

    it('generates a different hash if the Babel config changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          babelConfig: {
            ...options.babelConfig,
            plugins: [...options.babelConfig.plugins, '@babel/some-new-plugin'],
          },
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the output path changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          outputPath: 'build/meme',
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the extension changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          extension: '.meme',
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the export style changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          exportStyle: ExportStyle.CommonJs,
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the cache dependencies change', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          babelCacheDependencies: [
            ...options.babelCacheDependencies,
            '@babel/some-new-cache-dep',
          ],
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the ignore patterns change', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          babelIgnorePatterns: [...options.babelIgnorePatterns, '.py'],
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the extensions change', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        const newOptions = {
          ...options,
          babelExtensions: [...options.babelExtensions, '.esnext'],
        };

        const hash2 = generateBabelPackageCacheValue(testPackage, newOptions);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates a different hash if the last modified time changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        await writeToSrc(workspace, 'file-b.js');

        const hash2 = generateBabelPackageCacheValue(testPackage, options);

        expect(hash1).not.toEqual(hash2);
      });
    });

    it('generates the same hash if only a excluded file changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = new Package({
          name: 'simple-package',
          root: workspace.root,
        });

        await writeToSrc(workspace, 'index.js');
        await writeToSrc(workspace, 'file-a.js');
        await writeToSrc(workspace, 'file-b.js');

        const hash1 = generateBabelPackageCacheValue(testPackage, options);

        await writeToSrc(workspace, 'file-c.esnext');

        const hash2 = generateBabelPackageCacheValue(testPackage, options);

        expect(hash1).toEqual(hash2);
      });
    });
  });
});
