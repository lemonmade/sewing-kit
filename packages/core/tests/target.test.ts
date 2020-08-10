import {Target, TargetBuilder, TargetRuntime} from '..';
import {
  WebApp,
  Package,
  Service,
  Project,
  ProjectKind,
  Runtime,
  WorkspaceOptions,
  Workspace,
} from '../../model';
import {
  createTestWebAppWorkspace,
  createTestServiceWorkspace,
  createTestPackageWorkspace,
  createTestComboWorkspace,
} from '../../model/tests/utilities';

const name = 'test';
const root = '../../';

describe('TargetRuntime', () => {
  it('checks the TargetRuntime for a WebApp project', () => {
    const webAppWorkspace = createTestWebAppWorkspace(name, root);
    const project = webAppWorkspace.projects[0];
    const runtime = TargetRuntime.fromProject(project);
    expect(runtime.includes(Runtime.Browser)).toBeTruthy();
  });

  it('checks the TargetRuntime for a Service project', () => {
    const webAppWorkspace = createTestServiceWorkspace(name, root);
    const project = webAppWorkspace.projects[0];
    const runtime = TargetRuntime.fromProject(project);
    expect(runtime.includes(Runtime.Node)).toBeTruthy();
  });

  it('checks the TargetRuntime for a Package project', () => {
    const webAppWorkspace = createTestPackageWorkspace(name, root);
    const project = webAppWorkspace.projects[0];
    const runtime = TargetRuntime.fromProject(project);
    expect(runtime.includes(Runtime.Browser)).toBeFalsy();
    expect(runtime.includes(Runtime.Node)).toBeFalsy();
  });
});
