import {join} from 'path';
import {withWorkspace} from '../../../tests/utilities';

describe('@sewing-kit/plugin-package-esmodules', () => {
  it('builds a package at root while preserving ES import/exports', async () => {
    await withWorkspace('simple-package', async (workspace) => {
      await workspace.writeConfig(`
        import {createPackage} from '@sewing-kit/config';

        import {javascript} from '@sewing-kit/plugin-javascript';
        import {buildEsModulesOutput} from '@sewing-kit/plugin-package-esmodules';

        export default createPackage((pkg) => {
          pkg.use(javascript(), buildEsModulesOutput());
        });
      `);

      await workspace.writeFile(
        'src/index.js',
        `
          export function pkg(greet) {
            console.log(\`Hello, \${greet}!\`);
          }
        `,
      );

      await workspace.run('build');

      expect(await workspace.contents('index.mjs')).toContain(
        'export * from "./build/esm/index"',
      );
      expect(await workspace.contents('build/esm/index.mjs')).toContain(
        'export function pkg(',
      );
    });
  });

  it('builds packages in a monorepo', async () => {
    await withWorkspace('monorepo-package', async (workspace) => {
      for (const pkg of ['one', 'two']) {
        await workspace.writeFile(
          `packages/${pkg}/src/index.js`,
          `export function ${pkg}() {}`,
        );

        await workspace.writeFile(
          `packages/${pkg}/sewing-kit.config.ts`,
          `
            import {createPackage} from '@sewing-kit/config';

            import {javascript} from '@sewing-kit/plugin-javascript';
            import {buildEsModulesOutput} from '@sewing-kit/plugin-package-esmodules';

            export default createPackage((pkg) => {
              pkg.use(javascript(), buildEsModulesOutput());
            });
          `,
        );
      }

      await workspace.run('build');

      expect(
        await workspace.contents('packages/one/build/esm/index.mjs'),
      ).toContain('export function one(');

      expect(
        await workspace.contents('packages/two/build/esm/index.mjs'),
      ).toContain('export function two(');
    });
  });

  it('builds customized entry points', async () => {
    await withWorkspace('custom-entry', async (workspace) => {
      await workspace.writeFile(
        'src/custom.js',
        `
          export function pkg(greet) {
            console.log(\`Hello, \${greet}!\`);
          }
        `,
      );

      await workspace.writeConfig(`
        import {createPackage} from '@sewing-kit/config';

        import {javascript} from '@sewing-kit/plugin-javascript';
        import {buildEsModulesOutput} from '@sewing-kit/plugin-package-esmodules';

        export default createPackage((pkg) => {
          pkg.entry({root: '/src/custom'});
          pkg.use(javascript(), buildEsModulesOutput());
        });
      `);

      await workspace.run('build');

      expect(await workspace.contents('index.mjs')).toContain(
        'export * from "./build/esm/custom";',
      );
    });
  });

  it('only exports default when the source has a default export', async () => {
    await withWorkspace('default-exports', async (workspace) => {
      const writePackageSewingKitConfig = (packageDirectory: string) =>
        workspace.writeFile(
          join(packageDirectory, 'sewing-kit.config.ts'),
          `
            import {createPackage} from '@sewing-kit/config';

            import {javascript} from '@sewing-kit/plugin-javascript';
            import {buildEsModulesOutput} from '@sewing-kit/plugin-package-esmodules';

            export default createPackage((pkg) => {
              pkg.use(javascript(), buildEsModulesOutput());
            });
          `,
        );

      const writePackageWithSource = async (name: string, source: string) => {
        const packageDirectory = join('packages', name);
        await Promise.all([
          workspace.writeFile(join(packageDirectory, 'src/index.js'), source),
          writePackageSewingKitConfig(packageDirectory),
        ]);

        return {
          output: () => workspace.contents(join(packageDirectory, 'index.mjs')),
        };
      };

      const defaultOne = await writePackageWithSource(
        'default-one',
        `const foo = 'bar'; export default foo;`,
      );

      const defaultTwo = await writePackageWithSource(
        'default-two',
        `const foo = () => {}; export default foo();`,
      );

      const defaultThree = await writePackageWithSource(
        'default-three',
        `const foo = 'bar'; export {foo as default};`,
      );

      const defaultFour = await writePackageWithSource(
        'default-four',
        `export {default} from './foo';`,
      );

      const notDefaultOne = await writePackageWithSource(
        'non-default-one',
        `export {defaultNot} from './foo';`,
      );

      await workspace.run('build');

      expect(await defaultOne.output()).toContain('default');
      expect(await defaultTwo.output()).toContain('default');
      expect(await defaultThree.output()).toContain('default');
      expect(await defaultFour.output()).toContain('default');
      expect(await notDefaultOne.output()).not.toContain('default');
    });
  });
});
