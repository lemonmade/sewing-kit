import {
  Workspace,
  WorkspaceOptions,
  ProjectKind,
  Service,
  WebApp,
  Package,
} from '..';
import {
  createTestWebAppWorkspace,
  createTestPackageWorkspace,
  createTestServiceWorkspace,
  createTestComboWorkspace,
  createTestEmptyWorkspace,
} from './utilities';

// Test creation of different types of workspaces
describe('Workspace', () => {
  const name = 'test';
  const root = '../../';

  it('creates a workspace for a WebApp', () => {
    const webAppWorkspace = createTestWebAppWorkspace(name, root);
    expect(webAppWorkspace.projects[0].kind).toBe(ProjectKind.WebApp);
    expect(webAppWorkspace.private).toBe(true);
  });

  it('creates a workspace for a Package', () => {
    const packageWorkspace = createTestPackageWorkspace(name, root);
    expect(packageWorkspace.projects[0].kind).toBe(ProjectKind.Package);
    expect(packageWorkspace.private).toBe(false);
  });

  it('creates a workspace for a Service', () => {
    const serviceWorkspace = createTestServiceWorkspace(name, root);
    expect(serviceWorkspace.projects[0].kind).toBe(ProjectKind.Service);
    expect(serviceWorkspace.private).toBe(true);
  });

  it('creates a workspace containing a WebApp, Package and Service', () => {
    const workspace = createTestComboWorkspace(name, root);
    expect(workspace.webApps).toHaveLength(1);
    expect(workspace.services).toHaveLength(1);
    expect(workspace.packages).toHaveLength(1);
  });

  it('creates an empty workspace', () => {
    const workspace = createTestEmptyWorkspace(name, root);
    expect(workspace.webApps).toHaveLength(0);
    expect(workspace.services).toHaveLength(0);
    expect(workspace.packages).toHaveLength(0);
  });
});
