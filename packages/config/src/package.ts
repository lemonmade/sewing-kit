import {
  Runtime,
  Package,
  PackageOptions,
  PackageEntryOptions,
  PackageBinaryOptions,
} from '@sewing-kit/model';
import {ProjectPlugin} from '@sewing-kit/plugins';

import {BaseBuilder, ConfigurationKind} from './base';

class PackageBuilder extends BaseBuilder<
  ProjectPlugin<Package>,
  PackageOptions
> {
  constructor() {
    super(ConfigurationKind.Package);
  }

  runtime(defaultRuntime: Runtime) {
    this.options.runtime = defaultRuntime;
  }

  entry(entry: PackageEntryOptions) {
    this.options.entries = this.options.entries ?? [];
    this.options.entries.push({
      runtime: this.options.runtime,
      ...entry,
      root:
        typeof entry.root === 'string' && entry.root.startsWith('/')
          ? entry.root.slice(1)
          : entry.root,
    });
  }

  binary(binary: PackageBinaryOptions) {
    this.options.binaries = this.options.binaries ?? [];
    this.options.binaries.push(binary);
  }
}

export function createPackage(
  create: (pkg: PackageBuilder) => void | Promise<void>,
) {
  return async () => {
    const builder = new PackageBuilder();
    await create(builder);
    return builder.toOptions();
  };
}
