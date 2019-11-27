import {Plugin, WebAppCreateOptions, WebAppOptions} from '@sewing-kit/types';
import {OptionBuilder} from './types';

class WebAppCreator {
  constructor(private readonly builder: OptionBuilder<WebAppCreateOptions>) {}

  entry(entry: string) {
    this.builder.entry = entry;
  }

  options(options: WebAppOptions) {
    this.builder.options = {...(this.builder.options || {}), ...options};
  }

  plugin(...plugins: Plugin[]) {
    this.builder.plugins = this.builder.plugins || [];
    this.builder.plugins.push(...plugins);
  }
}

export function createWebApp(
  create: (pkg: WebAppCreator) => void | Promise<void>,
) {
  return async () => {
    const options: OptionBuilder<WebAppCreateOptions> = {};
    const creator = new WebAppCreator(options);
    await create(creator);
    return options;
  };
}
