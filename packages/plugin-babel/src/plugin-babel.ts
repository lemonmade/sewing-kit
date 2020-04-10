import {
  addHooks,
  WaterfallHook,
  createProjectPlugin,
} from '@sewing-kit/plugins';
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

export function babelHooks() {
  return createProjectPlugin(PLUGIN, ({tasks: {build, test, dev}}) => {
    const addBabelHooks = addHooks<BabelHooks>(() => ({
      babelConfig: new WaterfallHook(),
      babelIgnorePatterns: new WaterfallHook(),
      babelExtensions: new WaterfallHook(),
      babelCacheDependencies: new WaterfallHook(),
    }));

    build.hook(({hooks}) => {
      hooks.configureHooks.hook(addBabelHooks);
    });

    dev.hook(({hooks}) => {
      hooks.configureHooks.hook(addBabelHooks);
    });

    test.hook(({hooks}) => {
      hooks.configureHooks.hook(addBabelHooks);
    });
  });
}

export function babelPlugins(
  getPlugins: ValueOrGetter<ValueOrArray<string | [string, object]>>,
) {
  const id = `${PLUGIN}.AddBabelPlugins`;

  return createProjectPluginTargettingAllConfigurationHooks(
    id,
    async (hooks) => {
      const plugins = await unwrapPossibleArrayGetter(getPlugins);

      hooks.babelConfig?.hook((config) => ({
        ...config,
        plugins: [...(config.plugins ?? []), ...plugins],
      }));

      hooks.babelCacheDependencies?.hook((dependencies) => [
        ...dependencies,
        ...plugins.map((plugin) =>
          typeof plugin === 'string' ? plugin : plugin[0],
        ),
      ]);
    },
  );
}

export function babelPresets(
  getPresets: ValueOrGetter<ValueOrArray<string | [string, object]>>,
) {
  const id = `${PLUGIN}.AddBabelPresets`;

  return createProjectPluginTargettingAllConfigurationHooks(
    id,
    async (hooks) => {
      const presets = await unwrapPossibleArrayGetter(getPresets);

      hooks.babelConfig?.hook((config) => ({
        ...config,
        presets: [...(config.presets ?? []), ...presets],
      }));

      hooks.babelCacheDependencies?.hook((dependencies) => [
        ...dependencies,
        ...presets.map((preset) =>
          typeof preset === 'string' ? preset : preset[0],
        ),
      ]);
    },
  );
}

type ValueOrArray<Value> = Value | Value[];
type ValueOrGetter<Value> = Value | (() => Value | Promise<Value>);

function unwrapPossibleGetter<T>(
  maybeGetter: ValueOrGetter<T>,
): T | Promise<T> {
  return typeof maybeGetter === 'function'
    ? (maybeGetter as any)()
    : maybeGetter;
}

async function unwrapPossibleArrayGetter<T>(
  maybeGetter: ValueOrGetter<ValueOrArray<T>>,
) {
  const result = await unwrapPossibleGetter(maybeGetter);
  return Array.isArray(result) && !looksLikeTuple(result) ? result : [result];
}

function looksLikeTuple(value: any[]): value is [string, object] {
  return (
    value.length === 2 &&
    value[0] != null &&
    value[1] != null &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'object'
  );
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
