# `@sewing-kit/plugin-css`

> New to `sewing-kit`? [This guide](TODO) explains what `sewing-kit` is, how it’s organized, and how to use it in a project. Read through that overview if you haven’t already — it should help to clarify how to use the tools documented below.

This package provides a collection of `sewing-kit` plugins and other utilities for using CSS. It is build with an emphasis on producing highly-cacheable CSS files in production, and defaults to using [CSS modules](https://github.com/css-modules/css-modules) to avoid CSS naming conflicts. It includes built-in support for using CSS in Webpack and Jest, and for processing CSS using PostCSS.

## Installation

```
yarn add @sewing-kit/plugin-css --dev
```

## Plugins

### `css()`

The `css` function returns a `sewing-kit` plugin. This plugin applies to a single web app or service (packages are not currently supported).

```ts
import {createWebApp} from '@sewing-kit/config';
import {css} from '@sewing-kit/plugin-css';

export default createWebApp((app) => {
  app.use(css());
});
```

This plugin will automatically configure a number of tools to handle CSS files imported in your application, including Webpack and Jest. It also adds a number of custom hooks for fine grained control over the configurations used.

#### Webpack

If `@sewing-kit/plugin-webpack`’s `webpackHooks` plugin is included for this project, this plugin will use it to configure Webpack to support importing `.css` files. The nature of this support depends on the project and environment in which `webpack` is run:

- In any build targeting node, CSS is extracted using the [`onlyLocals` option of `css-loader`](https://github.com/webpack-contrib/css-loader#onlylocals), which extracts mappings for [CSS modules](https://github.com/webpack-contrib/css-loader#modules) but otherwise discards the CSS file.
- In a build targeting web in a development-like environment, CSS is extracted using `css-loader` and [`style-loader`](https://github.com/webpack-contrib/style-loader). Classes are extracted using [CSS modules](https://github.com/webpack-contrib/css-loader#modules) with a default identifier that should globally scope the final names of the resulting classes. Note that this can result in a flash of unstyled content during development if you do server-side rendering, as styles do not load until the JavaScript for the app has executed.
- In a build targeting web in a production-like environment, CSS is extracted using `css-loader` and [`mini-css-extract-plugin`](https://github.com/webpack-contrib/mini-css-extract-plugin). This extracts CSS into dedicated files that will be split along the same boundaries as the JavaScript in your application.

For projects targeting the web, this plugin also adds a customized CSS minifier to Webpack that prevents some potentially dangerous optimizations that are otherwise done by default.

You can fine-tune many parts of the above configuration using the [`cssWebpackFileName`, `cssWebpackMiniExtractOptions`, `cssModuleClassNamePattern`, `cssWebpackLoaderOptions`, `cssWebpackLoaderModule`, `cssWebpackOptimizeOptions`, and `cssWebpackCacheDependencies` hooks provided by this plugin](#hooks). If you need to generate a Webpack rule for other CSS-like languages that require preprocessing, like Sass, you can use the [`createCSSWebpackRuleSet` utility provided by this plugin](#createCSSWebpackRuleSet).

Regardless of the environment or project, this plugin will also configure [`postcss-loader`](https://github.com/postcss/postcss-loader) to run on `.css` files. If you want to provide custom configuration, you can do so with PostCSS config files as you normally would. You can also customize the `postcss-loader` configuration directly with the [`cssWebpackPostcssLoaderOptions` and `cssWebpackPostcssLoaderContext`](#hooks) hooks added by this plugin.

#### Jest

If `@sewing-kit/plugin-jest`’s `jestHooks` plugin is also included for the project, this plugin will use it to configure Jest to treat CSS files as "identity" modules — a module where any imported value will be equal to the name of that import as a string. For example, when you write `import styles from './style.css';`, `styles.MyKlass` would be equal to `"MyKlass"`. This behavior is generally sufficient for unit tests, where CSS is not typically tested directly anyways.

If you want to add additional extensions to treat as stylesheets, you can customize the `cssModuleIdentityProxyExtensions` hook provided by this plugin.

#### Options

The `css()` plugin accepts the following options:

- `cssModules: boolean` (default: `true`). Determines whether this plugin will configure tools to treat imports of CSS files as CSS modules. Setting `cssModules: false` disables the `modules` option on `css-loader` for webpack builds.

  ```ts
  import {createWebApp} from '@sewing-kit/config';
  import {css} from '@sewing-kit/plugin-css';

  export default createWebApp((app) => {
    app.use(css({cssModules: false}));
  });
  ```

- `postcss: boolean | {[key: string]: options}` (default: `true`). Determines whether this plugin will use PostCSS when building this project. Defaults to `true`. If an object is passed instead of a boolean, that object should be a mapping of PostCSS plugin name to options, and will be used as the default set of PostCSS transformations to use. Additional plugins can be added with the [`cssWebpackPostcssPlugins` hook](#hooks) or the [`postcssPlugins()` sewing-kit plugin](#postcssplugins).

  ```ts
  import {createWebApp} from '@sewing-kit/config';
  import {css} from '@sewing-kit/plugin-css';

  export default createWebApp((app) => {
    // disables postcss processing entirely
    app.use(css({postcss: false}));

    // alternatively, this enables postcss, and uses this plugin/ options
    // mapping for configuring PostCSS. Make sure you have any PostCSS
    // dependencies you declare here installed in your project.
    app.use(
      css({
        postcss: {
          'postcss-preset-env': {stage: 3, autoprefixer: {grid: true}},
          'my-company-postcss-plugin': true,
        },
      }),
    );
  });
  ```

- `id: string` (default: `'css'`). Used as a unique identifier for some configuration. Don’t change this unless you know what you’re doing.

#### Hooks

This plugin adds the following hooks to `TestProjectConfigurationHooks`:

- `cssModuleIdentityProxyExtensions`: an array of file extensions to treat as CSS files during tests. As documented below, this plugin will use the result of running this hook to map CSS files to a suitable "noop" module during tests, if you also include `@sewing-kit/plugin-jest`’s `jestHooks()` plugin.

  ```tsx
  import {createWebAppTestPlugin} from '@sewing-kit/config';

  const plugin = createWebAppTestPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      // In addition to the default .css, also provide a mock module for .scss
      // files.
      configure.cssModuleIdentityProxyExtensions!.hook((extensions) => [
        ...extensions,
        '.scss',
      ]);
    });
  });
  ```

This plugin adds the following hooks to `BuildProjectConfigurationHooks` and `DevProjectConfigurationHooks`:

- `cssWebpackFileName`: the file name pattern to use when generating static CSS files. Defaults to a format that is optimized for immutably cached assets.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackFileName!.hook(() => 'static.css');
    });
  });
  ```

- `cssWebpackMiniExtractOptions`: options to use when constructing an instance of [`mini-css-extract-plugin`’s `MiniCssExtractPlugin`](https://github.com/webpack-contrib/mini-css-extract-plugin).

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackMiniExtractOptions!.hook((options) => ({
        ...options,
        publicPath: '/custom/public/path/for/css',
      }));
    });
  });
  ```

- `cssModuleClassNamePattern`: the pattern to use when generating CSS modules from imported CSS files. Defaults to a name that contains some hints to the original location in development, and otherwise to a short, randomly-generated hash.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      // Prefix all CSS modules with "x-"
      configure.cssModuleClassNamePattern!.hook(() => 'x-[hash:base64:5]');
    });
  });
  ```

- `cssWebpackLoaderModule`: the value to use for the [`modules` option in `css-loader`](https://github.com/webpack-contrib/css-loader#modules). By default, this plugin uses CSS modules with a configuration inferred from the `cssModuleClassNamePattern` and details about the project. You can either customize the options in this hook, or return `false` to disable CSS modules entirely.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackLoaderModule!.hook(() => false);
    });
  });
  ```

