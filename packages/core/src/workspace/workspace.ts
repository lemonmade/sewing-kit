import {
  Plugin,
  PluginTarget,
  Runtime,
  ProjectCreateOptions,
  PackageEntryCreateOptions,
  PackageBinaryCreateOptions,
  PackageCreateOptions,
  WebAppOptions,
  WebAppCreateOptions,
  ServiceCreateOptions,
} from '@sewing-kit/types';
import {FileSystem, SewingKitFileSystem} from './fs';
import {PackageJson} from './dependencies';

interface DependencyOptions {
  all?: boolean;
  dev?: boolean;
  prod?: boolean;
}

export class Project {
  readonly name: string;
  readonly root: string;
  readonly fs: FileSystem;
  readonly plugins: readonly Plugin[];
  protected readonly packageJson?: PackageJson;

  get id() {
    return this.name;
  }

  constructor({name, root, plugins = []}: ProjectCreateOptions) {
    this.name = name;
    this.root = root;
    this.fs = new FileSystem(root);
    this.plugins = plugins;
    this.packageJson = PackageJson.load(this.root);
  }

  dependencies({prod = true, dev, all}: DependencyOptions = {}) {
    const dependencies: string[] = [];

    if (this.packageJson == null) {
      return dependencies;
    }

    if (prod || all) {
      dependencies.push(...Object.keys(this.packageJson.dependencies));
    }

    if (dev || all) {
      dependencies.push(...Object.keys(this.packageJson.devDependencies));
    }

    return dependencies;
  }

  // eslint-disable-next-line require-await
  async hasDependency(
    name: string,
    _options?: DependencyOptions & {version?: string},
  ): Promise<boolean> {
    const {packageJson} = this;

    return packageJson != null && packageJson.dependency(name) != null;
  }

  pluginsForTarget<T extends PluginTarget>(
    target: T,
  ): import('../plugins').PluginTargetMap[T][] {
    return this.plugins.filter((plugin) => plugin.target === target) as any;
  }
}

export interface WorkspaceCreateOptions extends ProjectCreateOptions {
  webApps: WebApp[];
  packages: Package[];
  services: Service[];
}

export class Workspace extends Project {
  readonly internal = new SewingKitFileSystem(this.root);
  readonly webApps: readonly WebApp[];
  readonly packages: readonly Package[];
  readonly services: readonly Service[];

  get private() {
    return this.webApps.length > 0 || this.services.length > 0;
  }

  get projects() {
    return [...this.packages, ...this.webApps, ...this.services];
  }

  constructor({webApps, packages, services, ...rest}: WorkspaceCreateOptions) {
    super(rest);

    this.webApps = webApps;
    this.packages = packages;
    this.services = services;
  }
}

export class WebApp extends Project {
  readonly entry: string;
  readonly options: Partial<WebAppOptions>;
  readonly serviceWorker?: string;

  get id() {
    return `webApp-${this.name}`;
  }

  constructor({
    entry,
    options = {},
    serviceWorker,
    ...rest
  }: WebAppCreateOptions) {
    super(rest);

    this.entry = entry;
    this.options = options;
    this.serviceWorker = serviceWorker;
  }
}

export interface PackageEntry extends PackageEntryCreateOptions {}
export interface PackageBinary extends PackageBinaryCreateOptions {}

export class Package extends Project {
  readonly runtime: Runtime | undefined;
  readonly entries: PackageEntry[];
  readonly binaries: PackageBinary[];

  get id() {
    return `package-${this.name}`;
  }

  get runtimeName() {
    return (this.packageJson && this.packageJson.name) || this.name;
  }

  constructor({entries, binaries, runtime, ...rest}: PackageCreateOptions) {
    super(rest);

    this.runtime = runtime;
    this.entries = entries;
    this.binaries = binaries;
  }
}

export class Service extends Project {
  readonly entry: string;

  get id() {
    return `service-${this.name}`;
  }

  constructor({entry, ...rest}: ServiceCreateOptions) {
    super(rest);
    this.entry = entry;
  }
}
