# @sewing-kit/eslint-plugin

ESLint plugin for Shopify

## Installation

You'll first need to install [ESLint](http://eslint.org):

**With Yarn**

```bash
yarn add --dev eslint
```

**With npm**

```bash
$ npm i eslint --save-dev
```

Next, install `@sewing-kit/eslint-plugin`:

**With Yarn**
```bash
yarn add --dev @sewing-kit/eslint-plugin
```

**With npm**
```bash
$ npm install @sewing-kit/eslint-plugin -save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `@sewing-kit/eslint-plugin` globally.

## Usage

Shopify’s ESLint configs come bundled in this package. In order to use them, you simply extend the relevant configuration in your project’s `.eslintrc`. For example, the following will extend the ESNext (ES2015 and later) config:

```json
{
  "extends": "plugin:@sewing-kit/esnext"
}
```

If you are working on an ES5 project, extend the ES5 version of the configuration:

```json
{
  "extends": "plugin:@sewing-kit/es5"
}
```

You can also add some "augmenting" configs on top of the "core" config by extending an array of linting configs. For example, the following configuration would provide a base ESNext config that is augmented by a React config:

```json
{
  "extends": [
    "plugin:@sewing-kit/esnext",
    "plugin:@sewing-kit/react"
  ]
}
```

Likewise, if you are using TypeScript and React, the following configuration extends the TypeScript base config with the React-specific rules provided by the React configuration file. To demonstrate multiple augmentations, we've also added the Prettier config, which disables rules that will conflict in projects using prettier.

```json
{
  "extends": [
    "plugin:@sewing-kit/typescript",
    "plugin:@sewing-kit/react",
    "plugin:@sewing-kit/prettier",
  ]
}
```

## Provided configurations

This plugin provides the following core configurations:

- **esnext**: Use this for anything written with ES2015+ features.
- **typescript**: Use this for Typescript projects. The rules enabled in this confige do not require type-checking to run. To enable all Typescript rules, you must augment this config with the `typescript-type-checking` config mentioned below.

This plugin also provides the following tool-specific configurations, which can be used on top of the core configurations:

- **node**: Use this for Node projects.
- **react**: Use this for React projects.
- **graphql**: Use this for projects that use [graphql-config](https://github.com/prisma/graphql-config) for graphql validation.
- **prettier**: Use [prettier](https://github.com/prettier/prettier) for consistent formatting. Extending this Shopify's prettier config will [override](https://github.com/prettier/eslint-config-prettier/blob/master/index.js) the default Shopify eslint rules in favor of prettier formatting. Prettier must be installed within your project, as eslint-plugin-shopify does not provide the dependency itself.

### Supported Typescript version

The version range of TypeScript currently supported by this plugin is `>=3.2.1 <3.8.0`. This is constrained by the [@typescipt-eslint parser support](https://github.com/typescript-eslint/typescript-eslint#supported-typescript-version).

## Plugin-Provided Rules

This plugin provides the following custom rules, which are included as appropriate in all core linting configs:

- [typescript/prefer-pascal-case-enums](./docs/rules/typescript/prefer-pascal-case-enums.md): Prefer TypeScript enums be defined using Pascal case.
- [typescript/prefer-singular-enums](./docs/rules/typescript/prefer-singular-enums.md): Prefer TypeScript enums be singular.
