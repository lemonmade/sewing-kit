# `@sewing-kit/plugin-javascript`

> New to `sewing-kit`? [This guide](TODO) explains what `sewing-kit` is, how it’s organized, and how to use it in a project. Read through that overview if you haven’t already — it should help to clarify how to use the tools documented below.

This package provides a collection of `sewing-kit` plugins and other utilities for using JavaScript. It includes built-in support for transforming JavaScript with [Babel](https://babeljs.io).

## Installation

```
yarn add @sewing-kit/plugin-javascript --dev
```

## Plugins

### `javascript()`

The `javascript` function returns a `sewing-kit` plugin. To use it, include it in the `sewing-kit` configuration file of any project (but not the workspace).

```ts
import {createWebApp} from '@sewing-kit/config';
import {javascript} from '@sewing-kit/plugin-javascript';

export default createWebApp((app) => {
  app.use(javascript());
});
```

This plugin will automatically configure Webpack to process JavaScript files using [`babel-loader`](TODO). Unless you set the `babelConfig` options for this plugin, the Webpack compilation will use this plugin’s Babel preset, [`@sewing-kit/plugin-javascript/babel-preset`](TODO), to compile JavaScript files. This preset includes [`@babel/preset-env`](TODO), and a few additional plugins that make up what we consider to be a good baseline for JavaScript development.

#### Options

The `javascript()` plugin accepts the following options:

- `babelConfig: Partial<BabelConfig>` (default: `undefined`). Sets a base Babel config to use for all tools relying on Babel. When set, this prevents `@sewing-kit/plugin-javascript/babel-preset` from automatically being added to your Babel config. Some other `sewing-kit` plugins, like [`@sewing-kit/plugin-differential-serving`](TODO), use this plugin to automatically configure the level of compilation during build, so be sure you know what you’re doing if you set this option.

  ```ts
  import {createWebApp} from '@sewing-kit/config';
  import {javascript} from '@sewing-kit/plugin-javascript';

  export default createWebApp((app) => {
    app.use(javascript({
      babelConfig: {presets: ['babel-preset-mycompany'],
    }));
  });
  ```

#### Hooks

The `javascript()` plugin adds a number of Babel-related hooks to `sewing-kit`. These hooks are used by other plugins, like [`@sewing-kit/plugin-jest`](TODO), to use Babel as part of other developer tools.

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

These utilities are primarily targeted at developers writing plugins for `sewing-kit`. You don’t need to worry too much about these if that doesn’t describe you.

### `createJavaScriptWebpackRuleSet()`

The `createJavaScriptWebpackRuleSet` returns a promise for a [webpack `UseEntry`](https://webpack.js.org/configuration/module/#ruleuse). This entry will use [`babel-loader`](TODO) that is configured to use the results of calling the [Babel-related hooks provided by the `javascript()` plugin](#hooks). This includes an optimized configuration for the [`babel-loader` `cacheDirectory` option](TODO).

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {createJavaScriptWebpackRuleSet} from '@sewing-kit/plugin-javascript';

const plugin = createPackageBuildPlugin('MyPlugin', ({api, options, hooks}) => {
  hooks.target.hook(({target, hooks}) => {
    hooks.configure.hook((configuration) => {
      // This assumes the @sewing-kit/plugin-webpack webpackHooks() plugin
      // was also included.
      configuration.webpackRules?.hook(async (rules) => {
        // A new webpack rule that will process .esnext files using the Babel
        // configuration provided by this plugin’s javascript() hooks.
        const esnextRule = {
          test: /\.esnext$/,
          exclude: /node_modules/,
          use: await createJavaScriptWebpackRuleSet({
            api,
            target,
            // The environment to build for, typically best to pass
            // through the options.simulateEnv for the build in question.
            env: options.simulateEnv,
            configuration,
            // At least one level of directory. The Babel cache will be scoped
            // under this directory so it does not conflict with other
            // file types being processed using Babel.
            cacheDirectory: 'esnext',
            // Additional packages to consider in the Babel cache key (optional,
            // defaults to an empty array. These dependencies will be used as the
            // initial value for the `babelCacheDependencies` hook)
            cacheDependencies: [],
          }),
        };

        return [...rules, esnextRule];
      });
    });
  });
});
```

### `createCompileBabelStep()`

The `createCompileBabelStep` function returns a [`Step`](TODO) that will transpile the source code for a project using the Babel CLI. Babel will be run with the configuration registered in the [hooks documented above](TODO). This step will also write entry files to the root of your project for each [`entry`](TODO) in the package on which this plugin is run. The result is an isolated `build` directory for the compiled outputs, and a set of entries that provide access to only the parts of the package you have specifically designated as being accessible.

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {
  createCompileBabelStep,
  ExportStyle,
} from '@sewing-kit/plugin-javascript';

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
      // Specifies how the automatically-generated entry files will export the
      // built version of the library. Can be either `EsModules`, to re-export
      // the package using native `esm`, or `CommonJs`, to re-export the package
      // using `module.exports` and `require`.
      exportStyle: ExportStyle.EsModules,
    }),
  ]);
});
```

### `updateBabelPreset()`

The `updateBabelPreset` function returns a function intended for use in the [`babelConfig` hook](TODO). The resulting function will update the configuration for a Babel preset, or optionally add a Babel preset if no matching one is already present in the `babelConfig`. While this update can be done manually as well, this function is useful for normalizing the different way presets can be configured in a `babelConfig`.

The first argument to this function is one or more preset names (as a string or array of strings). Any matching preset will have its configuration updated according to the second argument. This argument can be an options object directly, or a function that accepts the current options for the plugin, and returns the new options to use, or a function that returns a promise for such an object.

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {updateBabelPreset} from '@sewing-kit/plugin-javascript';

const plugin = createPackageBuildPlugin(
  'MyPlugin',
  ({pkg, api, options, hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelConfig?.hook(
        // Will update babel-preset-mycompany to set `modules: false`,
        // in addition to any other options it already has
        updateBabelPreset('babel-preset-mycompany', {modules: false}),
      );

      configure.babelConfig?.hook(
        // Will update babel-preset-mycompany to set `modules: false`
        // as the **only** options (functions override, objects merge)
        updateBabelPreset('babel-preset-mycompany', () => ({modules: false})),
      );

      configure.babelConfig?.hook(
        // Will transform either the base preset name, or the fully resolved
        // path. Uses an existing option and an async call to det
        updateBabelPreset(
          ['babel-preset-mycompany', require.resolve('babel-preset-mycompany')],
          async (options) => {
            if (options.legacy && (await someCheckAboutThisRepo())) {
              return {...options, modules: 'umd'};
            }

            return options;
          },
        ),
      );
    });
  },
);
```

You may also pass an additional options argument to the `updateBabelPreset` function. There is currently one option, `addIfMissing`, which is a `boolean` indicating whether the preset should be added if it is not already present in the configuration.

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {updateBabelPreset} from '@sewing-kit/plugin-javascript';

const plugin = createPackageBuildPlugin(
  'MyPlugin',
  ({pkg, api, options, hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelConfig?.hook(
        // Will update babel-preset-mycompany to set `modules: false`,
        // or add it with those options if it is not present.
        updateBabelPreset(
          'babel-preset-mycompany',
          {modules: false},
          {addIfMissing: true},
        ),
      );

      configure.babelConfig?.hook(
        // If the preset is missing and a function is provided to generate options,
        // it will be called with an empty object in cases where the preset
        // is not already present.
        updateBabelPreset(
          'babel-preset-mycompany',
          (options) => ({
            ...options,
            modules: false,
          }),
          {addIfMissing: true},
        ),
      );

      configure.babelConfig?.hook(
        // If an array of presets are passed, only the first will be included,
        // and only if no match was found in the entire array.
        updateBabelPreset(
          ['babel-preset-mycompany', require.resolve('babel-preset-mycompany')],
          {modules: false},
          {addIfMissing: true},
        ),
      );
    });
  },
);
```

### `updateBabelPlugin()`

The `updateBabelPlugin` is identical to `updateBabelPreset`, but updates `plugins` in the `babelConfig` hook instead of `presets`.

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {updateBabelPlugin} from '@sewing-kit/plugin-javascript';

// A function that creates a `sewing-kit` plugin. This plugin will
// look for the babel-plugin-my-feature plugin, and update its options,
// or add the plugin if it is missing. For details on all the arguments
// accepted by `updateBabelPlugin`, refer to the documentation above
// for `updateBabelPreset`.
export function debugMyFeature() {
  return createPackageBuildPlugin(
    'MyFeature::Debug',
    ({pkg, api, options, hooks}) => {
      hooks.configure.hook((configure) => {
        configure.babelConfig?.hook(
          updateBabelPlugin(
            [
              'babel-plugin-my-feature',
              require.resolve('babel-plugin-my-feature'),
            ],
            (options) => ({...options, debug: true}),
            {addIfMissing: true},
          ),
        );
      });
    },
  );
}
```

### `updateSewingKitBabelPreset()`

The `updateSewingKitBabelPreset` works identically to the `updateBabelPreset` hook, except that it does not accept a list of presets to target. Instead, it will target the default `sewing-kit` Babel preset, and update its options instead.

```ts
import {createPackageBuildPlugin} from '@sewing-kit/config';
import {updateSewingKitBabelPreset} from '@sewing-kit/plugin-javascript';

const plugin = createPackageBuildPlugin(
  'MyPlugin',
  ({pkg, api, options, hooks}) => {
    hooks.configure.hook((configure) => {
      configure.babelConfig?.hook(
        updateSewingKitBabelPreset({modules: 'preserve'}),
      );
    });
  },
);
```
