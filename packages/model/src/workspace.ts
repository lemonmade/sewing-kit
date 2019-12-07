import {Base, Options as BaseOptions} from './base';

type WebApp = import('./web-app').WebApp;
type Service = import('./service').Service;
type Package = import('./package').Package;

export interface WorkspaceOptions extends BaseOptions {
  readonly webApps: readonly WebApp[];
  readonly packages: readonly Package[];
  readonly services: readonly Service[];
}

export class Workspace extends Base {
  readonly webApps: readonly WebApp[];
  readonly packages: readonly Package[];
  readonly services: readonly Service[];

  get private() {
    return this.webApps.length > 0 || this.services.length > 0;
  }

  get projects() {
    return [...this.packages, ...this.webApps, ...this.services];
  }

  constructor({webApps, packages, services, ...rest}: WorkspaceOptions) {
    super(rest);

    this.webApps = webApps;
    this.packages = packages;
    this.services = services;
  }
}
