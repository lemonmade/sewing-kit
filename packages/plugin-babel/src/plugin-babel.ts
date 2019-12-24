import {
  Package,
  addHooks,
  WaterfallHook,
  createProjectPlugin,
} from '@sewing-kit/plugins';

import {BabelConfig} from './types';

interface BabelHooks {
  readonly babelConfig: WaterfallHook<BabelConfig>;
  readonly babelIgnorePatterns: WaterfallHook<readonly string[]>;
}

interface BabelPackageBuildHooks extends BabelHooks {
  readonly babelExtensions: WaterfallHook<readonly string[]>;
}

declare module '@sewing-kit/hooks' {
  interface TestProjectConfigurationCustomHooks extends BabelHooks {}

  interface BuildPackageConfigurationCustomHooks
    extends BabelPackageBuildHooks {}
  interface BuildWebAppConfigurationCustomHooks extends BabelHooks {}
  interface BuildServiceConfigurationCustomHooks extends BabelHooks {}

  interface DevPackageConfigurationCustomHooks extends BabelHooks {}
  interface DevWebAppConfigurationCustomHooks extends BabelHooks {}
  interface DevServiceConfigurationCustomHooks extends BabelHooks {}
}

const PLUGIN = 'SewingKit.Babel';

const addBabelHooks = addHooks(() => ({
  babelConfig: new WaterfallHook<BabelConfig>(),
  babelIgnorePatterns: new WaterfallHook<readonly string[]>(),
}));

const addPackageBabelHooks = addHooks(() => ({
  babelConfig: new WaterfallHook<BabelConfig>(),
  babelIgnorePatterns: new WaterfallHook<readonly string[]>(),
  babelExtensions: new WaterfallHook<readonly string[]>(),
}));

export const babelConfigurationHooks = createProjectPlugin(
  PLUGIN,
  ({project, tasks: {build, test, dev}}) => {
    const addHooks =
      project instanceof Package ? addPackageBabelHooks : addBabelHooks;

    build.hook(({hooks}) => {
      hooks.configure.hook(addHooks);
    });

    dev.hook(({hooks}) => {
      hooks.configure.hook(addHooks);
    });

    test.hook(({hooks}) => {
      hooks.configure.hook(addHooks);
    });
  },
);

export function addBabelPlugin(plugin: string | [string, object]) {
  const id = `${PLUGIN}.AddBabelPlugin`;

  return createProjectPluginTargettingAllConfigurationHooks(id, (hooks) => {
    hooks.babelConfig?.hook((config) => ({
      ...config,
      plugins: [...(config.plugins ?? []), plugin],
    }));
  });
}

export function addBabelPreset(preset: string | [string, object]) {
  const id = `${PLUGIN}.AddBabelPreset`;

  return createProjectPluginTargettingAllConfigurationHooks(id, (hooks) => {
    hooks.babelConfig?.hook((config) => ({
      ...config,
      presets: [...(config.presets ?? []), preset],
    }));
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
