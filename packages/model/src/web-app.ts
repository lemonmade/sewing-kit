import {Base, Options as BaseOptions} from './base';

export interface ServiceWorkerOptions {
  readonly entry: string;
}

export class ServiceWorker {
  readonly entry: string;

  constructor({entry}: ServiceWorkerOptions) {
    this.entry = entry;
  }
}

export interface WebAppOptions extends BaseOptions {
  readonly entry?: string;
  readonly serviceWorker?: ServiceWorkerOptions;
}

export class WebApp extends Base {
  readonly entry?: string;
  readonly serviceWorker?: ServiceWorker;

  get id() {
    return `webApp-${this.name}`;
  }

  constructor({entry, serviceWorker, ...rest}: WebAppOptions) {
    super(rest);

    this.entry = entry;
    this.serviceWorker = serviceWorker && new ServiceWorker(serviceWorker);
  }
}
