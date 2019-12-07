import {ServiceWorkerOptions, WebAppOptions} from '@sewing-kit/model';
import {BaseBuilder, ConfigurationKind} from './base';

class WebAppOptionBuilder extends BaseBuilder<WebAppOptions> {
  constructor() {
    super(ConfigurationKind.WebApp);
  }

  entry(entry: string) {
    this.options.entry = entry;
  }

  serviceWorker(serviceWorker: ServiceWorkerOptions) {
    this.options.serviceWorker = serviceWorker;
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
