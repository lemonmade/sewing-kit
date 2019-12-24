import {Base, Options as BaseOptions} from './base';
import {ProjectKind} from './types';

export interface ServiceOptions extends BaseOptions {
  readonly entry?: string;
}

export class Service extends Base {
  readonly kind = ProjectKind.Service;
  readonly entry?: string;

  get id() {
    return `service-${this.name}`;
  }

  constructor({entry, ...rest}: ServiceOptions) {
    super(rest);
    this.entry = entry;
  }
}
