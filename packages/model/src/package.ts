import {Runtime} from './types';
import {Base, Options as BaseOptions} from './base';

export interface PackageEntryOptions {
  readonly root: string;
  readonly name?: string;
  readonly runtime?: Runtime;
}

export class PackageEntry {
  readonly root: string;
  readonly name: string | undefined;
  readonly runtime: Runtime | undefined;

  constructor({root, name, runtime}: PackageEntryOptions) {
    this.root = root;
    this.name = name;
    this.runtime = runtime;
  }
}

export interface PackageBinaryOptions {
  readonly name: string;
  readonly root: string;
  readonly aliases: readonly string[];
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
  runtime?: Runtime;
  readonly entries?: readonly PackageEntryOptions[];
  readonly binaries?: readonly PackageBinaryOptions[];
}

export class Package extends Base {
  readonly runtime: Runtime | undefined;
  readonly entries: readonly PackageEntry[];
  readonly binaries: readonly PackageBinary[];

  get id() {
    return `package-${this.name}`;
  }

  get runtimeName() {
    return this.packageJson?.name ?? this.name;
  }

  constructor({entries = [], binaries = [], runtime, ...rest}: PackageOptions) {
    super(rest);

    this.runtime = runtime;
    this.entries = entries.map((entry) => new PackageEntry(entry));
    this.binaries = binaries.map((binary) => new PackageBinary(binary));
  }
}
