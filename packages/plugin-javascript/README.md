# `@sewing-kit/plugin-javascript`

> New to `sewing-kit`? [This guide](TODO) explains what `sewing-kit` is, how it’s organized, and how to use it in a project. Read through that overview if you haven’t already — it should help to clarify how to use the tools documented below.

This package provides a collection of `sewing-kit` plugins and other utilities for using JavaScript. It includes built-in support for transforming JavaScript with [Babel](https://babeljs.io).

## Installation

```
yarn add @sewing-kit/plugin-javascript --dev
```

## Plugins

### `babelHooks()`

The `babelHooks` function returns a `sewing-kit` plugin. To use it, include it in the `sewing-kit` configuration file of any project (but not the workspace).

```ts
import {createWebApp} from '@sewing-kit/config';
import {babelHooks} from '@sewing-kit/plugin-javascript';

export default createWebApp((app) => {
  app.use(babelHooks());
});
```

This plugin adds the following hooks to each of the `TestProjectConfigurationHooks`, `BuildProjectConfigurationHooks`, and `DevProjectConfigurationHooks`:

- `babelConfig`: the configuration used when transpiling with Babel.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelConfig!.hook((config) => ({
        ...config,
        plugins: [...config.plugins, require.resolve('my-babel-plugin')],
      }));
    });
  });
  ```

- `babelExtensions`: extensions that will be processed when transpiling with Babel.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelExtensions!.hook((extensions) => [...extensions, '.ts']);
    });
  });
  ```

- `babelIgnorePatterns`: glob patterns that will be ignored when transpiling with Babel.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelIgnorePatterns!.hook((ignorePatterns) => [
        ...ignorePatterns,
        '**/*.test.js',
      ]);
    });
  });
  ```

- `babelCacheDependencies`: the name of NPM dependencies that should be used when calculating a cache identifier for Babel. This should include any Babel plugins and presets you make use of, as changes in those dependencies should invalidate the Babel cache.

  ```ts
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelCacheDependencies!.hook((cacheDependencies) => [
        ...cacheDependencies,
        'babel-preset-my-company',
        'babel-plugin-custom',
      ]);
    });
  });
  ```

### `babelPlugins()`

The `babelPlugins` function returns a `sewing-kit` plugin that applies to a project. To include this plugin, you **must** include the `babelHooks()` plugin as well. You pass this function a plugin name or plugin name/ options tuple that you would like to include in the project’s Babel config. You can also pass this plugin an array of Babel plugins, or a function that returns any number of Babel plugins (this function can also be asynchronous, which can be useful if you infer a Babel configuration from some other details in the project). These plugins are also automatically registered with `babelCacheDependencies`.

```ts
import {createWebApp} from '@sewing-kit/config';
import {babelHooks, babelPlugins} from '@sewing-kit/plugin-javascript';

export default createWebApp((app) => {
  app.use(
    babelHooks(),
    babelPlugins('my-plugin-custom'),
    babelPlugins([
      require.resolve('my-plugin-custom-two'),
      {pluginOption: true},
    ]),
    babelPlugins(async () => {
      if (await hasDependency('plugin-one')) {
        return ['plugin-one', 'plugin-two'];
      }

      return ['plugin-two', {fallback: true}];
    }),
  );
});
```

More complex customizations of the Babel config can be done with the [`babelConfig` hook provided by the `babelHooks()` plugin](#hooks).

### `babelPresets()`

The `babelPresets` function returns a `sewing-kit` plugin that applies to a project. To include this plugin, you **must** include the `babelHooks()` plugin as well. It has an identical set of accepted arguments as `babelPlugins()`, except that any values passed to this plugin will become Babel _presets_ in your final Babel config.

```ts
import {createWebApp} from '@sewing-kit/config';
import {babelHooks, babelPresets} from '@sewing-kit/plugin-javascript';

export default createWebApp((app) => {
  app.use(
    babelHooks(),
    babelPresets('my-preset-custom'),
    babelPresets(async () => {
      if (await hasDependency('preset-one')) {
        return ['preset-one', 'preset-two'];
      }

      return ['preset-two', {fallback: true}];
    }),
  );
});
```

More complex customizations of the Babel config can be done with the [`babelConfig` hook provided by the `babelHooks()` plugin](#hooks).

## Utilities

### `createCompileBabelStep()`

The `createCompileBabelStep` function returns a `Step` that will run the Babel CLI with the configuration registered in the hooks documented above. This function requires some of the plugin’s context, and also accepts a few options for customizing the Babel build. This function can only be applied to **packages**.

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {createCompileBabelStep} from '@sewing-kit/plugin-javascript';

const plugin = createPackageBuildPlugin('MyPlugin', ({pkg, api, hooks}) => {
  hooks.steps.hook((steps, {configuration}) => [
    ...steps,
    await createCompileBabelStep({
      api,
      project: pkg,
      configuration,
      // The name of the configuration file that is written for this build
      configFile: 'babel.esm.js',
      // Where Babel will put the compiled output
      outputPath: pkg.fs.buildPath(),
      // A custom extension to use for the compiled output files (optional,
      // defaults to .js)
      extension: '.mjs',
    }),
  ]);
});
```
