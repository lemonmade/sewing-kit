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
    this.options.runtimes = [defaultRuntime];
    return this;
  }

  runtimes(...defaultRuntimes: Runtime[]) {
    this.options.runtimes = defaultRuntimes;
    return this;
  }

  entry({runtime, runtimes, ...entry}: PackageEntryOptions) {
    this.options.entries = this.options.entries ?? [];
    this.options.entries.push({
      ...entry,
      root:
        typeof entry.root === 'string' && entry.root.startsWith('/')
          ? entry.root.slice(1)
          : entry.root,
      runtimes: runtime ? [runtime] : runtimes ?? this.options.runtimes,
    });

    return this;
  }

  binary(binary: PackageBinaryOptions) {
    this.options.binaries = this.options.binaries ?? [];
    this.options.binaries.push(binary);
    return this;
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
