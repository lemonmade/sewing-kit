# `@sewing-kit/plugin-graphql`

> New to `sewing-kit`? [This guide](TODO) explains what `sewing-kit` is, how it’s organized, and how to use it in a project. Read through that overview if you haven’t already — it should help to clarify how to use the tools documented below.

This package provides a group of `sewing-kit` plugins that allow developers to write [GraphQL](https://graphql.org) in dedicated `.graphql` files.

## Installation

```
yarn add @sewing-kit/plugin-graphql --dev
```

## `graphql()`

The `graphql` function returns a `sewing-kit` plugin. This plugin applies to an individual project.

```ts
import {createWebApp} from '@sewing-kit/config';
import {graphql} from '@sewing-kit/plugin-graphql';

export default createWebApp((app) => {
  app.use(graphql());
});
```

This plugin integrates with [`@sewing-kit/plugin-webpack`](TODO), [`@sewing-kit/plugin-jest`](TODO), and [`@sewing-kit/plugin-eslint`](TODO). In Webpack and Jest, `.graphql` files are configured to be processed by the transforms in [`@sewing-kit/graphql`](TODO).

### Webpack

If `@sewing-kit/plugin-webpack`’s `webpackHooks` plugin is included for this project, this plugin will use it to configure Webpack to support importing `.graphql` files. This support is provided by the [`@sewing-kit/graphql/webpack` loader](TODO).

### Jest

If `@sewing-kit/plugin-jest`’s `jestHooks` plugin is also included for the project, this plugin will use it to configure Jest to support importing `.graphql` files. This support is provided by the [`@sewing-kit/graphql/jest` loader](TODO).

### Options

The `graphql()` plugin accepts the following options:

- `export: import('@sewing-kit/graphql').ExportStyle` (default: `document`). Determines what format GraphQL files will be imported as. This option corresponds to the [`export` option from `@sewing-kit/graphql`](TODO). When set, this will update both the Webpack and Jest transforms.

  ```ts
  import {createWebApp} from '@sewing-kit/config';
  import {graphql} from '@sewing-kit/plugin-graphql';

  export default createWebApp((app) => {
    app.use(graphql({export: 'simple'}));
  });
  ```

- `extensions: string[]` (default: `['.graphql']`). Determines what file extensions are treated as GraphQL files.

  ```ts
  import {createWebApp} from '@sewing-kit/config';
  import {graphql} from '@sewing-kit/plugin-graphql';

  export default createWebApp((app) => {
    // Process both .graphql and .gql files
    app.use(graphql({extensions: ['.graphql', '.gql']}));
  });
  ```

## `workspaceGraphQL()`

The `workspaceGraphQL` function returns a `sewing-kit` plugin. This plugin applies to the workspace, not an individual project.

```ts
import {createWorkspace} from '@sewing-kit/config';
import {workspaceGraphQL} from '@sewing-kit/plugin-graphql';

export default createWorkspace((app) => {
  app.use(workspaceGraphQL());
});
```

This plugin automatically configures `eslint` to lint `.graphql` files, if the [`@sewing-kit/plugin-eslint` `eslint` plugin](TODO) is also included in the workspace. For this to have an effect, you should make sure to include ESLint rules that apply to `.graphql` files, like [`eslint-plugin-graphql`](https://github.com/apollographql/eslint-plugin-graphql).

This plugin accepts the same `extensions` option as the `graphql` plugin to enable support for alternate GraphQL file extensions.

```ts
import {createWorkspace} from '@sewing-kit/config';
import {workspaceGraphQL} from '@sewing-kit/plugin-graphql';

export default createWorkspace((app) => {
  app.use(workspaceGraphQL({extensions: ['.graphql', '.gql']}));
});
```
