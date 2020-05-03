# `@sewing-kit/plugin-differential-serving`

> New to `sewing-kit`? [This guide](TODO) explains what `sewing-kit` is, how it’s organized, and how to use it in a project. Read through that overview if you haven’t already — it should help to clarify how to use the tools documented below.

This package provides a `sewing-kit` plugin that helps developers implement “differential serving”, where a different set of assets is used depending on the feature support of the browser requesting a page. It transpiles different features by environment using [`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env) (for scripts) and [`postcss-preset-env`](https://preset-env.cssdb.org), so to get the full benefits you must also include [`@sewing-kit/plugin-javascript](TODO) and [`@sewing-kit/plugin-css](TODO), which add these environment presets by default.

## Installation

```
yarn add @sewing-kit/plugin-differential-serving --dev
```

## `differentialServing()`

The `differentialServing` function returns a `sewing-kit` plugin. This plugin applies to a single web app.

```ts
import {createWebApp} from '@sewing-kit/config';
import {differentialServing} from '@sewing-kit/plugin-differential-serving';

export default createWebApp((app) => {
  app.use(differentialServing());
});
```

By default, this plugin will double the number of builds for the application it is applied to — one build for your “baseline” browsers, and one for the most recent versions of evergreen browsers. The baseline browser support is determined by the [browserslist configuration](https://github.com/browserslist/browserslist) for your repo, so you should include one of [browserslist’s configuration files](https://github.com/browserslist/browserslist#config-file) to avoid the default, conservative browser targets being used.

### Customizing the browser groups

The default behavior of creating two sets of bundles — one for the most recent versions of evergreen browsers, and one for the rest of your users — is not going to be the right choice for all applications. Apps can change the number of builds, and what browsers are targeted for each build, by passing the `browsers` option when creating this plugin. The value you pass should be an object where the keys are short identifiers for the group, and the values are valid browserslist queries. You can also pass one of the preset groupings exported from this package:

```ts
import {createWebApp} from '@sewing-kit/config';
import {
  differentialServing,
  LATEST_EVERGREEN,
  ES_MODULES,
} from '@sewing-kit/plugin-differential-serving';

export default createWebApp((app) => {
  app.use(
    differentialServing({
      // This will produce 4 builds per app: baseline, latest, modules, and ie.
      latest: LATEST_EVERGREEN,
      modules: ES_MODULES,
      ie: ['extends @my-company/browserslist-config/ie'],
    }),
  );
});
```

The order you put these values in determines their precedence when [resolving the right bundle at runtime](TODO). You should not include the “baseline” bundle in this listing — as noted above, it will be created for you automatically based on your project’s `browserslist` configuration.

### Babel and PostCSS presets

This plugin works by configuring `@sewing-kit/plugin-javascript/babel-preset` (which wraps `@babel/preset-env`) and `@sewing-kit/plugin-css (which wraps`postcss-preset-env`) to use the right`browserslist`query for each build. It does so by hooking in to the`babelConfig`and`postcssPlugins`hooks, and augmenting the configuration for those presets if they exist. It will do the same if it detects`@babel/preset-env`or`postcss-preset-env`are being used directly. If you have your own Babel or PostCSS presets that wrap the`env`presets, you can disable it for Babel by passing`babel: false`when constructing the plugin, and likewise with`postcss: false` for PostCSS.

If you pass either of these options, you **must** configure your Babel and/ or PostCSS configuration with the right browsers yourself, which you can do with the help of the `browsers` key on the `variant` passed as part of the configuration hooks for the project.

```ts
import {createWebApp} from '@sewing-kit/config';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';
import {
  differentialServing,
  ES_MODULES,
} from '@sewing-kit/plugin-differential-serving';

const browserGroups = {
  modules: ES_MODULES,
  ie: ['extends @my-company/browserslist-config/ie'],
};

export default createWebApp((app) => {
  app.use(
    differentialServing({browsers: browserGroups, babel: false}),
    createProjectBuildPlugin('MyPlugin', ({hooks}) => {
      // `browsers` one of the keys in your `browsers`, or `undefined` for the
      // baseline build
      hooks.configure.hook((configuration, {browsers}) => {
        // We set our default config to include the preset with a `browsers`
        // option determined by the browser group being built for this
        // variant
        configuration.babelConfig!.hook((config) => ({
          presets: [
            [
              '@my-company/babel-preset',
              {
                browsers: browsers && browserGroups[browsers],
              },
            ],
          ],
        }));
      });
    }),
  );
});
```

## Getting the right bundles at runtime

TODO
