import {Runtime, ProjectKind} from './types';
import {Base, Options as BaseOptions, toId} from './base';

export interface PackageEntryOptions {
  readonly root: string;
  readonly name?: string;
  readonly runtime?: Runtime;
  readonly runtimes?: Runtime[];
}

export class PackageEntry {
  readonly root: string;
  readonly name: string | undefined;
  readonly runtimes: Runtime[] | undefined;

  constructor({root, name, runtimes}: PackageEntryOptions) {
    this.root = root;
    this.name = name;
    this.runtimes = runtimes;
  }
}

export interface PackageBinaryOptions {
  readonly name: string;
  readonly root: string;
  readonly aliases?: readonly string[];
}

export class PackageBinary {
  readonly name: string;
  readonly root: string;
  readonly aliases: readonly string[];

  constructor({name, root, aliases = []}: PackageBinaryOptions) {
    this.name = name;
    this.root = root;
    this.aliases = aliases;
  }
}

export interface PackageOptions extends BaseOptions {
  runtimes?: Runtime[];
  readonly entries?: readonly PackageEntryOptions[];
  readonly binaries?: readonly PackageBinaryOptions[];
}

export class Package extends Base {
  readonly kind = ProjectKind.Package;
  readonly runtimes: Runtime[] | undefined;
  readonly entries: readonly PackageEntry[];
  readonly binaries: readonly PackageBinary[];

  get id() {
    return `Package.${toId(this.name)}`;
  }

  get runtimeName() {
    return this.packageJson?.name ?? this.name;
  }

  constructor({
    entries = [],
    binaries = [],
    runtimes,
    ...rest
  }: PackageOptions) {
    super(rest);

    this.runtimes = runtimes;
    this.entries = entries.map((entry) => new PackageEntry(entry));
    this.binaries = binaries.map((binary) => new PackageBinary(binary));
  }
}
