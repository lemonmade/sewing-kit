import {
  Workspace,
  WorkspaceOptions,
  ProjectKind,
  Service,
  WebApp,
  Package,
} from '..';
import {Base, Options} from '../base';

// Test creation of different types of workspaces
describe('Workspace', () => {
  const name = 'test';
  const root = '../../';

  const options: Options = {
    name,
    root,
  };
  const base = new Base(options);
  const webApp = new WebApp(options);
  const pkg = new Package(options);
  const service = new Service(options);
  const webApps: WebApp[] = [webApp];
  const packages: Package[] = [pkg];
  const services: Service[] = [service];
  const emptyWebApps: WebApp[] = [];
  const emptyPackages: Package[] = [];
  const emptyServices: Service[] = [];

  it('creates a workspace for a WebApp', () => {
    const opts: WorkspaceOptions = {
      webApps,
      services: emptyServices,
      packages: emptyPackages,
      name,
      root,
    };
    const webAppWorkspace = new Workspace(opts);
    expect(webAppWorkspace.projects[0].kind).toBe(ProjectKind.WebApp);
    expect(webAppWorkspace.private).toBe(true);
  });
  it('creates a workspace for a Package', () => {
    const opts: WorkspaceOptions = {
      webApps: emptyWebApps,
      services: emptyServices,
      packages,
      name,
      root,
    };
    const packageWorkspace = new Workspace(opts);
    expect(packageWorkspace.projects[0].kind).toBe(ProjectKind.Package);
    expect(packageWorkspace.private).toBe(false);
  });
  it('creates a workspace for a Service', () => {
    const opts: WorkspaceOptions = {
      webApps: emptyWebApps,
      services,
      packages: emptyPackages,
      name,
      root,
    };
    const serviceWorkspace = new Workspace(opts);
    expect(serviceWorkspace.projects[0].kind).toBe(ProjectKind.Service);
    expect(serviceWorkspace.private).toBe(true);
  });
  it('creates a workspace containing a WebApp, Package and Service', () => {
    const workspaceOptions: WorkspaceOptions = {
      webApps,
      packages,
      services,
      name,
      root,
    };
    const workspace = new Workspace(workspaceOptions);
    expect(base.name).toMatch('test');
    expect(workspace.projects).toContain(webApp);
    expect(workspace.projects).toContain(pkg);
    expect(workspace.projects).toContain(service);
    expect(workspace.private).toBe(true);
  });
});
