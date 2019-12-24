import {ProjectPlugin} from '@sewing-kit/plugins';
import {Service, ServiceOptions} from '@sewing-kit/model';

import {BaseBuilder, ConfigurationKind} from './base';

class ServiceBuilder extends BaseBuilder<
  ProjectPlugin<Service>,
  ServiceOptions
> {
  constructor() {
    super(ConfigurationKind.Service);
  }

  entry(entry: string) {
    this.options.entry = entry;
  }
}

export function createService(
  create: (pkg: ServiceBuilder) => void | Promise<void>,
) {
  return async () => {
    const builder = new ServiceBuilder();
    await create(builder);
    return builder.toOptions();
  };
}