- `cssWebpackLoaderOptions`: the options to use for `css-loader`.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackLoaderOptions!.hook((options) => ({
        ...options,
        localsConvention: 'dashesOnly',
      }));
    });
  });
  ```

- `cssWebpackPostcssPlugins`: a mapping of PostCSS plugin package name to options, or to `true` if no custom options are required. If you do not specify any custom options, this plugin will tell PostCSS to follow its [default configuration lookup technique](https://github.com/postcss/postcss-loader#config-cascade) to determine the plugins to use on a given stylesheet. However, using this hook to declare your PostCSS configuration will automatically register the plugins you use as part of various cache keys, and will allow for easier custom configuration per build. The result of mapping the entries in this object to construct the plugin will be used for [`postcss-loader`’s `plugins` option](https://github.com/postcss/postcss-loader#plugins).

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackPostcssPlugins!.hook(() => ({
        // This object will be passed to the plugin:
        //   require('postcss-preset-env')({stage: 3, autoprefixer: {grid: true}})
        'postcss-preset-env': {stage: 3, autoprefixer: {grid: true}},
        // We pass it an option *not* to minify, as this sewing-kit plugin will configure minification
        // as part of Webpack instead.
        'postcss-plugin-my-company': {minify: false},
        // `true` is equivalent to an empty object.
        'postcss-custom-plugin': true,
      }));
    });
  });
  ```

