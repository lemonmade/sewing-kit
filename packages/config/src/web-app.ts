import {ProjectPlugin} from '@sewing-kit/plugins';
import {WebApp, ServiceWorkerOptions, WebAppOptions} from '@sewing-kit/model';
import {BaseBuilder, ConfigurationKind} from './base';

class WebAppOptionBuilder extends BaseBuilder<
  ProjectPlugin<WebApp>,
  WebAppOptions
> {
  constructor() {
    super(ConfigurationKind.WebApp);
  }

  entry(entry: string) {
    this.options.entry = entry;
    return this;
  }

  serviceWorker(serviceWorker: ServiceWorkerOptions) {
    this.options.serviceWorker = serviceWorker;
    return this;
  }
}

export function createWebApp(
  create: (webApp: WebAppOptionBuilder) => void | Promise<void>,
) {
  return async () => {
    const builder = new WebAppOptionBuilder();
    await create(builder);
    return builder.toOptions();
  };
}
