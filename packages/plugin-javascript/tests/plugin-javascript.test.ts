import {resolve} from 'path';

import {withWorkspace} from '../../../tests/utilities';
import {getModifiedTime, writeToSrc} from './utilities';

const babelCompilationConfig = `
import {createPackage} from '@sewing-kit/config';
import {javascript} from '@sewing-kit/plugin-javascript';
import {buildEsModulesOutput} from '@sewing-kit/plugin-package-esmodules';

export default createPackage((pkg) => {
  pkg.use(javascript(), buildEsModulesOutput());
});
`;

describe('@sewing-kit/plugin-javascript', () => {
  describe('createCompileBabelStep()', () => {
    describe('caching', () => {
      it('creates a cache', async () => {
        await withWorkspace('simple-package', async (workspace) => {
          await workspace.writeConfig(babelCompilationConfig);

          await writeToSrc(workspace, 'index.js');

          await workspace.run('build');

          expect(
            await workspace.contains(
              '.sewing-kit/cache/babel/packages/simple-package/babel-esm-js',
            ),
          ).toBe(true);
        });
      });

      it('reads from the cache and skips compilation if hash is same', async () => {
        await withWorkspace('simple-package', async (workspace) => {
          await workspace.writeConfig(babelCompilationConfig);

          await writeToSrc(workspace, 'index.js');

          await workspace.run('build');

          const builtOutputModifiedTime = getModifiedTime(
            resolve(workspace.root, 'build', 'esm', 'index.mjs'),
          );

          await workspace.run('build');

          const updatedBuiltOutputModifiedTime = getModifiedTime(
            resolve(workspace.root, 'build', 'esm', 'index.mjs'),
          );

          expect(builtOutputModifiedTime).toEqual(
            updatedBuiltOutputModifiedTime,
          );
        });
      });

      it('invalidates cache if something changes', async () => {
        await withWorkspace('simple-package', async (workspace) => {
          await workspace.writeConfig(babelCompilationConfig);

          await writeToSrc(workspace, 'index.js');

          await workspace.run('build');

          const builtOutputModifiedTime = getModifiedTime(
            resolve(workspace.root, 'build', 'esm', 'index.mjs'),
          );

          await writeToSrc(workspace, 'index.js');

          await workspace.run('build');

          const updatedBuiltOutputModifiedTime = getModifiedTime(
            resolve(workspace.root, 'build', 'esm', 'index.mjs'),
          );

          expect(builtOutputModifiedTime).not.toEqual(
            updatedBuiltOutputModifiedTime,
          );
        });
      });
    });
  });
});
