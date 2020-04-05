import {WaterfallHook, createProjectPlugin} from '@sewing-kit/plugins';
import {BabelConfig} from './types';

interface BabelHooks {
  readonly babelConfig: WaterfallHook<BabelConfig>;
  readonly babelExtensions: WaterfallHook<readonly string[]>;
  readonly babelIgnorePatterns: WaterfallHook<readonly string[]>;
  readonly babelCacheDependencies: WaterfallHook<readonly string[]>;
}

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}
  interface BuildProjectConfigurationCustomHooks extends BabelHooks {}
  interface DevProjectConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.Babel';

export function babelProjectHooks() {
  return createProjectPlugin(PLUGIN, ({tasks: {build, test, dev}}) => {
    const addHooks = (hooks: any) => ({
      ...hooks,
      babelConfig: new WaterfallHook(),
      babelIgnorePatterns: new WaterfallHook(),
      babelExtensions: new WaterfallHook(),
      babelCacheDependencies: new WaterfallHook(),
    });

    build.hook(({hooks}) => {
      hooks.configureHooks.hook(addHooks);
    });

    dev.hook(({hooks}) => {
      hooks.configureHooks.hook(addHooks);
    });

    test.hook(({hooks}) => {
      hooks.configureHooks.hook(addHooks);
    });
  });
}

export function babelPlugin(plugin: string | [string, object]) {
  const id = `${PLUGIN}.AddBabelPlugin`;

  return createProjectPluginTargettingAllConfigurationHooks(id, (hooks) => {
    hooks.babelConfig?.hook((config) => ({
      ...config,
      plugins: [...(config.plugins ?? []), plugin],
    }));

    hooks.babelCacheDependencies?.hook((dependencies) => [
      ...dependencies,
      typeof plugin === 'string' ? plugin : plugin[0],
    ]);
  });
}

export function babelPreset(preset: string | [string, object]) {
  const id = `${PLUGIN}.AddBabelPreset`;

  return createProjectPluginTargettingAllConfigurationHooks(id, (hooks) => {
    hooks.babelConfig?.hook((config) => ({
      ...config,
      presets: [...(config.presets ?? []), preset],
    }));

    hooks.babelCacheDependencies?.hook((dependencies) => [
      ...dependencies,
      typeof preset === 'string' ? preset : preset[0],
    ]);
  });
}

function createProjectPluginTargettingAllConfigurationHooks(
  id: string,
  configurator: (hooks: Partial<BabelHooks>) => void,
) {
  return createProjectPlugin(id, ({tasks: {build, dev, test}}) => {
    build.hook(({hooks}) => {
      hooks.configure.hook(configurator);
    });

    dev.hook(({hooks}) => {
      hooks.configure.hook(configurator);
    });

    test.hook(({hooks}) => {
      hooks.configure.hook(configurator);
    });
  });
}
