import {withWorkspace} from '../../../tests/utilities';
import {
  ExportStyle,
  getLatestModifiedTime,
  generateBabelPackageCacheValue,
} from '../src/utilities';
import {getModifiedTime, writeToSrc, createTestPackage} from './utilities';

describe('utilities', () => {
  describe('getLatestModifiedTime()', () => {
    it('gets the latest modified time', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
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
        const testPackage = createTestPackage(workspace);
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

    it('excludes .ts file extensions when it is not included in fileExtensions', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
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
        const testPackage = createTestPackage(workspace);

        expect(generateBabelPackageCacheValue(testPackage, options)).toEqual(
          generateBabelPackageCacheValue(testPackage, options),
        );
      });
    });

    it('generates a different hash if the Babel config changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          babelConfig: {
            ...options.babelConfig,
            plugins: [...options.babelConfig.plugins, '@babel/some-new-plugin'],
          },
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the output path changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          outputPath: 'build/meme',
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the extension changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          extension: '.meme',
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the export style changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          exportStyle: ExportStyle.CommonJs,
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the cache dependencies change', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          babelCacheDependencies: [
            ...options.babelCacheDependencies,
            '@babel/some-new-cache-dep',
          ],
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the ignore patterns change', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          babelIgnorePatterns: [...options.babelIgnorePatterns, '.py'],
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the extensions change', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);
        const newOptions = {
          ...options,
          babelExtensions: [...options.babelExtensions, '.esnext'],
        };

        expect(
          generateBabelPackageCacheValue(testPackage, options),
        ).not.toEqual(generateBabelPackageCacheValue(testPackage, newOptions));
      });
    });

    it('generates a different hash if the last modified time changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);

        await writeToSrc(workspace, 'file.js');

        const oldHash = generateBabelPackageCacheValue(testPackage, options);

        await writeToSrc(workspace, 'file.js');

        const newHash = generateBabelPackageCacheValue(testPackage, options);

        expect(oldHash).not.toEqual(newHash);
      });
    });

    it('generates the same hash if only a excluded file changes', async () => {
      await withWorkspace('simple-package', async (workspace) => {
        const testPackage = createTestPackage(workspace);

        await writeToSrc(workspace, 'file.esnext');

        const oldHash = generateBabelPackageCacheValue(testPackage, options);

        await writeToSrc(workspace, 'file.esnext');

        const newHash = generateBabelPackageCacheValue(testPackage, options);

        expect(oldHash).toEqual(newHash);
      });
    });
  });
});
