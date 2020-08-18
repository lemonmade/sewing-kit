export {Runtime, ProjectKind} from './types';
export {Package, PackageBinary, PackageEntry} from './package';
export type {
  PackageBinaryOptions,
  PackageEntryOptions,
  PackageOptions,
} from './package';
export {WebApp, ServiceWorker} from './web-app';
export type {WebAppOptions, ServiceWorkerOptions} from './web-app';
export {Service} from './service';
export type {ServiceOptions} from './service';
export {Workspace} from './workspace';
export type {WorkspaceOptions} from './workspace';
export {FileSystem} from './base';

export type Project =
  | import('./package').Package
  | import('./web-app').WebApp
  | import('./service').Service;
