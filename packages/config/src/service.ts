import {Plugin, ServiceCreateOptions, ServiceOptions} from '@sewing-kit/types';
import {OptionBuilder} from './types';

class ServiceCreator {
  constructor(private readonly builder: OptionBuilder<ServiceCreateOptions>) {}

  entry(entry: string) {
    this.builder.entry = entry;
  }

  options(options: ServiceOptions) {
    this.builder.options = {...(this.builder.options || {}), ...options};
  }

  plugin(...plugins: Plugin[]) {
    this.builder.plugins = this.builder.plugins || [];
    this.builder.plugins.push(...plugins);
  }
}

export function createService(
  create: (pkg: ServiceCreator) => void | Promise<void>,
) {
  return async () => {
    const options: OptionBuilder<ServiceCreateOptions> = {};
    const creator = new ServiceCreator(options);
    await create(creator);
    return options;
  };
}
