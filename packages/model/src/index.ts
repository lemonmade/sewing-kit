export {Runtime, ProjectKind} from './types';
export {
  Package,
  PackageOptions,
  PackageBinary,
  PackageBinaryOptions,
  PackageEntry,
  PackageEntryOptions,
} from './package';
export {
  WebApp,
  WebAppOptions,
  ServiceWorker,
  ServiceWorkerOptions,
} from './web-app';
export {Service, ServiceOptions} from './service';
export {Workspace, WorkspaceOptions} from './workspace';

export type Project =
  | import('./package').Package
  | import('./web-app').WebApp
  | import('./service').Service;
