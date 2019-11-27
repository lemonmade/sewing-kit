# Migration guide

This is a concise summary of changes and recommendations around updating sewing-kit in consuming projects. For a more detailed list of changes, see [the changelog](./CHANGELOG.md).

<!-- ## Unreleased -->

## 0.105.0

- _Suggestion:_ if `sewing-kit.config.ts` contains `plugins.cdn` workarounds to make `SK_SIMULATE_PRODUCTION` functional, try removing them! (When simulating production, sewing-kit now defaults serving assets via the Rails public path)

## 0.1.4.2

✅ No action required.

## 0.104.1

✅ No action required.

## 0.104.0

✅ No action required.

## 0.103.2

⚠️ Rails projects with custom build output paths can now configure the path to the manifest using `SewingKit.configure`. If not configured, Sewing Kit will look into `/public/bundles/sewing-kit-manifest.json`. Please note that `manifest_name` allows the _manifest_ name to be changed, whereas `manifest_path` allows the entire path to be changed.

### Example

```ruby
# my_rails_app/config/initializers/sewing_kit.rb
# frozen_string_literal: true

SewingKit.configure do |config|
  config.manifest_path = "public/assets/bundles/custom.json"
end
```

## 0.103.1

✅ No action required.

## 0.103.0

- _Suggestion:_ The Jest config now includes test setup files (see below). If your `sewing-kit.config.ts` adds any of these files manually using `plugins.jest`, they can now be removed.

### `setupFiles`

- `tests/setup.js`
- `tests/setup.ts`
- `app/ui/tests/setup.js`
- `app/ui/tests/setup.ts`

### `setupFilesAfterEnv`

- `tests/each-test.js`
- `tests/each-test.ts`
- `app/ui/tests/each-test.js`
- `app/ui/tests/each-test.ts`

## 0.102.0

✅ No action required.

## 0.101.0

✅ No action required.

## 0.100.0

⚠️ Prettier upgrade - `yarn sewing-kit format` should handle most warnings

## 0.99.0

✅ No action required.

## 0.98.0

🛑Breaking change - ensure that `caniuse-lite` is up to date. The following commands should force the latest version:

```
yarn upgrade caniuse-lite@1.0.30000989
npx yarn-deduplicate -s highest --packages caniuse-lite
git checkout package.json
```

If an error about `internationalization-plural-rul` appears, the old version is still present. Please raise a Discourse issue for support.

🛑Breaking change - Rails apps now expect test utilities to live inside of `app/ui/tests`

- Move all test setup files from `tests/` to `app/ui/tests`.

🛑Breaking change - Both "shopify/jest/no-if" and "shopify/jest/no-try-expect" have been replaced with "jest/no-if" and "jest/no-try-expect". If you have configuration for these rules, you will need to change the name by removing "shopify".

## 0.97.3

- `sewing-kit doctor` now recommends activating webpack tree shaking.

## 0.97.2

✅ No action required.

## 0.97.1

✅ No action required.

## 0.97.0

If your CI setup runs a script to verify that `runtime.js` contains all asset SRI hashes, this can be safely removed. sewing-kit now has an automated post-build check for this.

## 0.96.0

If your project has an explicit `package.json#resolutions` entry for `webpack-hash-output-plugin`, it can be safely removed.

## 0.95.2

✅ No action required.

## 0.95.1

✅ No action required.

## 0.95.0

🛑 Breaking change - Rails projects using the `shopify-cloud` gem now default to requesting assets from Shopify's CDN.

Explicit CDN configuration can be removed because it is now the default behavior. e.g, 🔥 setup like this:

```
  plugins.cdn(env.hasProductionAssets ? 'https://cdn.shopifycloud.com/partners/bundles/' : undefined),
```

## 0.94.0

🛑 Breaking change - `runtime-regenerator` is no longer automatically inserted into all client entrypoints