- `cssWebpackPostcssLoaderContext`: the context to use for [`postcss-loader`’s configuration](https://github.com/postcss/postcss-loader#context-ctx). This allows you to pass details from the build to your PostCSS configuration. This is generally used instead of `cssWebpackPostcssPlugins` if at all, as that hook allows you to directly set options for plugins without needing to rely on this additional context mechanism.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackPostcssLoaderContext!.hook(() => ({
        // Here, we pass a custom bit of context that will be available to our plugin
        // (declared in `postcss.config.js`).
        'postcss-plugin-my-company': {minify: false},
      }));
    });
  });
  ```

- `cssWebpackPostcssLoaderOptions`: the options to use for `postcss-loader`. If you have no dedicated PostCSS config file, this hook allows you to specify [`plugins`](https://github.com/postcss/postcss-loader#plugins) directly (and `ident`, if you use function-based configuration).

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      // use preset-env in postcss
      configure.cssWebpackPostcssLoaderOptions!.hook((options) => ({
        ...options,
        parser: 'sugarss',
      }));
    });
  });
  ```

- `cssWebpackOptimizeOptions`: the options to use for [`optimize-css-assets-webpack-plugin`](https://github.com/NMFR/optimize-css-assets-webpack-plugin), which is used for production minification of CSS when building with Webpack.

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackOptimizeOptions!.hook((options) => ({
        ...options,
        cssProcessorPluginOptions: {
          preset: ['advanced', {discardComments: {removeAll: true}}],
        },
      }));
    });
  });
  ```

- `cssWebpackCacheDependencies`: a list of NPM packages to include when generating cache identifiers for CSS builds. You should include any PostCSS plugins you use in this list, as well as any packages you use for preprocessing, like `node-sass` (note that, if you use `@sewing-kit/plugin-sass`, this is done automatically for you).

  ```tsx
  import {createProjectBuildPlugin} from '@sewing-kit/config';

  const plugin = createProjectBuildPlugin(({hooks}) => {
    hooks.configure.hook((configure) => {
      configure.cssWebpackCacheDependencies!.hook((dependencies) => [
        ...dependencies,
        'postcss-plugin-my-company',
      ]);
    });
  });
  ```

### `postcssPlugins()`

The `postcssPlugins` function returns a `sewing-kit` plugin that applies to a project. To include this plugin, you **must** include the [`css()` plugin](#css) as well. You pass this function a mapping of PostCSS plugin name to its options. Alternatively, you can pass a function that returns this value, or a promise for such a value.

```ts
import {createWebApp} from '@sewing-kit/config';
import {css, postcssPlugins} from '@sewing-kit/plugin-css';

export default createWebApp((app) => {
  app.use(
    css(),
    // A mapping of plugin => options
    postcssPlugins({
      'postcss-preset-env': {stage: 3, autoprefixer: {grid: true}},
    }),
    // Or a function returning the plugin configuration
    postcssPlugins(() => ({
      'postcss-plugin-my-company': {minify: false},
    })),
    // That function can also return a promise for the plugin configuration
    postcssPlugins(async () =>
      (await hasDependency('postcss-custom-plugin'))
        ? {
            'postcss-custom-plugin': true,
          }
        : {},
    ),
  );
});
```

More complex customizations of the PostCSS plugins can be done with the [`cssWebpackPostcssPlugins` hook provided by the `css()` plugin](#hooks).

### `cssModuleExtensions()`

The `cssModuleExtensions` function returns a `sewing-kit` plugin that applies to a project. To include this plugin, you **must** include the `css()` plugin as well. This plugin should be called with one or more extensions to treat as stylesheets. Files with these extensions will be [transformed in Jest as documented above](#jest).

```ts
import {createWebApp} from '@sewing-kit/config';
import {css, cssModuleExtensions} from '@sewing-kit/plugin-babel';

