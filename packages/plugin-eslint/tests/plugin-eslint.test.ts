import {createWorkspace} from '@sewing-kit/config';
import {eslint} from '../src/plugin-eslint';

describe('@sewing-kit/eslint', () => {
  describe('eslint()', () => {
    it('applies the eslint plugin', async () => {
      const workspaceBuilder = createWorkspace((workspace) => {
        workspace.use(eslint());
      });
      const workspace = await workspaceBuilder();
      const workspacePlugins = workspace.workspacePlugins;
      const eslintPlugin = workspacePlugins[0];
      expect(eslintPlugin.id).toBe('SewingKit.ESLint');
    });
  });
});