To guarantee the inclusion of `runtime-regenerator`, projects should `import '@shopify/polyfills/base'` at the top-level of their application (see [the `@shopify/polyfills` usage guide for more information](https://github.com/Shopify/quilt/tree/master/packages/polyfills#usage))

🛑 Breaking change - during Rails tests, the sewing_kit gem now defaults to returning empty arrays for `sewing_kit_script_tag` / `sewing_kit_link_tag` helpers

If a project's Rails tests depend on behaviour provided by sewing_kit-generated assets, the old behaviour can be enabled via:

```rb
# config/initializers/sewing_kit.rb
SewingKit.configure do |config|
  config.test_manifest_mode = :use_precompiled_assets
end
```

## 0.93.0

Projects may now specify custom [browserslist](https://github.com/browserslist/browserslist) configs using `.browserslistrc` files or a `browserslist` field in their `package.json`. This configuration will then be used to determine how much transpilation / polyfilling is performed for `baseline` browser support.

To expand upon the existing `baseline` configuration you can [extend](https://github.com/browserslist/browserslist#shareable-configs) our shareable configuration, `@shopify/browserslist-config`.

### Examples

Using our baseline configuration but also supporting Internet Explorer 11:

#### Using a `package.json` field

```json
  "browserslist": [
    "extends @shopify/browserslist-config",
    "ie 11"
  ]
```

#### Using a `.browserslistrc`

```
  extends @shopify/browserslist-config
  ie 11
```

## 0.92.0 (sewing_kit gem)

⚠️ Rails projects with custom build output paths should use `SewingKit.configure` to adjust where in `public/bundles` the `sewing_kit` gem looks for build metadata in production. If not configured it `manifest_name` will default to `sewing-kit-manifest.json`

### Example

```ruby
# my_rails_app/config/initializers/sewing_kit.rb
# frozen_string_literal: true

SewingKit.configure do |config|
  # look for the manifest at `public/bundles/custom.json`
  config.manifest_name = "custom.json"
end
```

Note that since `sewing_kit_assets` now depends on the `request.user_agent` present in a Rails controller/view, you can no longer use that helper in nonstandard contexts (for example API responses). This is not considered a supported usecase due to the problematic nature of attempting to return javascript/css from things like API responses, which can make your application vulnerable to XSS as well as lose the ability to be statically analyzed / tree-shaken. Feel free to open an issue if you feel there are valid usecases that this breaks.

## 0.91.0

🛑Breaking change - Rails projects now output assets to `public/bundles/baseline` _and_ `public/bundles/latest`. If a project upload sourcemaps to Bugsnag, its upload script may need to be adjusted.

⚠️ app/styles/settings.scss (for node) / app/ui/styles/settings.scss (for rails) is no longer automatically imported at the top of every file. If you wish to keep this behaviour you should specify this file in the `autoInclude` option of your sass plugin config in sewing-kit.config.js as per https://github.com/Shopify/sewing-kit/blob/master/docs/plugins/sass.md#autoinclude

## 0.85.0

Tests are now transpiled with Babel! See the [Babel tests migration guide for more information](/docs/babel-tests-migration-guide.md).

## 0.84.0

✅ No action required

## 0.83.5

✅ No action required

## 0.83.4

✅ No action required

## 0.83.3

✅ No action required

## 0.83.2

✅ No action required

## 0.83.1

✅ No action required

## 0.83.0

⚠️ If you updated to version 81–82, you may have added additional linting comments/ rule overrides for `@typescript-eslint`-prefixed rules. We've temporarily reverted the changes that introduced these rules, so you will need to revert those changes.

## 0.82.1

✅ No action required

## 0.82.0

⚠️ The new loaders for `.graphql` files generate different output. As noted in the [`graphql-mini-transforms` repo](https://github.com/Shopify/graphql-tools-web/tree/master/packages/graphql-mini-transforms), you can’t have multiple operations in the same GraphQL file (which was possible with the previous loader). If you do have multiple operations in a single file, split them into individual files instead.

## 0.81.1

🛑 Do not use this release; 0.82.0 adds a dependency that is missing from this version

## 0.81.0

🛑 Do not use this release in; 0.82.0 adds a dependency that is missing from this version

ℹ️ React projects now import icons from `/icons/` as React Components, and should use PascalCase to render them directly (e.g.: `<ExampleIcon />`).

ℹ️ For React projects, `sewing-kit` used to replace all non-white fill colors in SVGs, but now it only replaces the following colors: `#FFF`, `#212B36`, `#919EAB`. If the icons used in your project do not match Shopify's color guidelines you might have to update them to use colors from the list above.

ℹ️ Polaris projects using the `polaris-react` `Icon` component just need to use PascalCase (e.g.: `<Icon source={ExampleIcon} />`

❗️️ For non-React projects, imports from `/icons/` are now treated as images. Ask #sewing-kit about options for icon handling.

## 0.80.2

✅ No action required

## 0.80.1

✅ No action required

## 0.80.0

⚠️ New `eslint-plugin-shopify` rules; `yarn sewing-kit format` can automatically fix some errors.

## 0.79.3

## 0.79.2

## 0.79.1

✅ No action required

## 0.79.0

⚠️ If you were previously including the `@shopify/react-i18n/babel` Babel plugin manually for Jest and Webpack, you should remove it, as it is now automatically included by sewing-kit. This will require `@shopify/react-i18n` version `>= 1.0.0`

## 0.78.0

⚠️ Polyfills for `core-js` can be loaded based both on browser support and usage by using `babel-preset-shopify@^18.0.0`. Additional polyfills should be loaded via `@shopify/polyfills` by following [its documentation](https://github.com/Shopify/quilt/tree/master/packages/polyfills). This will ensure appropriate polyfills for the current environment are loaded and nothing more.

## 0.77.0

✅ No action required

## 0.76.1

## 0.76.0

✅ No action required

## 0.75.4

## 0.75.3

## 0.75.2

## 0.75.1

## 0.75.0

✅ No action required

## 0.74.2

## 0.74.1

## 0.74.0

✅ No action required

## 0.73.1

## 0.73.0

✅ No action required

## 0.72.0

✅ No action required

## 0.71.0

❗️️ If you use GraphQL and TypeScript, and have interfaces or enums in your schema, you may start seeing some failures related to the generated types. There is a breaking change in how types are generated for enum and interface fields where you have queried for all possible types. You can read more about these changes in the [`graphql-typescript-definitions` changelog](https://github.com/Shopify/graphql-tools-web/blob/master/packages/graphql-typescript-definitions/CHANGELOG.md#changed)

You can now pass a [`customScalars` option](https://github.com/Shopify/sewing-kit/blob/master/docs/plugins/graphql.md#custom-scalars) to the `graphql` plugin if you'd like to generate custom TypeScript types for GraphQL scalars.

## 0.70.1

✅ No action required

## 0.70.0

✅ No action required

## 0.69.1

If you had set a resolution to version 0.13+ of `hard-source-webpack-plugin` to get around issues with default exports, you can now remove it.

## 0.69.0

✅ No action required

## 0.68.3

✅ No action required

## 0.68.2

Node projects should add `--baseline-only` to their `sewing-kit build` command when used to generate reports for Shrink ray.

## 0.68.1

✅ No action required

## 0.68.0

⚠️ Larger projects should use `sewing-kit build --heap` to increase the memory available to sewing-kit
❗️️ Replace any use of `sewing-kit build-parallel` with `sewing-kit build`
❗️️ Node projects _must_ add a [browserslist config](https://github.com/browserslist/browserslist) that represents their baseline (full) browser support.

This configuration is used to compile a more minimal part of your application code, and failing to set a config will fall back to fully compiling all code to target ES5. We recommend that you add the following field to your `package.json`, which sets the baseline browser support to be the same as Shopify Web:

```json
{
  "browserslist": ["extends @shopify/browserslist-config"]
}
```

❗️️ Node projects _must_ update their servers to understand that assets are now nested in separate directories. Koa projects should use the new [`sewing-kit-koa` package](https://github.com/Shopify/quilt/tree/master/packages/sewing-kit-koa), which abstracts away the details about the manifest shape and allows you to get the right assets for the useragent making the request.

For non-Koa Node projects, you will need to manually update whatever code interacts with the manifest to respect the new shape. Make sure that you respect the `browsers` key when it exists to pick the most appropriate bundle based on the useragent of the request.

❗️️ Scripts in Node projects that depend on `build/client` being a flat directory of files must be updated to understand that assets are now nested in separate directories. Projects may have such a dependency in scripts that upload assets, or in a Shrink ray script that looks for the bundle report.

Projects can depend on having a `build/client/latest` and a `build/client/baseline` directory, each with the same list of assets that used to be present in `build/client`. We recommend using the bundle report generated in `build/client/baseline` when updating Shrink ray scripts, as this provides the "worst case" bundle size for your application.

## 0.67.3

✅ No action required

## 0.67.2

✅ No action required

## 0.67.1

✅ No action required

## 0.67.0

✅ No action required

⚠️ Small image files are no longer embedded in JavaScript. Users with slow connections may take a few seconds to see images after first paint.

## 0.66.0

✅ No action required

## 0.65.1

✅ No action required

## 0.65.0

✅ No action required

## 0.64.4

✅ No action required

## 0.64.3

✅ No action required

## 0.64.2

✅ No action required

## 0.64.1

✅ No action required

## 0.64.0

- webpack and helper libraries were updated; 🎩 thoroughly in development and production modes

## 0.63.0

- Run `sewing-kit format` to autofix Prettier changes
- webpack and helper libraries were updated; 🎩 thoroughly in development and production modes

## 0.62.0

- Remove `eslint-plugin-graphql` from `package.json#resolutions` (if necessary)
- TypeScript projects should upgrade to `3.1.1`
  - Or add resolution `"typescript-eslint-parser": "19.0.2"` to remain with `typescript@~3.0.0`
  - Or add resolution `"typescript-eslint-parser": "17.0.1"` to remain with `typescript@~2.9.0`

## 0.61.0

- Add `eslint-plugin-graphql@2.1.0-0` to `resolutions` in `package.json`
- Projects with multiple schemas should:
  - Update `plugins.graphql` per [this guide](https://github.com/Shopify/sewing-kit/blob/master/docs/plugins/graphql.md#multiple-schemas)
  - Update import paths (i.e., `.../build/schema.json` → `.../build/projectName-schema.json`)
- For optimal compatibility, consider adding `resolutions` to `package.json` for:
  - `@types/graphql@0.13.4`
  - `graphql@0.13.2`
  - `graphql-config@2.1.1`

## 0.60.3

✅ No action required

## 0.60.2

❗️️ Mandatory update to fix a critical bug that causes corrupted JavaScript files in production builds

If an upgrade to this version is not possible, work around the bug by adding this to `package.json`:

```
"resolutions": {"mini-css-extract-plugin": "0.4.1"}
```

## 0.60.1

✅ No action required

## 0.60.0

❗️ Mandatory update for Rails projects. This version fixes issues with large svgs / pngs not uploading to staging/production servers.

- Run `sewing-kit format` to autofix eslint changes

## 0.59.0

- Remove `eslint-plugin-graphql` from your project's `package.json`
- Upgrade `graphql` in your project's `package.json` to `^0.13.0`

## 0.58.1

✅ No action required

## 0.58.0

❗️ Polaris projects _must_ upgrade to `@shopify/polaris@3.x`. This vastly improves dead code elimination.

## 0.57.0

❗️ GraphQL projects _must_ add a `.graphqlconfig` file ([guide](https://github.com/Shopify/sewing-kit/blob/master/docs/plugins/graphql.md#multiple-schemas))

- For projects with a single, nameless schema, replace schema types imports:
  - `import {...} from 'types/graphql';` becomes...
  - `import {...} from 'types/graphql/types';`
- For projects with multiple schemas, replace schema type imports:
  - `import {...} from 'types/graphql';` becomes...
  - `import {...} from 'types/graphql/${projectName}-types';`
- Optionally, install [`prisma.vscode-graphql` VSCode extension](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql)

## 0.56.1

✅ No action required

## 0.56.0

- Rails only - remove `compression-webpack-plugin` from your project
- Recommendation: convert `sewing-kit.config.js` to `sewing-kit.config.ts`

## 0.55.0

- In `sewing-kit.config.js`:
  - Replace calls to `env.isProductionClient` with `env.isClient && env.hasProductionAssets`
  - Replace calls to `env.isProductionServer` with `env.isServer && env.hasProductionAssets`
- `staging` mode is now supported; remove any CI workarounds 🎇

## 0.54.0

✅ No action required

## 0.53.1

✅ No action required

## 0.53.0

- Rails only - adjust any scripts to account for non-`development` environments defaulting to `/bundles` as a public path

## 0.52.0

- Run `sewing-kit format` to autofix eslint changes

## 0.51.1

✅ No action required

## 0.51.0

✅ No action required

## 0.50.1

✅ No action required

## 0.50.0

- webpack and helper libraries were updated; 🎩 thoroughly in development and production modes
- Polaris applications **must** upgrade to `@shopify/polaris@2.2.1`
- Entrypoints using `import '@shopify/polaris/styles/components.scss';` **must** switch to conditionally importing via `plugins.entry`, e.g.:

```js
module.exports = function(plugins, env) {
  return {
    plugins: [
      plugins.entry({
        main: [
          env.isDevelopment
            ? '@shopify/polaris/styles/components.scss'
            : undefined,
          path.join('path/to/entry.js'),
        ].filter(Boolean),
      }),
    ],
  };
};
```

## 0.49.1

✅ No action required

## 0.49.0

- Some projects may see issues with multiple versions of `graphql`/ `@types/graphql` as a result of conflicts between sewing-kit and other packages, like apollo-client. We recommend using a `resolution` field in your package.json to force a version that conforms to sewing-kit’s dependency (`^0.13.0).
- Run `sewing-kit type-check` to see new type errors introduced by changing GraphQL types. You will primarily see issues with referencing types detailing deeply nested fields in your query; these need to be updated to be the pascal case version of the keypath to that field:

  ```graphql
  query MyQuery {
    self {
      brother {
        sister {
          name
        }
      }
    }
  }
  ```

  ```typescript
  // Assuming we want the type for `sister`, we now need to update our type reference:

  import {MyQueryData} from './MyQuery.graphql';

  type Sister = MyQueryData.SelfBrotherSister;
  ```

- If you were previously hand-writing `enum`s for GraphQL `enum` types, update your code to import them from the schema type definition file instead (note that, in accordance with our TypeScript styleguide, all `enum` cases are in pascal case):

  ```typescript
  // Before:
  enum Format {
    Pdf = "PDF"
    Csv = "CSV"
  }

  // After:
  import {Format} from 'types/graphql';
  ```

## 0.48.2

✅ No action required

## 0.48.1

- If build speeds regress, try `node --max-old-space-size=2000 node_modules/.bin/sewing-kit build`

## 0.48.0

❗️ Do not use this release. This is an incorrectly published version of the 0.47.0 release.

## 0.47.1

✅ No action required

## 0.47.0

- Run `sewing-kit format` to autofix markdown / Prettier warnings
- Vet async imports for accidental `Module` assignments
  - e.g., if `foo` is an ES Module
  - `const foo = await import('./foo');` should be converted to
  - `const {default: foo} = await import('./foo');`
  - This behaviour was changed in `webpack@4.10`

## 0.46.0

- Node only - consider enabling `plugins.experiments({reactLoadable: true})` for server-side async chunk loading improvements
  - See [shopify/web](https://github.com/Shopify/web/pull/4513/files) for more details on enabling code splitting & SSR
  - See [`react-loadable`](https://github.com/jamiebuilds/react-loadable) for additional documentation

## 0.45.6

✅ No action required

## 0.45.5

✅ No action required

## 0.45.4

✅ No action required

## 0.45.3

- Enable `package.json#sideEffects: false` in your project for enhanced dead code elimination (sewing-kit will fail on erroneously eliminated modules!)

## 0.45.2

✅ No action required

## 0.45.1

✅ No action required

## 0.45.0

### Changed

- 🎩 your app in development and production modes

## 0.44.0

✅ No action required
