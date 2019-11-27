import {withWorkspace as withBaseWorkspace} from '../../../tests/utilities';

const withWorkspace = withBaseWorkspace.extend(async (workspace) => {
  await workspace.writeConfig(`
    import {createWorkspace} from '@sewing-kit/config';

    import babel from '@sewing-kit/plugin-babel';
    import javascript from '@sewing-kit/plugin-javascript';
    import packageBase from '@sewing-kit/plugin-package-base';
    import packageEsm from '@sewing-kit/plugin-package-esmodules';

    export default createWorkspace((workspace) => {
      workspace.plugin(babel, javascript, packageBase, packageEsm);
    });
  `);
});

describe('@sewing-kit/plugin-package-esmodules', () => {
  it('builds a package at root while preserving ES import/ exports', async () => {
    await withWorkspace('simple-package', async (workspace) => {
      await workspace.writeFile(
        'src/index.js',
        `
            export function pkg(greet) {
              console.log(\`Hello, \${greet}!\`);
            }
          `,
      );

      await workspace.run('build');

      expect(await workspace.contents('build/esm/index.js')).toContain(
        'export function pkg(',
      );
    });
  });

  it('builds packages in a monorepo', async () => {
    await withWorkspace('monorepo-package', async (workspace) => {
      await workspace.writeFile(
        'packages/one/src/index.js',
        `export function one() {}`,
      );

      await workspace.writeFile(
        'packages/two/src/index.js',
        `export function two() {}`,
      );

      await workspace.run('build');

      expect(
        await workspace.contents('packages/one/build/esm/index.js'),
      ).toContain('export function one(');

      expect(
        await workspace.contents('packages/two/build/esm/index.js'),
      ).toContain('export function two(');
    });
  });

  it('builds customized entry points', async () => {
    await withWorkspace('simple-package', async (workspace) => {
      await workspace.writeFile(
        'packages/one/src/custom.js',
        `
          export function pkg(greet) {
            console.log(\`Hello, \${greet}!\`);
          }
        `,
      );

      await workspace.writeFile(
        'packages/one/sewing-kit.config.js',
        `
          import {createPackage} from '@sewing-kit/config';

          export default createPackage((pkg) => {
            pkg.entry({root: '/src/custom'});
          });
        `,
      );

      await workspace.run('build');

      expect(await workspace.contents('packages/one/index.mjs')).toContain(
        'export * from "./build/esm/custom";',
      );
    });
  });
});
