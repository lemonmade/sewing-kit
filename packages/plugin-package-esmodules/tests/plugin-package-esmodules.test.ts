import {withWorkspace} from '../../../tests/utilities';

describe('@sewing-kit/plugin-package-esmodules', () => {
  it('builds a package at root while preserving ES import/ exports', async () => {
    await withWorkspace('simple-package', async (workspace) => {
      await workspace.writeConfig(`
        import {createPackage} from '@sewing-kit/config';

        import {babelProjectPlugin} from '@sewing-kit/plugin-babel';
        import {javascriptProjectPlugin} from '@sewing-kit/plugin-javascript';
        import {packageCreateEsModulesOutputPlugin} from '@sewing-kit/plugin-package-esmodules';

        export default createPackage((pkg) => {
          pkg.plugins(babelProjectPlugin, javascriptProjectPlugin, packageCreateEsModulesOutputPlugin);
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

            import {babelProjectPlugin} from '@sewing-kit/plugin-babel';
            import {javascriptProjectPlugin} from '@sewing-kit/plugin-javascript';
            import {packageCreateEsModulesOutputPlugin} from '@sewing-kit/plugin-package-esmodules';

            export default createPackage((pkg) => {
              pkg.plugins(babelProjectPlugin, javascriptProjectPlugin, packageCreateEsModulesOutputPlugin);
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

        import {babelProjectPlugin} from '@sewing-kit/plugin-babel';
        import {javascriptProjectPlugin} from '@sewing-kit/plugin-javascript';
        import {packageCreateEsModulesOutputPlugin} from '@sewing-kit/plugin-package-esmodules';

        export default createPackage((pkg) => {
          pkg.entry({root: '/src/custom'});
          pkg.plugins(babelProjectPlugin, javascriptProjectPlugin, packageCreateEsModulesOutputPlugin);
        });
      `);

      await workspace.run('build');

      expect(await workspace.contents('index.mjs')).toContain(
        'export * from "./build/esm/custom";',
      );
    });
  });
});