export default createWebApp((app) => {
  app.use(css(), cssModuleExtensions(['.scss']));
});
```

More complex customizations of the extensions treated as CSS modules can be done in the [`cssModuleIdentityProxyExtensions` hook provided by the `css()` plugin](#hooks).

### `cssModuleClassNamePattern()`

The `cssModuleClassNamePattern` function returns a `sewing-kit` plugin that applies to a project. To include this plugin, you **must** include the `css()` plugin as well. This plugin should be called with a string representing the [pattern to use for CSS module class names](https://github.com/webpack-contrib/css-loader#localidentname). This plugin automatically uses a good default for all types of projects, so only change this if you have a particular need for the compiled CSS class names.

```ts
import {createWebApp} from '@sewing-kit/config';
import {css, cssModuleClassNamePattern} from '@sewing-kit/plugin-babel';

export default createWebApp((app) => {
  // Will prefix the base64-hashed class names with a consistent string to make
  // them easier to find in the DOM.
  app.use(css(), cssModuleClassNamePattern('prefix__[hash:base64]'));
});
```

More complex customizations of the CSS module class name pattern can be done with the [`cssModuleClassNamePattern` hook provided by the `css()` plugin](#hooks).

### `cssWebpackLoaderOptions()`

The `cssWebpackLoaderOptions` function returns a `sewing-kit` plugin that applies to a project. To include this plugin, you **must** include the `css()` plugin as well. This plugin can be called with additional options to pass to `css-loader`. You can also pass a function that returns these options, or a promise for the options. Be careful, as any values you pass here will directly overwrite the defaults provided by this plugin, and no deep merging is performed.

```ts
import {createWebApp} from '@sewing-kit/config';
import {css, cssWebpackLoaderOptions} from '@sewing-kit/plugin-babel';

export default createWebApp((app) => {
  app.use(
    css(),
    cssWebpackLoaderOptions({url: true}),
    cssWebpackLoaderOptions(() => ({importLoaders: 2})),
  );
});
```

More complex customizations of these options can be done with the [`cssWebpackLoaderModule` and `cssWebpackLoaderOptions` hooks provided by the `css()` plugin](#hooks).

## Utilities

### `createCSSWebpackRuleSet()`

The `createCSSWebpackRuleSet` function returns a promise for a webpack `RuleSet` that can be used to handle other file types that are treated as stylesheets. It configures all the loaders up to the `postcss-loader`, so additional loaders that compile a file down to CSS can be appended to the end.

```ts
import {createProjectBuildPlugin} from '@sewing-kit/config';
import {createCSSWebpackRuleSet} from '@sewing-kit/plugin-css';

const plugin = createProjectBuildPlugin(
  'MyPlugin',
  ({project, api, hooks, options}) => {
    hooks.configure.hook((configuration) => {
      // This is a (slightly) simplified version of @sewing-kit/plugin-sass’s use of this
      // utility to construct its own Webpack rule.
      configuration.webpackRules?.hook(async (rules) => {
        const use = await createCSSWebpackRuleSet({
          // Several options are mandatory to get some of your plugin’s context...
          api,
          project,
          configuration,
          env: options.simulateEnv,
          sourceMaps: options.sourceMaps,
          // Whether PostCSS should be enabled or not, or an options object used as
          // the default plugins for the `cssWebpackPostcssPlugins` hook. Defaults to true.
          postcss: true,
          // Whether to treat the resulting stylesheets as CSS modules. Defaults to true.
          cssModules: true,
          // A custom directory to store build caches in. Must **not** be an absolute path.
          cacheDirectory: 'sass',
          // Additional dependencies to include for Webpack’s cache-loader.
          cacheDependencies: ['node-sass'],
        });

        return [
          ...rules,
          {
            test: /\.scss$/,
            use: [...use, {loader: 'node-sass'}],
          },
        ];
      });
    });
  },
);
```
