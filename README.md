# Sewing Kit

- Zero configuration: bootstrap, build, and deploy projects without a dedicated FED
- High performance: fast development flow, and optimized production deployments
- Organization scale: new knowledge, tools, and optimizations are available via a single update

[![NPM version][npm-image]][npm-url]
[![Build status](https://badge.buildkite.com/da49879d6213728c708f8a62868c321b15c7be41d5a2aa1c94.svg)](https://buildkite.com/shopify/sewing-kit)

[npm-url]: https://npmjs.org/package/@shopify/sewing-kit
[npm-image]: http://img.shields.io/npm/v/@shopify/sewing-kit.svg

## Project Information

- [#sewing-kit](https://shopify.slack.com/messages/sewing-kit) in Slack
- [Unicorn project board](https://unicorn.shopify.com/projects/2536)

## How can I use sewing-kit?

- Rails+React apps looking for a modern stack with performance-as-a-feature can use sewing-kit alongside [quilt_rails](https://github.com/Shopify/quilt/tree/master/gems/quilt_rails)
- Rails apps with ERB pages that need to incrementally add JS/TS should check out [sewing_kit](gems/sewing_kit/README.md)
- Stand-alone Node applications exist which use sewing-kit directly but are not supported by Production Platform

## Usage Guide

### Help!

Embedded help for all commands is available via the `--help` option:

```sh
$ yarn run sewing-kit build --help

Options:
  --help         Show help                                             [boolean]
  --mode  [choices: "development", "production", "staging", "test"] [default: "production"]
  --report                                            [boolean] [default: false]
  --source-maps           [choices: "accurate", "fast", "off"] [default: "fast"]
```

### Commands

See [the full list of commands](/docs/commands.md).

### Scripting Commands

Add sewing-kit commands to your `package.json`, e.g.:

```json
{
  "scripts": {
    "build:development": "sewing-kit build --mode development",
    "build:production": "sewing-kit build",
    "check": "sewing-kit check",
    "dev": "sewing-kit dev",
    "lint": "sewing-kit lint",
    "nuke": "sewing-kit nuke",
    "optimize": "sewing-kit optimize",
    "test": "sewing-kit test"
  }
}
```

Then call them from the CLI, or `dev.yml` using:

```sh
yarn run build:development
```

### Building Bundle Reports/Viewing Bundle Contents

`yarn sewing-kit build --report && open public/bundles/bundle-analysis/report.html` will build a bundle analysis which modules are part of each bundle, file sizes and sub-dependencies.

## Configuration

### Defaults

Small projects require no configuration when following the standard layout:

- Development mode information will be read from a project's `railgun.yml`
- Production features (CDN, minification, code splitting, long term caching, etc) are provided with sane `shopifycloud` app defaults

### Configuration Files

sewing-kit reads configuration from the following locations:

- `./config/sewing-kit.config.ts` (Rails only, if `typescript` is a project dependency)
- `./config/sewing-kit.config.js` (Rails only)
- `./sewing-kit.config.ts` (if `typescript` is a project dependency)
- `./sewing-kit.config.js` (for JavaScript projects)

Configuration files _must_ export a single function that generates a configuration.

### Tool-specific configuration

sewing-kit reads common tool-specific configuration for many tools including:

- `postcss.config.js`
- `tsconfig.json`
- `.browserslistrc`
- `.eslintrc`
- `.graphqlconfig`

### Minimal Configuration

```js
module.exports = function() {
  return {};
};
```

### TypeScript Configuration File

To setup TypeScript for a project, install `typescript` as a dependency and add `tsconfig.json` to the project root.

A configuration example for `tsconfig.json` is as follow:

```json
{
  "extends": "@shopify/typescript-configs/application.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": ".",
    "paths": {"*": ["*", "app/*"]}
  },
  "include": ["./app/**/*", "./tests/**/*"]
}
```

See [typescript-configs](packages/typescript-configs/README.md) for more information; but note that this package is included in `sewing-kit` by default and there is no need to install it separately.

### Configuration with Plugins

A configuration function's `plugins` argument contains a [variety of plugins](/docs/plugins.md). Each `plugins` method customizes/extends sewing-kit's behaviour.

e.g.: to omit `jquery` from generated code, and instead read it from the `window` object:

```js
module.exports = function(plugins) {
  return {
    plugins: [plugins.externals({jquery: 'window.$'})],
  };
};
```

### Plugins

See [the full list of plugins](/docs/plugins.md).

### Configuration by environment

An `env` argument is also passed into the config function, allowing tuning for specific environments.

e.g., setting up a non-standard production CDN path, such as [ShopifyCloud's CDN](https://github.com/Shopify/shopify-cloud#--assets-uploading-on-our-cdn):

```js
module.exports = function(plugins, env) {
  return {
    plugins: [
      plugins.cdn(
        env.isProduction ? '//foo.shopifycloud.com/custom-path' : undefined, // Uses development defaults.
      ),
    ],
  };
};
```

Available `env` methods are:

- `hasProductionAssets`
- `isDevelopment`
- `isNotDevelopment`
- `isClient`
- `isTest`
- `isCI`
- `isDevelopmentClient`
- `isTestClient`
- `isServer`
- `isDevelopmentServer`
- `isTestServer`

### Custom Configuration Path

All commands accept a `--config` directive that supersedes the default locations, e.g.:

```sh
sewing-kit build --config my/custom/config.js
```

This forces sewing-kit to read from `my/custom/config.js`.

## FAQ

### Can I use npm instead of yarn?

Yarn is the officially supported package manager. A modern version of npm with a `package-lock.json` _may_ work, but is not guaranteed to stay working.

### Can I use sewing-kit to build libraries?

sewing-kit's current focus is on building web applications. The long term roadmap includes Rollup support. In the meantime, sewing-kit is only useful for linting in library projects.

### Can I use Preact instead of React?

If you are building a smaller app that does not require all the React's functionalities and want to use Preact instead, you can now do it via sewing-kit.

Simply add `preact` as a dependency instead of `react` and `react-dom`. This will add the proper configuration to use Preact with the `h` pragma.

Example :

```js
import {h, render, Component} from 'preact';

class MyComponent extends Component {
  render(props, state) {
    return <span>My preact component</span>;
  }
}

render(<MyComponent />, document.body);
```

#### preact-compat

If you already have a React app, but want to use Preact to reduce your bundle size, you can use the `preact-compat`. Adding the dependency will add the proper aliases to webpack, making it very easy to port your react app to Preact.

All you need to do is add `preact` and `preact-compat` to your dependencies and remove `react` and `react-dom`.

**Note** :@shopify/react-testing has not been tested with Preact, use at your own risk.
