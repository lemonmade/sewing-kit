import {Options} from '../src/base';
import {Workspace, WorkspaceOptions, Service, WebApp, Package} from '..';

const name = 'test';
const root = '.';

const options: Options = {
  name,
  root,
};
const webApp = new WebApp(options);
const pkg = new Package(options);
const service = new Service(options);
const webApps: WebApp[] = [webApp];
const packages: Package[] = [pkg];
const services: Service[] = [service];
const emptyWebApps: WebApp[] = [];
const emptyPackages: Package[] = [];
const emptyServices: Service[] = [];

export function createTestWebAppWorkspace(
  name: string,
  root: string,
): Workspace {
  const opts: WorkspaceOptions = {
    webApps,
    services: emptyServices,
    packages: emptyPackages,
    name,
    root,
  };
  return new Workspace(opts);
}

export function createTestPackageWorkspace(
  name: string,
  root: string,
): Workspace {
  const opts: WorkspaceOptions = {
    webApps: emptyWebApps,
    services: emptyServices,
    packages,
    name,
    root,
  };
  return new Workspace(opts);
}

export function createTestServiceWorkspace(
  name: string,
  root: string,
): Workspace {
  const opts: WorkspaceOptions = {
    webApps: emptyWebApps,
    services,
    packages: emptyPackages,
    name,
    root,
  };
  return new Workspace(opts);
}

export function createTestEmptyWorkspace(
  name: string,
  root: string,
): Workspace {
  const opts: WorkspaceOptions = {
    webApps: emptyWebApps,
    services: emptyServices,
    packages: emptyPackages,
    name,
    root,
  };
  return new Workspace(opts);
}

export function createTestComboWorkspace(
  name: string,
  root: string,
): Workspace {
  const opts: WorkspaceOptions = {
    webApps,
    services,
    packages,
    name,
    root,
  };
  return new Workspace(opts);
}
