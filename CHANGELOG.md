# Changelog

All notable consumer-facing changes are documented in this file. For a concise guide to updating sewing-kit, see [the migration guide](./migration-guide.md).

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and from `v0.7.0`, this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.106.1] - 2019-09-19

- Bumps `react-server-webpack-plugin` to `2.1.14` to resolve errors with missing modules. [#1471](https://github.com/Shopify/sewing-kit/pull/1471)

## [0.106.0] - 2019-09-17

### Fixed

- sewing_kit loads development manifests quickly again [[#1465](https://github.com/Shopify/sewing-kit/pull/1465)]
- Mitigated performance regression in vendor bundle calculations during development mode boot [[#1469](https://github.com/Shopify/sewing-kit/pull/1469)]

### Added

- Vendor DLL logic now supports [running in a yarn workspace](https://github.com/Shopify/sewing-kit/pull/1459) when `sewing-kit` has been installed in a sub-package.

### Changed

- Updated `graphql-typescript-definitions` to `0.17.3` and `graphql-validate-fixtures` to `0.11.3` [#1463](https://github.com/Shopify/sewing-kit/pull/1463)

## [0.105.0] - 2019-09-11

- For Rails apps running with `SK_SIMULATE_PRODUCTION`, the default CDN path is now `/bundles/` [[#1458](https://github.com/Shopify/sewing-kit/pull/1458)]

## [0.104.2] - 2019-09-11

### Fixed

- Fixed `Missing i18n manager` errors during server rendering by including `@shopify/react-i18n` imports in the server bundle [[#1452](https://github.com/Shopify/sewing-kit/pull/1452)]
- Included `@shopify/react-csrf`, and `@shopify/react-app-bridge-react` imports in the server bundle to prevent server rendering errors [[#1452](https://github.com/Shopify/sewing-kit/pull/1452)]

## [0.104.1] - 2019-09-04

- Update `/@shopify/webpack-asset-sri-hash-verification-plugin` to use relative asset paths instead of absolute paths [#1443](https://github.com/Shopify/sewing-kit/pull/1443)

## [0.104.0] - 2019-09-04

- Update `@shopify/react-server-webpack-plugin@2.1.0` to [support Node projects](https://github.com/Shopify/quilt/pull/917) [#1434](https://github.com/Shopify/sewing-kit/pull/1434/files)

## [0.103.2] - 2019-08-29

### Fixed

- Fixed `ApolloContext` errors during server rendering by embedding all `@shopify/react-self-serializers` imports in the server bundle [[#1435](https://github.com/Shopify/sewing-kit/pull/1435)]

## [0.103.1] - 2019-08-21

### Added

- `sewing-kit` now automatically defaults `plugins.vendor` with a list of vendorable packages. [[#1426](https://github.com/Shopify/sewing-kit/pull/1426)]

## [0.103.0] - 2019-08-20

### Changed

- Includes the following jest test setup files if they exist in a project [#1425](https://github.com/Shopify/sewing-kit/pull/1425). See migration guide for more details
  - `<test-setup-path>/setup.ts`
  - `<test-setup-path>/each-test.ts`
- Added `@shopify/react-server` to externals config [[1421](https://github.com/Shopify/sewing-kit/pull/1421)]

## [0.102.0] - 2019-08-19

### Added

- `sewing-kit` now automatically generates `server` and `client` entry files for apps that depend on `@shopify/react-server`

## [0.101.0] - 2019-08-18

- Added `@shopify/react-self-serializers` to externals config [[1421](https://github.com/Shopify/sewing-kit/pull/1421)]

## [0.100.0] - 2019-08-15

### Changed

- Update to `prettier` to `1.18.2` [[1407](https://github.com/Shopify/sewing-kit/pull/1407)]
- `sewing-kit` now outputs server build files into `build/server` automatically for apps using `quilt_rails` and `@shopify/react-server` [[#1415](https://github.com/Shopify/sewing-kit/pull/1415)]

## [0.99.0] - 2019-08-14

### Changed

- The `railsWithNodeServer` experiment is now ignored [#1411](https://github.com/Shopify/sewing-kit/pull/1411)
- Added more detail to asynchronous SRI verification output [[#1413](https://github.com/Shopify/sewing-kit/pull/1413)]
- Updates `@types/graphql` to `14.2.3`, `graphql` to `14.4.2`, and `graphql-config` to `2.2.1` [[1406](https://github.com/Shopify/sewing-kit/pull/1406)]

## [0.98.0] - 2019-98-14

### Added

- Added `@shopify/webpack-asset-sri-hash-verification-plugin` in the `build` command to verify that asset filenames contain a valid SRI hash [[#1408](https://github.com/Shopify/sewing-kit/pull/1408)]

### Fixed

- Fix `internationalization-plural-rul` errors during production builds [[#1392](https://github.com/Shopify/sewing-kit/pull/1392)]

### Changed

- `sewing-kit` now expects Rails projects to store client and server entries in `app/ui/client` and `app/ui/server` when they include the `quilt_rails` gem.
- `sewing-kit` now expects Rails projects to store test setup files under `app/ui/tests` instead of `/tests` [[#1389](https://github.com/Shopify/sewing-kit/pull/1389)]

## [0.97.3] - 2019-08-07

### Added

- `sewing-kit doctor` now recommends activating webpack tree shaking [[#1390](https://github.com/Shopify/sewing-kit/pull/1390)]

## [0.97.2] - 2019-08-02

### Fixed

- "Hang tight" page now works in apps with complex routing (by directly hitting asset server URLs for status updates) [[#1385](https://github.com/Shopify/sewing-kit/pull/1385)]

## [0.97.1] - 2019-08-02

### Fixed

- Use a version of `@shopify/webpack-runtime-sri-verification-plugin` with published files

## [0.97.0] - 2019-09-02

### Added

- Added `@shopify/webpack-runtime-sri-verification-plugin` in the `build` command to verify that SRI hashes embedded in async JavaScript and CSS filenames are referenced by a runtime file [[#1373](https://github.com/Shopify/sewing-kit/pull/1373)]
- Update to `eslint-plugin-shopify` v30.0.1 [[1372](https://github.com/Shopify/sewing-kit/pull/1372)]

### Fixed

- Fixed missing dependency breaking `sewing-kit doctor` [[#1379](https://github.com/Shopify/sewing-kit/pull/1379)]

## [0.96.0] - 2019-08-01

### Fixed

- Fix CSS hashing for edge cases with exactly the same CSS in multiple chunks [[#1376](https://github.com/Shopify/sewing-kit/pull/1376)]

## [0.95.2] - 2019-07-31

Accidentally published version. Identical to 0.95.1.

## [0.95.1] - 2019-07-31

### Fixed

- Use a less brittle Ruby callout when shelling out for the shopify-cloud bucket name [[#1375](https://github.com/Shopify/sewing-kit/pull/1375)]

## [0.95.0] - 2019-07-31

### Changed

- Scoped builds now save the uglify cache in a scoped cache directory [[#1371](https://github.com/Shopify/sewing-kit/pull/1371)]
- Rails projects using the `shopify-cloud` gem no longer need manual `plugins.cdn` configuration [[#1359](https://github.com/Shopify/sewing-kit/pull/1359)]
- Fixed inaccuracies and added best practice information to `plugins.cdn` documentation [[#1360](https://github.com/Shopify/sewing-kit/pull/1360)]

### Fixed

- Shelling out to `shopify-cloud` for the project name now passes along ENV variables [[#1363](https://github.com/Shopify/sewing-kit/pull/1363)]

## [0.94.1] - 2019-07-25

### Added

- `sewing-kit doctor` now recommends shopify-cloud for Rails projects [[#1346](https://github.com/Shopify/sewing-kit/pull/1346/files)]
- `sewing-kit doctor` now fails if a Rails project has `devDependencies` [[#1347](https://github.com/Shopify/sewing-kit/pull/1347)]
- `sewing-kit doctor` now flags dependencies in `package.json` that are already provided by sewing-kit [[#1349](https://github.com/Shopify/sewing-kit/pull/1349)]
- `sewing-kit doctor` checks now link to documentation with fuller descriptions [[#1353](https://github.com/Shopify/sewing-kit/pull/1353)]

## [0.94.0]

### Changed

- Upgrade to `@shopify/polyfills@1.0.0` [[#1344](https://github.com/Shopify/sewing-kit/pull/1344/files)]
- Breaking change: `runtime-regenerator` is no longer automatically prepended to all client entrypoints [[#1344](https://github.com/Shopify/sewing-kit/pull/1344/files)]

## [0.93.0] - 2019-07-24

### Added

- `@shopify/build-targets`, and by extension `sewing-kit`, now supports custom `.browserslistrc` files or `browserslist` fields in your project's package.json. When producing production bundles the `baseline` browser support will be determined by your custom configuration if it is present, or else default to `@shopify/browserslist-config`. [[#1342](https://github.com/Shopify/sewing-kit/pull/1342)]

## [0.92.1] - 2019-07-22

- Kill orphaned development servers during startup (redux) [[#1336](https://github.com/Shopify/sewing-kit/pull/1336)]

## [0.92.0] - 2019-07-19

### Added

- Base TypeScript configuration files to package `@shopify/typescript-configs` [[#1318](https://github.com/Shopify/sewing-kit/pull/1318) and make it a dependency to sewing-kit [[#1334](https://github.com/Shopify/sewing-kit/pull/1334) to make project setup easier
- Run a verify existence script after a build to verify successful generation of assets [[#1333](https://github.com/Shopify/sewing-kit/pull/1333)]

## [0.91.2] - 2019-07-18

### Changed

- Reverted a fix that attempted to kill orphaned development server processes [[#1335](https://github.com/Shopify/sewing-kit/pull/1335)]

## [0.91.1] - 2019-07-17

### Fixed

- The "hang tight" view now displays while Rails apps are starting up [[#1317](https://github.com/Shopify/sewing-kit/pull/1317)]
- Core production schema fetches no longer time out during dev integration startup [[#1332](https://github.com/Shopify/sewing-kit/pull/1332)]
- Kill orphaned development servers during startup [[#1331](https://github.com/Shopify/sewing-kit/pull/1331)]

## [0.91.0] - 2019-07-11

### Added

- `sewing-kit build` now generates two different versions of client assets for Rails projects: one targeting the "baseline" browser support for the project, and the other targeting only the latest version of evergreen browsers. This feature was introduced for Node projects in version `0.68.0` [[#1308](https://github.com/Shopify/sewing-kit/pull/1308)]

## [0.90.0] - 2019-07-08

- Test debugging no longer requires a `--debug` argument
- Upgrades `@shopify/images` to `2.0.0` to remove `removeDimensions` svg optimization that can cause issues. ([#1302](https://github.com/Shopify/sewing-kit/pull/1302))

## [0.89.2] - 2019-07-05

- Internal documentation improvements

## [0.89.1] - 2019-07-04

### Fixed

- Fixed `@shopify/async@2.x` being unable to synchronously resolve modules

## [0.89.0] - 2019-07-04

### Added

- `sewing-kit doctor` with Rails deployment checks

### Changed

- **Breaking change:** Removed suppport for automatically importing your app/styles/settings.scss (for node) / app/ui/styles/settings.scss (for rails) at the top of every component's scss file. If you wish to keep this behaviour you should specify this file in the `autoInclude` option of your sass plugin config in sewing-kit.config.js [[#1294](https://github.com/Shopify/sewing-kit/pull/1294)]
- Do not fail `lint` due to TypeScript version not being officially supported [[1293](https://github.com/Shopify/sewing-kit/pull/1293)]
- Loosened the `@shopify/async` version dependency to support the new 2.x versions

## [0.88.0] - 2019-06-18

- Update to `eslint-plugin-shopify` v29.0.2 [[1285](https://github.com/Shopify/sewing-kit/pull/1285)]

## [0.87.0] - 2019-06-17

- **Breaking change:** Splits the service worker manifests into folders based on browser targets at `build/service-worker/<target>/assets.json` [[#1276](https://github.com/Shopify/sewing-kit/pull/1276)]
  - Service worker targets are now aligned with client targets
  - This also provides a consolidated service-worker manifest at `build/service-worker/assets.json` for applications to use at runtime
- Add `--scope-caches` to the `build` command which uses a seperate cache directory based on the target build [[#1276](https://github.com/Shopify/sewing-kit/pull/1276)]
- Add `--build-identifier <baseline|latest>` to the `build` command which runs the client and service-worker build for the target specified [[#1276](https://github.com/Shopify/sewing-kit/pull/1276)] - Use this over `--baseline-only`
- The `playground` command no longer overwrites the `.gitignore` file [[#1272](https://github.com/Shopify/sewing-kit/pull/1272)]
- `*.d.ts` files will be ignored when testing with the `--coverage` option [[#1277](https://github.com/Shopify/sewing-kit/pull/1277)]

## [0.86.0] - 2019-06-07

- **Breaking change:** Adds browser metadata to the manifests generated by `@shopify/webpack-asset-metadata-plugin` [[#1265](https://github.com/Shopify/sewing-kit/pull/1265)]
  - For Node.js apps, this requires a minimum of `@shopify/sewing-kit-koa@4.0.0`

## [0.85.5] - 2019-06-03

- Update to `babel-preset-shopify` v20.0.0 [[#1264](https://github.com/Shopify/sewing-kit/pull/1264)]

## [0.85.4] - 2019-06-03

Do not use this release. It relies upon an accidental breaking change in babel-preset-shopify v19.1.0, that was then reverted in v19.1.1

- `sewing-kit.config.ts` can now import other typescript files [[#1258]](https://github.com/Shopify/sewing-kit/pull/1258)]
- Use `babel-preset-shopify`'s typescript option instead of specifying babel configs directly [[#1259](https://github.com/Shopify/sewing-kit/pull/1259)]

## [0.85.3] - 2019-05-29

### Fixed

- `format` crashes on large projects [[#1254](https://github.com/Shopify/sewing-kit/pull/1254)]

## [0.85.2] - 2019-05-23

- Test transpilation no longer fails if react-i18n is not a dependency [[#1250](https://github.com/Shopify/sewing-kit/pull/1250)]

## [0.85.1] - 2019-05-23

### Fixed

- Fixed an issue where the Jest transformer for Typescript would throw a syntax error on older versions of Node

## [0.85.0] - 2019-05-21

### Updated

- Upgrade to `jest@24` [[#1246](https://github.com/Shopify/sewing-kit/pull/1246)]
- `sewing-kit test` now uses `@babel/typescript` to transpile `.ts`/`.tsx` files [[#1246](https://github.com/Shopify/sewing-kit/pull/1246)]

### Removed

- Removed all logic associated to automaticaly opening the file in the Playground to address a problem when using `yarn playground` [[#1236](https://github.com/Shopify/sewing-kit/pull/1236)]

## [0.84.0] - 2019-05-08

### Updated

- Upgrade `webpack-dev-server` to `3.3.1` to address a [security vulnerability](https://github.com/nodejs/security-wg/blob/master/vuln/npm/485.json)

### Fixed

- "Baseline" bundles no longer receive excessive polyfills [[#1232](https://github.com/Shopify/sewing-kit/pull/1232)]

## [0.83.5] - 2019-05-01

### Fixed

- Sort `@shopify/find-duplicate-dependencies-plugin` results by package name [[#1229](https://github.com/Shopify/sewing-kit/pull/1229)]
- Sort `@shopify/find-duplicate-dependencies-plugin` dependency path results with deepest paths last [[#1229](https://github.com/Shopify/sewing-kit/pull/1229)]

## [0.83.4] - 2019-05-01

### Fixed

- `@shopify/find-duplicate-dependencies-plugin` exclude paths are now relative to the compilation root directory [[#1228](https://github.com/Shopify/sewing-kit/pull/1228)]

## [0.83.3] - 2019-05-01

### Fixed

- Prevented the server build in development from watching `node_modules` [[#1218](https://github.com/Shopify/sewing-kit/pull/1218)]

## [0.83.2] - 2019-05-01

### Added

- `@shopify/find-duplicate-dependencies-plugin` [[#1225](https://github.com/Shopify/sewing-kit/pull/1225/files)]

## [0.83.1] - 2019-04-29

### Fixed

- Fixed an issue with the new GraphQL Jest transforms.

## [0.83.0] - 2019-04-29

### Fixed

- Upgrade eslint to fix vscode's prettier plugin ([#1223](https://github.com/Shopify/sewing-kit/pull/1223))

## [0.82.1] - 2019-04-29

### Fixed

- Fixed an issue with the new GraphQL webpack transforms that failed on documents importing multiple other GraphQL documents.

## [0.82.0] - 2019-04-29

### Added

- React projects now use `@svgr/webpack` to load icons from `/icons/` folders [[#1208](https://github.com/Shopify/sewing-kit/pull/1208)]
- Non-React projects now use `file-loader` to load icons from `/icons/` folders [[#1208](https://github.com/Shopify/sewing-kit/pull/1208)]

### Changed

- GraphQL is now loaded by [`graphql-mini-transforms`](https://github.com/Shopify/graphql-tools-web/tree/master/packages/graphql-mini-transforms) instead of `graphql-tag` [[#1195](https://github.com/Shopify/sewing-kit/pull/1195)]

### Fixed

- Deleted Jest SVG mock transform [[#1221](https://github.com/Shopify/sewing-kit/pull/1221)]

## [0.81.1] - 2019-04-24

### Updated

- Updated GraphQL tooling (`graphql-config-utiltiies`, `graphql-tool-utilities`, `graphql-typed`, `graphql-typescript-definitions`, and `graphql-validate-fixtures`) [[#1219](https://github.com/Shopify/sewing-kit/pull/1219)]

## [0.81.0] - 2019-04-23

### Updated

- Updated to the latest version of all Babel preset and plugins, which includes a fix for the spurious `corejs` warnings [[#1217](https://github.com/Shopify/sewing-kit/pull/1217)]
- Removed `@shopify/images/icon-loader` [[#1208](https://github.com/Shopify/sewing-kit/pull/1208)]

### Added

- Added the new `webpack-persisted-graphql-plugin` to automatically generate a `graphql.json` in the build directory. This file maps from a unique identifier to the full GraphQL document body for use with persisted queries [[#1195](https://github.com/Shopify/sewing-kit/pull/1195)]

## [0.80.2] - 2019-04-20

### Fixed

- Load fewer libraries on startup [[#1212](https://github.com/Shopify/sewing-kit/pull/1212)]

### Fixed

- Fix port conflicts during dev server restarts [[#1207](https://github.com/Shopify/sewing-kit/pull/1207)]

## [0.80.0] - 2019-04-12

### Updated

- Upgraded `eslint-plugin-shopify` to `27.0.1` [[#1197](https://github.com/Shopify/sewing-kit/pull/1197)]
- Running `sewing-kit optimize` will now add a trailing newline to optimized svgs [[#1193](https://github.com/Shopify/sewing-kit/pull/1193)]

## [0.79.3] - 2019-04-04

### Updated

- Upgraded `stylelint-config-shopfiy` to `7.2.0` [[#1192](https://github.com/Shopify/sewing-kit/pull/1192)]

## [0.79.2] - 2019-03-30

- No changes (monorepo test)

## [0.79.1] - 2019-03-30

- No changes (monorepo test)

## [0.79.0] - 2019-03-29

### Added

- The [`@shopify/react-i18n` Babel plugin](https://github.com/Shopify/quilt/tree/master/packages/react-i18n#babel) is now included automatically when it is a dependency of the project [[#1191](https://github.com/Shopify/sewing-kit/pull/1191)]

## [0.78.1] - 2019-03-25

- No changes (monorepo test)

### Updated

- `@shopify/async` upgraded to latest version [[#1174](https://github.com/Shopify/sewing-kit/pull/1174)]

## [0.78.0] - 2019-03-22

### Added

`@shopify/polyfills` now automatically uses the appropriate entry points for client, server, and test environments. [[#1163](https://github.com/Shopify/sewing-kit/pull/1163)]

## [0.77.0] - 2019-03-14

### Added

`sewing-kit type-check` now checks service-worker code using `service-worker/tsconfig.json` (when available) [[#1175](https://github.com/Shopify/sewing-kit/pull/1175)]

## [0.76.1] - 2019-03-12

### Fixed

- `graphql-typescript-definitions` upgraded to eliminate peer dependency warning on `graphql-typed@^0.2.0` [[#1173](https://github.com/Shopify/sewing-kit/pull/1173)]

## [0.76.0] - 2019-03-11

### Updated

- `graphql` and GraphQL related utilities have been upgraded to version 14 [[#1171](https://github.com/Shopify/sewing-kit/pull/1171)]

## [0.75.4] - 2019-03-08

### Updated

- Updated `graphql-tool-utilities`, `graphql-typescript-definitions`, and `graphql-validate-fixtures` to latest versions [[#1170](https://github.com/Shopify/sewing-kit/pull/1170)]

## [0.75.3] - 2019-03-04

### Added

- Actionable feedback for build out of memory errors [[#1167](https://github.com/Shopify/sewing-kit/pull/1167)]

## [0.75.2] - 2019-03-02

### Fixed

- Fixed race condition in GraphQL schema file writes (again) [[#1166](https://github.com/Shopify/sewing-kit/pull/1166)]

### Updated

- Updated the `@shopify/browserslist-config` dependency to the latest version

## [0.75.1] - 2019-02-25

### Updated

- Upgraded to a more recent dependency on `graphql-typed`

## [0.75.0] - 2019-02-25

### Added

- The `@shopify/async` Babel transform is now run when compiling tests, which allows modules using this package to be resolved synchronously for testing environments [[#1161](https://github.com/Shopify/sewing-kit/pull/1161)]

## [0.74.2] - 2019-02-25

### Fixed

- Failed compilation always outputs errors [[#1160](https://github.com/Shopify/sewing-kit/pull/1160)]

## [0.74.1] - 2019-02-22

### Added

- Build processes can be debugged via `--debug` [[#1151](https://github.com/Shopify/sewing-kit/pull/1151)]

### Fixed

- Fixed race condition in GraphQL schema file writes [[#1158](https://github.com/Shopify/sewing-kit/pull/1158)]

## [0.74.0] - 2019-02-14

### Changed

- sewing-kit now uses an environment-specific `tsconfig.json`s if one is present in `/service-worker`.

## [0.73.2] - 2019-02-11

### Fixed

- `vendor.js` no longer serves malformed JavaScript during recompile/browser refresh workflows [[#1147](https://github.com/Shopify/sewing-kit/pull/1147)]

## [0.73.1] - 2019-02-10

### Fixed

- `@shopify/react-graphql` can now have the bundles it creates extracted, like `@shopify/react-async` does.

## [0.73.0] - 2019-02-10

### Added

- The manifest created by sewing kit now includes details about bundles split with dynamic imports under the `asyncAssets` key [[#1140](https://github.com/Shopify/sewing-kit/pull/1140)]
- Added the new `@shopify/async/babel` plugin to support the upcoming `@shopify/react-async` and `@shopify/react-graphql` packages [[#1143](https://github.com/Shopify/sewing-kit/pull/1143)]
- The `sewing-kit type-check` command now accepts a `--heap` option for specifying the amount of heap space to give TypeScript [[#1142](https://github.com/Shopify/sewing-kit/pull/1142)]

## [0.72.0] - 2019-02-06

### Added

- Service workers built using Sewing Kit can now import `@shopify/sewing-kit-asset-manifest` to get access to the paths of all of the built client assets. [#1139](https://github.com/Shopify/sewing-kit/pull/1139)

### Fixed

- The `externals` plugin no longer breaks service-worker builds that attempt to import libraries from `node_modules`. [[#1141](https://github.com/Shopify/sewing-kit/pull/1141)]

## [0.71.0] - 2019-01-25

### Added

- The `graphql` plugin now accepts a `customScalars` option, which is passed directly to the [`graphql-typescript-definitions` option](https://github.com/Shopify/graphql-tools-web/tree/master/packages/graphql-typescript-definitions#--custom-scalars) responsible for generating custom type definitions for GraphQL custom scalars.

### Changed

- The generation of TypeScript types for union and intersection GraphQL fields was changed in cases where all implementing types are queried (the [`graphql-typescript-definitions` changelog](https://github.com/Shopify/graphql-tools-web/blob/master/packages/graphql-typescript-definitions/CHANGELOG.md#0150---2019-01-22) has more details)

## [0.70.1] - 2019-01-22

### Fixed

- Fixed `sewing-kit playground` showing a blank screen [#1135](https://github.com/Shopify/sewing-kit/pull/1135)

## [0.70.0] - 2019-01-22

### Added

- `sewing-kit dev` now sets a [`Timing-Allow-Origin` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin) on all assets
- `sewing-kit start --asset-server-only` now sets a [`Timing-Allow-Origin` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin) on all assets

### Fixed

- `sewing-kit dev` no longer incorrectly appends `react-hot-loader` imports to `service-worker` bundles [[#1132](https://github.com/Shopify/sewing-kit/pull/1132)]
- `sewing-kit start` once again runs the `service-worker` build as well as `client` and `server` [[#1132](https://github.com/Shopify/sewing-kit/pull/1132)]

### Changed

- Pass envName into rollup's babel plugin so logic based on environment gets triggered correctly [[#1128](https://github.com/Shopify/sewing-kit/pull/1128)]
- Updated `babel-plugin-shopify` to `17.0.1` to fix cases where envName was not honored [[#1128](https://github.com/Shopify/sewing-kit/pull/1128)]

## [0.69.1] - 2019-01-17

### Fixed

- Update `hard-source-webpack-plugin` to `0.13.1` to prevent errors with default exports [[#1121](https://github.com/Shopify/sewing-kit/issues/1121)]
- Updated our PostCSS preset to prevent potentially dangerous CSS transformations in production environments.

## [0.69.0] - 2019-01-09

### Changed

- Upgrade `stylelint-config-shopfiy` to `7.1.0` [[#1123](https://github.com/Shopify/sewing-kit/pull/1123)]
- Updated `rollup` dependencies [[#1115](https://github.com/Shopify/sewing-kit/pull/1115)]:
  - `rollup` is now at `1.0.2`
  - `rollup-plugin-babel` is now at `4.2.0`
  - `rollup-plugin-commonjs` is now at `9.2.0`
  - `rollup-plugin-json` is now at `3.1.0`
  - `rollup-plugin-node-resolve` is now at `4.0.0`

### Fixed

- Fixed an issue where the new build commands could hang in some environments [[#1124](https://github.com/Shopify/sewing-kit/pull/1124)]

## [0.68.3] - 2019-01-07

### Fixed

- Tests with dynamic import statements now compile correctly [[#1120](https://github.com/Shopify/sewing-kit/pull/1120)]

## [0.68.2] - 2019-01-04

### Added

- `sewing-kit build` now accepts a `--baseline-only` flag that builds only the "full" browser support version of the bundle for Node projects [[#1119](https://github.com/Shopify/sewing-kit/pull/1119)]

### Fixed

- `sewing-kit build --report` now correctly generates a report in the nested build directories for Node projects [[#1119](https://github.com/Shopify/sewing-kit/pull/1119)]

## [0.68.1] - 2019-01-04

### Fixed

- Non-script/ style assets are now served correctly in development for node projects [[#1118](https://github.com/Shopify/sewing-kit/pull/1118)]

## [0.68.0] - 2019-01-03

### Changed

- `sewing-kit build` now generates two different versions of client assets for Node projects: one targeting the "baseline" browser support for the project, and the other targeting only the latest version of evergreen browsers [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]
- `sewing-kit build` no longer targets a hardcoded set of browsers for the client build, and instead uses your project’s [browserslist config](https://github.com/browserslist/browserslist) [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]
- `sewing-kit dev` now defaults to a build that only targets the latest evergreen browsers [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]
- `sewing-kit dev` and `sewing-kit playground` now support a `--browser` option to specify what target to use for the build. Valid options are `chrome`, `firefox`, `safari`, `edge` (will be the latest version of the specified browser), `evergreen` (same as default), or `supported` (full browser support for the project) [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]
- Builds are now run in separate processes to prevent memory exhaustion [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]
- `sewing-kit build` now supports a `--heap` option to set the amount of memory allocated to each spawned build process [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]

### Updated

- Updated to the latest version version of Babel, PostCSS, and related dependencies [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]

### Removed

- Removed the `build-parallel` command [[#1096](https://github.com/Shopify/sewing-kit/pull/1096)]

## [0.67.4] - 2019-01-03

### Added

- `service-worker` builds now generate an asset manifest.

## [0.67.3] - 2019-01-03

### Fixed

- Using the `--focus` flag now works better for projects using React Router 4 [[#1112](https://github.com/Shopify/sewing-kit/pull/1112)]
- `sewing-kit lint` no longer crashes on unparsable files.

### Added

- Invalid `sewing-kit` commands now result in a recommended replacement command [[#1114](https://github.com/Shopify/sewing-kit/pull/1114)]

## [0.67.2] - 2018-12-14

### Fixed

- `sewing-kit dev` now runs the server with `NODE_ENV=development` in node projects [[#1110](https://github.com/Shopify/sewing-kit/pull/1110)]

## [0.67.1] - 2018-12-13

### Fixed

- `sewing-kit clean` is now better at cleaning out legacy generated GraphQL types files [[#1108]](https://github.com/Shopify/sewing-kit/pull/1108)

### Added

- A third type of build is now supported for projects with a top level `service-worker` folder. These will be built targetting `webworker` to the `build/service-worker` folder. [[#1106](https://github.com/Shopify/sewing-kit/pull/1106)]

### Changed

- `worker` is no longer a special-cased entry name [[#1106](https://github.com/Shopify/sewing-kit/pull/1106)]

## [0.67.0] - 2018-12-04

### Fixed

- Forced `sewing-kit lint` to print all output in a case where it used to silently fail [[#1105](https://github.com/Shopify/sewing-kit/pull/1105)]

### Changed

- Non-icon image files smaller than 10KB are no longer embedded in JavaScript [[#1093](https://github.com/Shopify/sewing-kit/pull/1093)]

## [0.66.0] - 2018-11-29

### Changed

- The latest `graphql-typescript-definitions` no longer accepts files for `schemaTypesPath`, but accepts directories instead. [[#1100](https://github.com/Shopify/sewing-kit/pull/1100)]

## [0.65.1] - 2018-11-28

### Fixed

- `sewing-kit dev` displays compilation errors again [[#1103](https://github.com/Shopify/sewing-kit/pull/1103)]

## [0.65.0] - 2018-11-27

### Added

- `worker` is now a special-cased entry name that will output a server worker file to `build/cient` [[#1098](https://github.com/Shopify/sewing-kit/pull/1098)]

### Changed

- `bugsnag` entries are no longer exempted from autoincluded globals [[#1098](https://github.com/Shopify/sewing-kit/pull/1098)]
- Better cache identifiers [[#1053](https://github.com/Shopify/sewing-kit/pull/1053)]

### Added

- `sewing-kit test` now supports `--testNamePattern` to focus on a single test [[#1094](https://github.com/Shopify/sewing-kit/pull/1094)]

### Fixed

- adding multiple server entrypoints no longer hangs indefinitely in dev [[#1097](https://github.com/Shopify/sewing-kit/pull/1097)]

## [0.64.4] - 2018-11-14

### Changed

- Typechecking is no longer performed during test runs [[#1082](https://github.com/Shopify/sewing-kit/pull/1082)]

## [0.64.3] - 2018-11-14

### Fixed

- `sewing-kit build --watch` no longer hangs when a `graphql-config` project has no defined `includes` [[#1084](https://github.com/Shopify/sewing-kit/pull/1084)]

## [0.64.2] - 2018-11-11

### Fixed

- Development cache should be fully warm after first compilation [[#1080](https://github.com/Shopify/sewing-kit/pull/1080)]

## [0.64.1] - 2018-11-10

### Fixed

- Node app server restarts no longer fail on port conflicts when yarn>=1.11 is installed [[#1079](https://github.com/Shopify/sewing-kit/pull/1079)]

## [0.64.0] - 2018-11-10

### Added

- `.mjs` files are now compiled

### Changed

- `sewing-kit test --coverage` now writes to `build/coverage` [[#1063](https://github.com/Shopify/sewing-kit/pull/1063)]
- `sewing-kit test --coverage` defaults to creating text-summary, html and lcov reports [[#1063](https://github.com/Shopify/sewing-kit/pull/1063)]
- Successful builds now report their maximum heap size on completion [[#1069](https://github.com/Shopify/sewing-kit/pull/1069)]
- Dependency updates (`image-webpack-loader`, `node-sass`, `ts-loader`, `webpack`) [[#1068](https://github.com/Shopify/sewing-kit/pull/1068)]

### Fixed

- Avoid time-consuming `stats.toJson` calls & compiler memory leaks [[#1064](https://github.com/Shopify/sewing-kit/pull/1064)]

## [0.63.0] - 2018-11-02

### Updated

- Removed the `--json` and `--markdown` option from `sewing-kit lint` and `sewing-kit format` and replaced them with a new `--others` option [[#1024](https://github.com/Shopify/sewing-kit/pull/1024)]
- Updated Prettier to v1.14.3 and taught `sewing-kit lint` and `sewing-kit format` how to format YAML files [[#1024](https://github.com/Shopify/sewing-kit/pull/1024)]
- Updated many dependencies (webpack, webpack plugins, webpack dev tools, node-sass, stylelint, svgo) [[#1060](https://github.com/Shopify/sewing-kit/pull/1060)]

## [0.62.0] - 2018-10-31

### Added

- Better out-the-box library support for `sewing-kit test`. Setting `library:true` in your sewing-kit.config.ts shall configure jest's modulePaths to look in the `src` directory. [[#1027]](https://github.com/Shopify/sewing-kit/pull/1027)

### Changed

- Updated `ts-jest` dependency to `~23.10.4`. [[#974](https://github.com/Shopify/sewing-kit/pull/974)]
- Upgrade `eslint-plugin-shopfiy` to `26.1.0` (adds `typescript@3.1.1` support) [[#1038](https://github.com/Shopify/sewing-kit/pull/1038)]

## [0.61.0] - 2018-10-22

### Added

- full `graphql-config` support for all commands and operations requiring schema configuration [[#956]](https://github.com/Shopify/sewing-kit/pull/956)

## [0.60.3] - 2018-10-22

### Fixed

- Properly set the `Content-Type` header of the empty vendor js script to `application/javascript` [[#1017](https://github.com/Shopify/sewing-kit/pull/1017)]

## [0.60.2] - 2018-10-16

### Fixed

- The latest `mini-css-extract-plugin` no longer causes invalid string replacements in builds [[#1016](https://github.com/Shopify/sewing-kit/pull/1016)]

## [0.60.1] - 2018-10-16

### Added

- `sewing-kit test --no-graphql` now omits GraphQL operations [[#1009](https://github.com/Shopify/sewing-kit/pull/1009)]
- `sewing-kit refresh-graphql --mode production` will now refresh production GraphQL files [[#1012](https://github.com/Shopify/sewing-kit/pull/1012)]

### Fixed

- `jest` module resolver now prefers `.js` modules over `.ts` or `.tsx` [[#1007](https://github.com/Shopify/sewing-kit/pull/1007)]
- `sewing-kit clean` no longer fails on TypeScript + GraphQL projects when cleaned paths are missing [[#1013](https://github.com/Shopify/sewing-kit/pull/1013)]

## [0.60.0] - 2018-10-15

### Changed

- Updating `eslint-plugin-shopify` to add support for `typescript-eslint-parser@19.0.2` [[#989](https://github.com/Shopify/sewing-kit/pull/989)]
- `sewing-kit dev` type checks only when using the `--type-check` flag [[#999](https://github.com/Shopify/sewing-kit/pull/999)]
- `sewing-kit-manifest.json#assets` now lists all emitted assets for the project, not just chunks. The structure is the same, but the values will now be an object under an `all` key, where the keys are indexes and the values at the file paths [[#992](https://github.com/Shopify/sewing-kit/pull/992)]

### Fixed

- Dynamic imports no longer break in SSR [[#997](https://github.com/Shopify/sewing-kit/pull/997)]
- `lint --graphql=false` no longer performs graphql operations. [[#985](https://github.com/Shopify/sewing-kit/pull/985)]
- `react-loadable` no longer crashes on anonymous assets with no dependencies [[#986](https://github.com/Shopify/sewing-kit/pull/986)]
- `clean` command now removes generated schema types files. [[#993](https://github.com/Shopify/sewing-kit/pull/993)]

## [0.59.0] - 2018-09-27

### Added

- Fail compilation when Typescript is not installed and the project uses `.ts`/`.tsx` files. [[#910](https://github.com/Shopify/sewing-kit/issues/910)]
- Fail compilation when React is not installed and the project uses `.jsx`/`.tsx` files. [[#955](https://github.com/Shopify/sewing-kit/issues/955)]
- `type-check` supports the `--watch` flag [[#890](https://github.com/Shopify/sewing-kit/pull/890)]
- `sewing-kit dev` runs type-check in a separate non-blocking process [[#890](https://github.com/Shopify/sewing-kit/pull/890)]
- New `refresh-graphql` command to only fetch and process GraphQL files [[#964](https://github.com/Shopify/sewing-kit/pull/964)]

### Changed

- Development vendor bundle now contains unminified sources (including the development version of React) [[#962](https://github.com/Shopify/sewing-kit/pull/962)]
- Version bump stylelint and stylelint-config-shopify to latest versions [[#961](https://github.com/Shopify/sewing-kit/pull/961)]
- graphql plugin will emit an informative warning instead of crashing if the `graphql-config` file is missing [[#959](https://github.com/Shopify/sewing-kit/pull/959)]
- Upgrade `eslint` to `5.6.0`, `eslint-plugin-shopify` to `25.0.1`. Remove `eslint-plugin-graphql`. [[#972](https://github.com/Shopify/sewing-kit/pull/972)]

### Fixed

- `CI=true sewing-kit test --debug` no longer throws Jest exceptions [[#969](https://github.com/Shopify/sewing-kit/pull/969)]

## [0.58.1] - 2018-09-13

### Changed

Exactly the same as 0.58.0. Needed to fix a markdown formatting issue.

## [0.58.0] - 2018-09-13

### Changed

- Breaking change - improve Polaris tree shaking by consuming minimally transpiled js/scss [[#717](https://github.com/Shopify/sewing-kit/pull/717)]

## [0.57.0] - 2018-09-11

### Added

- Multiple graphql schema support using `.graphqlconfig` files ([Prisma graphql-config](https://github.com/prisma/graphql-config) format via [`graphql-typescript-definitions`](https://github.com/Shopify/graphql-tools-web) as of `0.11.0`). [[#949](https://github.com/Shopify/sewing-kit/pull/949)]

### Fixed

- Server tests are now run when performing `sewing-kit test` locally. [[#904](https://github.com/Shopify/sewing-kit/pull/904)]

### Removed

- Removed `--app-only` and `--server-only` arguments from `sewing-kit test`. This functionality can be provided by passing in path matches. [[#904](https://github.com/Shopify/sewing-kit/pull/904)]

## [0.56.1] - 2018-08-28

### Fixed

- "Hang tight" redirect script no longer 404s [[#907](https://github.com/Shopify/sewing-kit/pull/907)]

## [0.56.0] - 2018-08-27

### Added

- Dashboard page with asset / compilation information [[#838](https://github.com/Shopify/sewing-kit/pull/838/files)]
- Rails projects now automatically gzip js/css/svg assets [[#879](https://github.com/Shopify/sewing-kit/pull/879)]
- Type-safe configuration & autocomplete via `sewing-kit.config.ts` files [[#798](https://github.com/Shopify/sewing-kit/pull/798)]

### Fixed

- No more 404 errors for projects without a `plugins.vendor` configuration [[#898](https://github.com/Shopify/sewing-kit/pull/898)]

## [0.55.0] - 2018-08-25

### Added

- Support `staging` mode [[#853](https://github.com/Shopify/sewing-kit/pull/853)]
- Readable error for missing stylelint config [[#873](https://github.com/Shopify/sewing-kit/pull/873)]
- `sewing-kit manifest` includes a `path` property which the `sewing_kit` gem uses to reload development manifests quickly [[#865](https://github.com/Shopify/sewing-kit/pull/865)]

### Changed

- Stack-traces from error logs no longer output at any verbosity level below `debug` [[#866](https://github.com/Shopify/sewing-kit/pull/866)]
- Simpler downloads for GraphQL schemas in CI [[#892](https://github.com/Shopify/sewing-kit/pull/892/files)]
- Reduce linting noise by hiding GraphQL fixture passes (via a `graphql-validate-fixtures` update) [[#871](https://github.com/Shopify/sewing-kit/pull/871)]

### Fixed

- Fail fast with a descriptive error message when `dev.yml` uses `type: ruby` [[#861](https://github.com/Shopify/sewing-kit/pull/861)]
- Fail fast with a descriptive error message when `railgun.yml` and `dev.yml` ports are misconfigured [[#861](https://github.com/Shopify/sewing-kit/pull/861)]
- Do not use `dev` hostname when there `railgun.yml` does not exist [[#876](https://github.com/Shopify/sewing-kit/pull/876)]
- Fix config validation when Procfile has nonstandard file extensions [[#886](https://github.com/Shopify/sewing-kit/pull/886)]
- Allow TypeScript projects to have non-TypeScript entrypoints [[#882](https://github.com/Shopify/sewing-kit/pull/882)]
- Faster `sewing-kit test` startup time [[#895](https://github.com/Shopify/sewing-kit/pull/895)]

### Removed

- The `env` object passed to `sewing-kit.config.js`'s callback no longer provides `env.isProductionClient` / `env.isProductionServer`

## [0.54.0] - 2018-08-20

### Added

- 404 responses now display a list of available assets [[#831](https://github.com/Shopify/sewing-kit/pull/831)]
- 👨‍💻 Gracefully error when typescript is not installed but the app entrypoint uses a `.ts`/`.tsx` file [[#852](https://github.com/Shopify/sewing-kit/pull/852)]
- Show meaningful error messages `tsconfig.json` does not exist [[#841](https://github.com/Shopify/sewing-kit/pull/841)]

### Changed

- Update required version of `webpack-dev-server` to `^3.1.5` [[#850](https://github.com/Shopify/sewing-kit/pull/850)]
- Use `stylelint-prettier` to format our styles instead of `prettier-stylelint-formatter`. This is a stylelint plugin that exposes prettier errors as stylelint linting errors rather than using a wrapper to run `prettier`, then `stylelint`. This is similar to how we handle prettier and eslint integration for our js/ts files. [[#808](https://github.com/Shopify/sewing-kit/pull/808)]
- Return a default manifest file that contains a redirection script for the 'Hang Tight!' page when loading the manifest fails in a Rails dev environment. [[#834](https://github.com/Shopify/sewing-kit/pull/834)]
- Update `jest` to version `^23.0.0` including `jest-watch-typeahead` watch plugins [[#666](https://github.com/Shopify/sewing-kit/pull/666)]

### Fixed

- Dev mode 404 responses shouldn't cause oblique CSP errors [[#831](https://github.com/Shopify/sewing-kit/pull/831)]

## [0.53.1] - 2018-08-01

### Fixed

- Vendor DLL now consumes transpiled sources [[#787](https://github.com/Shopify/sewing-kit/pull/787)]

## [0.53.0] - 2018-07-31

### Added

- Display asset server hosts/ports on startup [[#767](https://github.com/Shopify/sewing-kit/pull/767)]
- Vendor DLL can now be removed via `sewing-kit clean --vendor-dll` [[#769](https://github.com/Shopify/sewing-kit/pull/769)]
- All commands accept user-provided log level via `--log-level` [[#722](https://github.com/Shopify/sewing-kit/pull/772)]

### Changed

- Update dependency `stylelint-config-shopify@5.1.2` [[#754](https://github.com/Shopify/sewing-kit/pull/754)]
- Node apps with a `railgun.yml` host now serve development assets via `http://<railgun host>/webpack/assets` [[#763](https://github.com/Shopify/sewing-kit/pull/763)]
- Rails only - all non-`development` environments now default to `/bundles` as a public path [[#764](https://github.com/Shopify/sewing-kit/pull/764)]
- Consistent output message format [[#768](https://github.com/Shopify/sewing-kit/pull/768)]
- GraphQL support is now activated using `plugins.graphql` [[#735](https://github.com/Shopify/sewing-kit/pull/735/files)]

### Fixed

- Remove `--fix` arg from lint/format suggestion [[#777](https://github.com/Shopify/sewing-kit/pull/777)]
- Upgraded to latest version of GraphQL/ TypeScript dependencies, which fixes issues with TypeScript types of GraphQL unions [[#778](https://github.com/Shopify/sewing-kit/pull/778)]

### Removed

- Remove logic for long-deprecated `dev.yml#railgun.proxy` config [[#766](https://github.com/Shopify/sewing-kit/pull/766)]

## [0.52.0] - 2018-07-18

### Added

- `sewing-kit lint` now accepts `--no-json`. Use `--no-json` to stop linting of JSON files in your project.

### Changed

- Breaking change - Upgraded to `eslint-plugin-shopify@23.0.0` [[#755](https://github.com/Shopify/sewing-kit/pull/755)]
  - Please refer to the `eslint-plugin-shopify` [release notes](https://github.com/Shopify/eslint-plugin-shopify/releases/tag/v23.0.0) to understand why your `lint` is failing

### Fixed

- `lint` now passes the `--styles` value down to Prettier instead of assuming styles should be always be linted [[#752](https://github.com/Shopify/sewing-kit/pull/752)]

## [0.51.1]

### Fixed

- Fix Rails integration tests by outputting to `public/bundles` again [[#750](https://github.com/Shopify/sewing-kit/pull/750)]

## [0.51.0]

### Changed

- Prefer many small bundles over fewer large bundles [[#747](https://github.com/Shopify/sewing-kit/pull/747)]
- Added integrity sha to react-loadable.json async chunk manifest for subresource integrity on CDN requests [[#739](https://github.com/Shopify/sewing-kit/pull/739)]

### Fixed

- Don't report erroneous module shaking information [[#746](https://github.com/Shopify/sewing-kit/pull/746)]

## [0.50.1]

### Changed

- Update dependency `stylelint-config-shopify@5.1.1` [[#744](https://github.com/Shopify/sewing-kit/pull/744)]

## [0.50.0]

### Added

- Cache SVG icons [[#722](https://github.com/Shopify/sewing-kit/pull/722)]
- Fail on unexpected CSS side-effect module removal [[#728](https://github.com/Shopify/sewing-kit/pull/728/files)]
- `--focus` option to only build selected sections for `sewing-kit dev` and `sewing-kit build` [[#734](https://github.com/Shopify/sewing-kit/pull/734)]

### Changed

- Update dependencies (`webpack@4.14.0`, `hard-source@0.9.0`, `yargs@12.0.1`) [[#730](https://github.com/Shopify/sewing-kit/pull/730)]
- Update dependencies (`babel-loader@7.1.5`, `webpack@4.15.1`, `hard-source@0.10.1`, `node-sass@4.9.1`) [[#743](https://github.com/Shopify/sewing-kit/pull/743)]

### Fixed

- Don't overload CI servers with many parallel Uglify threads [[#721](https://github.com/Shopify/sewing-kit/pull/721)]
- Fix webpack plugin deprecation warnings during compilation [[#738](https://github.com/Shopify/sewing-kit/pull/738/files)]
- `sewing-kit playground` no longer exits with an error for Vim users [[#740](https://github.com/Shopify/sewing-kit/pull/740)]
- Playgrounds now automatically open with the cursor positioned at the most likely line/column for editing content [[#740](https://github.com/Shopify/sewing-kit/pull/740)]

## [0.49.1]

### Fixed

- Ignore TypeScript import/export errors in `test` mode builds [[#716](https://github.com/Shopify/sewing-kit/pull/716)]

## [0.49.0]

### Changed

- Breaking: upgraded all GraphQL-related dependencies. All tools now rely on a minimum of `graphql@0.13.0`. Additionally, the upgraded version of `typescript-graphql-definitions` generates a different structure for type definitions in order to more accurately represent union and interface types. This may require updates to your type references. [[#671](https://github.com/Shopify/sewing-kit/pull/671)]

## [0.48.2] - 2018-06-19

### Changed

- Upgrade `uglifyjs-webpack-plugin` [[#709](https://github.com/Shopify/sewing-kit/pull/709)]
- Disable image/icon caching (while investigating issues with `.png` generation in `web`) [[#710](https://github.com/Shopify/sewing-kit/pull/710)]

## [0.48.1] - 2018-06-19

### Added

- `sewing-kit start` now accepts `--client-heap-size` / `--server-heap-size` [[#707](https://github.com/Shopify/sewing-kit/pull/707)]
- svg/image loader results are now cached [[#708](https://github.com/Shopify/sewing-kit/pull/708)]
- Production CSS loader results are now cached [[#708](https://github.com/Shopify/sewing-kit/pull/708)]

## [0.48.0] - 2018-06-19

Do not use this release. This is an incorrectly published version of the 0.47.0 release.

## [0.47.1] - 2018-06-18

### Changed

- Run `react-loadable/babel` on server code as well [[#685](https://github.com/Shopify/sewing-kit/pull/685)]

## [0.47.0] - 2018-06-18

### Added

- Added markdown support to `sewing-kit {check,lint,format}` [[#680](https://github.com/Shopify/sewing-kit/pull/680)]
- `sewing-kit start` now compiles client/server in parallel [[#688](https://github.com/Shopify/sewing-kit/pull/688)]
- Faster cold TypeScript server compilation via shared cache [[#699](https://github.com/Shopify/sewing-kit/pull/699/files)]

### Changed

- Upgraded to `prettier@1.13.5` [[#679](https://github.com/Shopify/sewing-kit/pull/679)]
- Upgraded patch dependencies (`sass-loader`, `source-map-support`, `stylelint`) [[#690](https://github.com/Shopify/sewing-kit/pull/690)]
- Upgraded dependencies: major (`babel-jest`) and minor (`babel-plugin-lodash`, `hard-source-webpack-plugin`, `image-webpack-loader`, `ts-loader`, `webpack`) [[#603](https://buildkite.com/shopify/sewing-kit/builds/603)]
- Upgraded `webpack-uglifyjs-plugin` fork [[#693](https://github.com/Shopify/sewing-kit/pull/693)]
- webpack-related caches are now stored in `build/cache/webpack` [[#697](https://github.com/Shopify/sewing-kit/pull/697)]
- Cache JavaScript transpilation results [[#698](https://github.com/Shopify/sewing-kit/pull/698)]
- Cache TypeScript transpilation results separately from production Babel transform results [[#701](https://github.com/Shopify/sewing-kit/pull/701)]

### Fixed

- The message `start from scratch with 'yarn sewing-kit clean'` when using the [vendors plugin](https://github.com/Shopify/sewing-kit/blob/master/docs/plugins/vendors.md) has been amended to include `--cache` to ensure the cache will actually be cleaned [[#681](https://github.com/Shopify/sewing-kit/issues/681)]
- `--source-maps off` should completely disable sourcemaps [[#687](https://github.com/Shopify/sewing-kit/pull/687)], [[#694](https://github.com/Shopify/sewing-kit/pull/694)]
- Pass consistent `BABEL_ENV` to Babel transforms [[#702](https://github.com/Shopify/sewing-kit/pull/702)]
- Fix Polaris quirks in development by reverting to `react-hot-loader@3.1.3` [[#703](https://github.com/Shopify/sewing-kit/pull/703)]

## [0.46.0] - 2018-06-08

### Added

- Improves client/server React hydration of async routes via `plugins.experiments({reactLoadable: true})` [[#668](https://github.com/Shopify/sewing-kit/pull/668)]
  - See [shopify/web](https://github.com/Shopify/web/pull/4513/files) for more details on enabling code splitting & SSR
  - See [`react-loadable`](https://github.com/jamiebuilds/react-loadable) for additional documentation

### Changed

- Use 3 jest workers on shopify-build [[#678](https://github.com/Shopify/sewing-kit/pull/678)]

### Fixed

- Playgrounds now work with `@shopify/polaris@2.x` [[#677](https://github.com/Shopify/sewing-kit/pull/677)]

## [0.45.6] - 2018-06-06

### Changed

- Allow custom build paths for production Rails apps [[#674](https://github.com/Shopify/sewing-kit/pull/674)]

## [0.45.5] - 2018-05-31

### Added

- Added `asset-server-only` flag to `sewing-kit start` [[#665](https://github.com/Shopify/sewing-kit/pull/665)]

### Changed

- `sewing-kit type-check` and `sewing-kit check` now output concise, readdable errors upon failure [[#670](https://github.com/Shopify/sewing-kit/pull/670)]

## [0.45.4] - 2018-05-24

### Changed

- `sewing-kit test` now uses 5 worker threads in `shopify-build` [[#663](https://github.com/Shopify/sewing-kit/pull/663)]

## [0.45.3] - 2018-05-17

### Added

- If `package.json#sideEffects` is configured to eliminate dead code, production client builds will fail when modules are unexpectedly removed (exclusions can be added via `FailOnUnexpectedModuleShakingPlugin#exclude`)

## [0.45.2] - 2018-05-14

### Added

- Retry production GraphQL schema download if it fails the first time [[#657](https://github.com/Shopify/sewing-kit/pull/657)]

## [0.45.1] - 2018-05-10

### Changed

- TypeScript type/interface imports are now suppressed in development mode [[#655](https://github.com/Shopify/sewing-kit/pull/655)]

## [0.45.0] - 2018-05-10

### Changed

- Breaking change - Upgraded to `webpack@4.8.1`, and latest `webpack-dev-server`, `webpack-hot-middleware`, etc [[#632](https://github.com/Shopify/sewing-kit/pull/632)]
  - [`split-chunks-plugin`](https://webpack.js.org/plugins/split-chunks-plugin/) provides much better code splitting
  - [`mini-css-extra-plugin`](https://github.com/webpack-contrib/mini-css-extract-plugin) allows CSS to be split by chunk (`extract-text-webpack-plugin` was removed)
- Breaking change - Many dependency updates (including `node-sass`, `stylelint`, `react-hot-loader`) [[#650](https://github.com/Shopify/sewing-kit/pull/650)]
- `graphql-loader` results are now cached [[#652](https://github.com/Shopify/sewing-kit/pull/652)]
- `ParallelUglifyPlugin` is always used for production client builds [[#648](https://github.com/Shopify/sewing-kit/pull/648)]
  - Note: the above `webpack@4` upgrade obsoletes this change

### Removed

- Removed `parallelUglify` experiment toggle [[#648](https://github.com/Shopify/sewing-kit/pull/648)]
- `Happypack` now leaves a thread free for general processing [[#649](https://github.com/Shopify/sewing-kit/commit/51c3998a9afe742cfd156ad9a4e785dcb0649937)]

## [0.44.0] - 2018-05-08

### Removed

- Removed `fastProductionBuild` experiment [[#643](https://github.com/Shopify/sewing-kit/pull/643)]

## [0.43.0] - 2018-05-08

### Changed

- Breaking change - updated [`eslint-plugin-shopify`](https://github.com/Shopify/eslint-plugin-shopify) to version `^22.0.0`

### Migration suggestions

- Upgrade to `typescript` version `2.7.2` or later

## [0.42.0] - 2018-05-06

### Added

- `sewing-kit build` now accepts `--no-graphql` [[#638](https://github.com/Shopify/sewing-kit/pull/638)]

### Changed

- Module concatenation is always enabled for production client builds [[#634](https://github.com/Shopify/sewing-kit/pull/634)]

### Fixed

- Only display total build duration in client + server builds [[#639](https://github.com/Shopify/sewing-kit/pull/639)]

## [0.41.1] - 2018-05-02

### Fixed

- `AssetMetadataPlugin` now creates the destination directory before writing the manifest, if necessary [[#625](https://github.com/Shopify/sewing-kit/pull/625)]

## [0.41.0] - 2018-05-01

### Changed

- Breaking change - `sewing-kit-manifest.json#assets` now contains `public`-relative paths [[#624](https://github.com/Shopify/sewing-kit/pull/624)]
- Breaking change - `AssetMetadataPlugin` no longer accepts a `path` option; manifests are always written to the build directory [[#624](https://github.com/Shopify/sewing-kit/pull/624)]

### Fixed

- Make `sewing-kit-inspect` executable [[#620](https://github.com/Shopify/sewing-kit/pull/620)]

## [0.40.0] - 2018-04-29

### Added

- Cache `.scss` compilation [[#613](https://github.com/Shopify/sewing-kit/pull/613)]

### Changed

- Do not type check TypeScript in development mode [[#612](https://github.com/Shopify/sewing-kit/pull/612)]
- `sewing-kit dev` now transpiles using `ts-loader`, and caches transpilation results [[#614](https://github.com/Shopify/sewing-kit/pull/614)]

### Migration suggestions

- Use `sewing-kit type-check` to check for type violations previously reported by `sewing-kit dev`

## [0.30.1] - 2018-04-16

### Added

- Log schema download times in CI [[#605](https://github.com/Shopify/sewing-kit/pull/605)]

## [0.30.0] - 2018-04-15

### Added

- Better timing information for `sewing-kit dev` and `sewing-kit build` [[#600](https://github.com/Shopify/sewing-kit/pull/600)]

### Changed

- Breaking change - `fastStartup` is usable in test/production environments [[#596](https://github.com/Shopify/sewing-kit/pull/596)]
- Breaking change - `sewing-kit build --report` no longer generates a `stats.json` file [[#604](https://github.com/Shopify/sewing-kit/pull/604)]
- Do not limit jest's `maxWorker` count in BuildKite CI containers [[#602](https://github.com/Shopify/sewing-kit/pull/602/files)]

### Fixed

- `sewing-kit lint` no longer fails if Prettier is not configured [[#481](https://github.com/Shopify/sewing-kit/issues/481)]
- React now generates readable stacktraces for errors thrown by dynamically imported chunks [[#598](https://github.com/Shopify/sewing-kit/pull/598)]

### Removed

- Breaking change - removed `sewing-kit check`'s `--build` option [[#599](https://github.com/Shopify/sewing-kit/pull/599)]

### Migration suggestions

- If `sewing-kit.config.js` enables `fastStartup`, use `env` conditions to limit its inclusion
  - Rule of thumb: disable in `development` if HMR is essential to the development experience
- If a project depends on a generated `build/client/bundle-analysis/stats.json` file, use `plugins.webpack` to set `BundleAnalyzerPlugin.generateStatsFile` to `true`

## [0.29.17] - 2018-04-10

### Fixed

- `sewing-kit lint` now outputs parser exceptions, if necessary [[#588](https://github.com/Shopify/sewing-kit/pull/588)]
- `codeframe` formatter is now used for lint output [[#566](https://github.com/Shopify/sewing-kit/pull/566)]

## [0.29.16] - 2018-04-08

### Changed

- `sewing-kit dev --log-react-updates` to debug excess React rerenders [[#547](https://github.com/Shopify/sewing-kit/pull/547)]
- `sewing-kit lint` no longer outputs stacktraces when stylelint fails [[#584](https://github.com/Shopify/sewing-kit/pull/584)]

## [0.29.15] - 2018-03-25

### Added

- `playground --force` overwrites all existing playground files [[#577](https://github.com/Shopify/sewing-kit/pull/577)]

### Changed

- `playground` only writes files that don't exist yet [[#577](https://github.com/Shopify/sewing-kit/pull/577)]
- `build --reports` should not throw memory exceptions in large projects [[#575](https://github.com/Shopify/sewing-kit/pull/575)]

## [0.29.14] - 2018-03-12

### Added

- Allow debug without pausing on startup (via `sewing-kit-inspect`) [[#563](https://github.com/Shopify/sewing-kit/pull/563)]

### Changed

- Upgrade to `eslint-plugin-shopify@19.0.1` (fixes `shopify/jsx-no-hardcoded-content` rule) [[#562](https://github.com/Shopify/sewing-kit/pull/562)]

### Migration suggestions

- Enable `shopify/jsx-no-hardcoded-content` in your eslint config

## [0.29.13] - 2018-03-06

### Changed

- `sewing-kit test --app-only` now includes tests in the `client` directory [[#552](https://github.com/Shopify/sewing-kit/pull/552)]

## [0.29.12] - 2018-02-21

### Added

- Aliases for `sewing-kit` (`sk`) and `sewing-kit-debug` (`skd`) [[#539](https://github.com/Shopify/sewing-kit/pull/539)]

## [0.29.11] - 2018-02-20

### Changed

- Update reference to webpack-parallel-uglify-plugin, preventing `npm install` from breaking [[#536](https://github.com/Shopify/sewing-kit/pull/536)]
- Upgrade devDependencies [[#533](https://github.com/Shopify/sewing-kit/pull/533)]

## [0.29.10] - 2018-02-19

### Added

- `lint --show-expected` option that displays the expected output for files failing Prettier checks [[#535](https://github.com/Shopify/sewing-kit/pull/535)]

## [0.29.9] - 2018-02-16

### Changed

- Upgrade to eslint-plugin-shopify@19.0.0 [[#532](https://github.com/Shopify/sewing-kit/pull/532)]

## [0.29.7] / [0.29.8] - 2018-02-16

### Changed

- Support for code coverage when running `sewing-kit test` [[#531](https://github.com/Shopify/sewing-kit/pull/531)]

## [0.29.6] - 2018-02-15

### Changed

- Support for `csv` and `ico` files is now enabled by default with Jest transform and Webpack `file-loader` [[#508](https://github.com/Shopify/sewing-kit/pull/508)]

## [0.29.5] - 2018-02-14

### Changed

- Problematic packages are now stripped from the `plugins.vendor` list [[#528](https://github.com/Shopify/sewing-kit/pull/528)]

## [0.29.4] - 2018-02-13

### Fixed

- Vendor DLL is now served from the correct directory [[#527](https://github.com/Shopify/sewing-kit/pull/527)]

## [0.29.3] - 2018-02-12

### Changed

- Vendor DLL is now cached and reused between server starts [[#526](https://github.com/Shopify/sewing-kit/pull/526)]

## [0.29.2] - 2018-02-11

### Changed

- `sewing-kit test` now uses 3 Jest workers (previously 2) [[#524](https://github.com/Shopify/sewing-kit/pull/524)]

## [0.29.1] - 2018-02-08

### Fixed

- `sewing-kit start` now displays logs [[#520](https://github.com/Shopify/sewing-kit/pull/520)]

## [0.29.0] - 2018-02-07

### Changed

- `--source-maps` CLI option now acceps `accurate`, `fast`, `off` values [[#513](https://github.com/Shopify/sewing-kit/pull/513), [#515](https://github.com/Shopify/sewing-kit/pull/515)]

### Fixed

- Stop `shopify/web` performing concurrent HMR refreshes [[#514](https://github.com/Shopify/sewing-kit/pull/514)]

### Migration suggestions

- Search for `source-maps` references and:
  - Replace `--source-maps` with `--source-maps accurate`
  - Replace `--no-source-maps` wtih `--source-maps fast`

## [0.28.1] - 2018-01-28

### Added

- "Hang tight" view now displays a tip about how to access sewing-kit logs [[#505](https://github.com/Shopify/sewing-kit/pull/505)]

### Fixed

- Fixed invalid `strip-ansi` call from version `0.28.0` [[#504](https://github.com/Shopify/sewing-kit/pull/504)]

## [0.28.0] - 2018-01-28

### Added

- "Hang tight" view now displays progress messages [[#501](https://github.com/Shopify/sewing-kit/pull/501)]
- "Hang tight" view now displays error dumps [[#501](https://github.com/Shopify/sewing-kit/pull/501)]
- "Hang tight" view has less gender bias [[#502](https://github.com/Shopify/sewing-kit/pull/502)]
- "Hang tight" view now refreshes the page on build completion [[#503](https://github.com/Shopify/sewing-kit/pull/503)]

## [0.27.1] - 2018-01-24

### Fixed

- Allow cross-origin requests for vendor-dll [[#496](https://github.com/Shopify/sewing-kit/pull/496)]

## [0.27.0] - 2018-01-21

### Added

- Breaking change - `asset.json`/`sewing-kit-manifest.json` now include asset integrity hashes (sha256, base64 encoded)
  Before

```json
{
  "entrypoints": {
    "foo": {
      "js": ["foo.js"]
    }
  }
}
```

After

```json
{
  "entrypoints": {
    "foo": {
      "js": [
        {
          "path": "foo.js",
          "integrity": "4cd86c4a2c06dceff7d5ef1c381b1de1a8da9e8d36d51647dae249470a781f99.js"
        }
      ]
    }
  }
}
```

### Fixed

- Node only - `sewing-kit start` now starts up an assets server [[#492](https://github.com/Shopify/sewing-kit/pull/492)]

### Migration Suggestions

- Rails projects - upgrade to [`sewing_kit@0.27.0`](https://github.com/Shopify/sewing_kit/blob/master/CHANGELOG.md#0270---22-01-2018)
- Node projects - adjust `asset.json` entrypoint consumers to account for plain path strings becoming objects with `path`/`integrity` properties

## [0.26.0] - 2018-01-14

### Changed

- Breaking change: Rollup's default emitted filepath is now `dist/index.js` to match the name of the default input file.
- Upgraded to `eslint-plugin-shopify@19.0.0-beta.4`
- Upgraded to `prettier@1.9.2`

### Fixed

- Consumers no longer need to provide rollup plugins since they are now included as regular dependencies (instead of dev dependencies)

### Migration Suggestions

- Update `eslintConfig` to include: `plugins: ["shopify/jest"]`
- Update `.prettierrc` to include: `arrowParens: "always"`
- For Polaris projects, update `eslintConfig` to include: `plugins: ["shopify/polaris"]`
- Consider adding new Shopify eslint rules:
  - [`shopify/jsx-no-complex-expressions`](https://github.com/Shopify/eslint-plugin-shopify/blob/master/docs/rules/jsx-no-complex-expressions.md)
  - [`shopify/jsx-no-hardcoded-content`](https://github.com/Shopify/eslint-plugin-shopify/blob/master/docs/rules/jsx-no-hardcoded-content.md)
  - [`shopify/react-initialize-state`](https://github.com/Shopify/eslint-plugin-shopify/blob/master/docs/rules/react-initialize-state.md)
  - [`shopify/react-type-state`](https://github.com/Shopify/eslint-plugin-shopify/blob/master/docs/rules/react-type-state.md)

## [0.25.0] - 2018-01-12

### Fixed

- `dev --no-hot` mode now builds vendor DLLs [[#487](https://github.com/Shopify/sewing-kit/pull/487)]

### Changed

- Add svgs to prettierignore list on init command [[#484](https://github.com/Shopify/sewing-kit/pull/484)]
- Use eslint cache to improve ESLint speed for code and GraphQL files [[#485](https://github.com/Shopify/sewing-kit/pull/485)]

## [0.24.0] - 2018-01-11

### Added

- Libraries can be bundled with rollup by including `plugins.rollup` in their config

### Changed

- Omit confusing stacktraces for lint errors [[https://github.com/Shopify/sewing-kit/pull/482](#482)]

## [0.23.0] - 2018-01-09

### Fixed

- Vendor DLL changes will be picked up without a hard browser refresh [[https://github.com/Shopify/sewing-kit/pull/477](#477)]

### Removed

- Breaking change: removed `sewing-kit test`'s `--build` option [[https://github.com/Shopify/sewing-kit/pull/478](#478)]

### Migration Suggestions

- If your project depended on `sewing-kit test --build`, please ping in `#web-foundations-tech` for tips on writing isolated server tests

## [0.22.3] - 2018-01-05

### Changed

- Fix eslint error for ruby projects on CircleCI, adding `vendor/bundle` to ignores [[#475](https://github.com/Shopify/sewing-kit/pull/475)]

## [0.22.2] - 2018-01-05

### Changed

- Fix lint error for ruby projects on CircleCI, adding `vendor/bundle` to stylelint ignores [[#474](https://github.com/Shopify/sewing-kit/pull/474)]

## [0.22.1] - 2018-01-04

### Added

- Support `test` mode builds [[#445](https://github.com/Shopify/sewing-kit/pull/445)]

## [0.22.0] - 2017-12-18

### Added

- Allow graphql schema to be read from a local file [[#427](https://github.com/Shopify/sewing-kit/pull/427)]

### Changed

- Bump `eslint-plugin-shopify` to [`18.3.0`](https://github.com/Shopify/eslint-plugin-shopify/blob/master/CHANGELOG.md#1830---2017-12-18) (shopify/no-debugger) [[464](https://github.com/Shopify/sewing-kit/pull/464/files)]

## [0.21.0] - 2017-12-11

- Allow compilation of a server bundle under the `railsWithNodeServer` experiment. By default Rails projects do not compile a server bundle. [[#444](https://github.com/Shopify/sewing-kit/pull/444)]

## [0.20.0] - 2017-12-06

### Added

- Formatting support for `.ts` and `.tsx` files. Please see the Typescript formatting setup [docs](https://github.com/Shopify/sewing-kit/blob/master/docs/commands/format.md#setup) for more details. [[#440](https://github.com/Shopify/sewing-kit/pull/440)]
- An `init` command to create config files for common tools. Includes `--prettierignore` flag to create a preconfigured .prettierignore file. [[#417](https://github.com/Shopify/sewing-kit/pull/417)]

```
yarn run sewing-kit init --prettierignore
```

### Removed

- Linting via `tslint` has been removed in favor of linting typescript via Shopify's [typescript](https://github.com/Shopify/eslint-plugin-shopify/blob/master/lib/config/typescript.js) or [typescript-react](https://github.com/Shopify/eslint-plugin-shopify/blob/master/lib/config/typescript-react.js) eslint configs. `tslint.json` can be removed from consuming projects. [[#440](https://github.com/Shopify/sewing-kit/pull/440)]

```
{
  "extends": [
    "plugin:shopify/typescript-react"
  ]
}
```

## [0.19.1] - 2017-11-23

### Added

- Added support to selectively include Polaris globals. See [[#423](https://github.com/Shopify/sewing-kit/pull/423)]

## [0.19.0] - 2017-11-22

- Added `format` support for `scss`/`css` files. See [here](https://github.com/Shopify/sewing-kit/blob/master/docs/commands/format.md#setup) for more details. [[#364](https://github.com/Shopify/sewing-kit/pull/364)]

### Changed

- Improve warmup devServer dev experience. [[#420](https://github.com/Shopify/sewing-kit/pull/420)]
- Upgraded node-sass from v4.6.0 to v4.7.2 [[#416](https://github.com/Shopify/sewing-kit/pull/416)]
- Dependency updates [[#412](https://github.com/Shopify/sewing-kit/pull/412)]

## [0.18.0] - 2017-11-16

### Added

- A server is now immediately bound when running `sewing-kit dev`, and will hand off to your actual development server when it is fully compiled. You can customize the port and IP of the temporary server with the new `devServer` plugin. [[#390](https://github.com/Shopify/sewing-kit/pull/390)]

### Changed

- `react-hot-loader` is enabled only for React projects [[#392](https://github.com/Shopify/sewing-kit/pull/392)]
- `.jsx` files no longer throw exceptions on JSX elements [[#408](https://github.com/Shopify/sewing-kit/pull/408)]
- Dependency updates [[#391](https://github.com/Shopify/sewing-kit/pull/391)]
  - New eslint rules (see [updates between 17.2 - 18.0](https://github.com/Shopify/eslint-plugin-shopify/blob/master/CHANGELOG.md#1800---2017-10-31))
  - A working `react-hot-loader` is now provided

### Migration Suggestions

- If your project uses a custom `react-hot-loader` version, it should be removed
  - `yarn remove react-hot-loader`

## [0.17.1] - 2017-11-09

### Changed

- `plugin.jest` now accepts a callback https://github.com/Shopify/sewing-kit/pull/329

### Migration Suggestions

- grep for `plugin.jest` calls, and replace the old hash parameter with a callback that overrides the default config's values
  - Property names are aligned with Jest's config names
  - e.g., `setupRun` => `setupFiles`, `setupTest` => `setupTestFrameworkScriptFile`
- `npm rebuild` fixes `bindings`/`node-sass` errors

## [0.17.0] - 2017-11-08

### Added

- Added `railsWithNodeServer` experiment to enable bundling of a server target inside of a Rails project.[[#378](https://github.com/Shopify/sewing-kit/pull/378)]
- Added `format` support for `graphql` and `json` files. [[#377](https://github.com/Shopify/sewing-kit/pull/377)]

### Changed

- Improved nuke command [[#389](https://github.com/Shopify/sewing-kit/pull/389)]:
  - Make it run in dev mode such that it does not fail in a project that has production dependencies
  - Cleans out the correct assets folder in the appropriate places
- Upgrade node-sass to 4.6.0 [[#381](https://github.com/Shopify/sewing-kit/pull/381)]
- Lint will now fail if `.json` or `.graphql`/`.gql` is not formatted [[#377](https://github.com/Shopify/sewing-kit/pull/377)]
- Polaris is now correctly treated as an external for server bundles, so it always references the correct class names for the environment and will resolve all its dependencies natively [[#223](https://github.com/Shopify/sewing-kit/pull/223)]
- Improved startup speed by delaying the loading of many modules [[#338](https://github.com/Shopify/sewing-kit/pull/388)]
- Breaking change: manifests now contain `assets` and `entrypoints` keys [[#387](https://github.com/Shopify/sewing-kit/pull/387)]
  - `assets` contains the chunk=>js/css mappings that were previously at root level

### Migration Suggestions

- Any code reading from `assets.json`/`sewing-kit-manifest.json` should now dig into the `assets` map
- `sewing_kit` apps should remove explicit `sewing_kit_script_tag`/`sewing_kit_link_tag` calls to output `runtime`, `vendor`, etc

## [0.16.1] - 2017-10-27

### Added

- Added `format` command to format JS files. [[#357](https://github.com/Shopify/sewing-kit/pull/357)]

### Fixed

- Uglify cache is not erroneously invalidated during builds [[#368](https://github.com/Shopify/sewing-kit/pull/368)]

## [0.16.0] - 2017-10-25

### Fixed

- Breaking change: builds now raise exceptions on compiler warnings [[#363](https://github.com/Shopify/sewing-kit/pull/363/files)]

## [0.15.0] - 2017-10-25

### Fixed

- Pinned to `webpack@3.5.3` to work around hard-source errors in later versions [[#360](https://github.com/Shopify/sewing-kit/pull/360)]

## [0.14.4] - 2017-10-22

- Move Jest's cache to sewing-kit's cache directory [[#350](https://github.com/Shopify/sewing-kit/pull/350)]

## [0.14.3] - 2017-10-21

### Updated

- CI now uses 2 jest worker threads [[#349](https://github.com/Shopify/sewing-kit/pull/349)]

## [0.14.2] - 2017-10-16

### Updated

- Use a `stylelint` version that's compatible with `stylelint-config-shopify`'s requirements [[#342](https://github.com/Shopify/sewing-kit/pull/342)]

## [0.14.1] - 2017-10-16

### Added

- Parallel/cacheable minification via [parallel-webpack-uglify-plugin](https://github.com/gdborton/webpack-parallel-uglify-plugin) [[#341](https://github.com/Shopify/sewing-kit/pull/341)]

### Migration Suggestions

- Turn on the `parallelUglify` experiment

## [0.14.0] - 2017-10-15

### Fixed

- `lint` now builds GraphQL type definitions before running script linters [[#340](https://github.com/Shopify/sewing-kit/pull/340)]
- `lint` now ignores `.scss` files in `node_modules` [[#338](https://github.com/Shopify/sewing-kit/pull/338)]
- GraphQL tests no longer add 6 minutes to CircleCI runs [[#339](https://github.com/Shopify/sewing-kit/pull/339)]

### Updated

- Breaking change: `stylelint`/`stylelint-config-shopify` version bumps

### Removed

- `conciseModuleNames` experiment [[#331](https://github.com/Shopify/sewing-kit/pull/331)]

### Migration Suggestions

- Remove `stylelint` and `stylelint-config-shopify` from `package.json` (`dependencies`/`devDependencies`)

## [0.13.0] - 2017-10-12

### Added

- `conciseModuleNames` experiment to reduce bulk from long-term caching [[#326](https://github.com/Shopify/sewing-kit/pull/326)]
- `moduleConcatenation` experiment to make bundles smaller using [ModuleConcatenationPlugin](https://webpack.js.org/plugins/module-concatenation-plugin/) [(https://github.com/Shopify/sewing-kit/pull/328)]
- Breaking change: `productionChunks` experiment to enable/disable long-term caching plugins [[#330](https://github.com/Shopify/sewing-kit/pull/330)]

### Changed

- Breaking change: Long-term caching naming is enabled for all projects (a side-effect of [#330](https://github.com/Shopify/sewing-kit/pull/330))

## [0.12.8] - 2017-10-11

### Added

- Suppress auto-import of Polaris CSS globals with `plugins.sass({autoImportPolaris: false})` [[#307](https://github.com/Shopify/sewing-kit/pull/307)]
- Toggle [`lodash-webpack-plugin`](https://github.com/lodash/lodash-webpack-plugin]) on/off via `plugins.experiments` [[#309](https://github.com/Shopify/sewing-kit/pull/309)]
  - Defaults to `false`
- `sewing-kit test` now updates Jest snapshots if `--update-snapshot` is an argument [[#318](https://github.com/Shopify/sewing-kit/pull/318)]

### Changed

- Enable `.ts`/`.tsx` compilation if `typescript` is a development dependency [[#308](https://github.com/Shopify/sewing-kit/pull/308)]

## [0.12.7] - 2017-10-05

### Added

- Automatic `postcss` config for projects that don't have a `postcss.config.js` file [[#296](https://github.com/Shopify/sewing-kit/pull/296)]

### Changed

- More README details [[#256](https://github.com/Shopify/sewing-kit/pull/256)]

### Fixed

- Fix server debugging for node@8 [[#301](https://github.com/Shopify/sewing-kit/pull/301)]

## [0.12.6] - 2017-10-02

### Changed

- Use `babel-preset-env` even in projects that use `sprockets-commoner` [[#284](https://github.com/Shopify/sewing-kit/pull/284)]

### Fixed

- Fixed an issue where adding a custom webpack resolver for `csv` files broke jest. [[#294](https://github.com/Shopify/sewing-kit/pull/294)]

## [0.12.5] - 2017-09-19

### Added

- You can now pass a `url` option to the Jest config plugin in order to set the root URL for your tests (reflected in `window.location`) [[#278](https://github.com/Shopify/sewing-kit/pull/278)]

* In development mode, requesting a `vendor`/`js` path will return a link to a local vendor DLL [[#281](https://github.com/Shopify/sewing-kit/pull/281)]

### Fixed

- Fixed an issue where imports not beginning in `tests` were mapped to the tests directory [[#278](https://github.com/Shopify/sewing-kit/pull/278)]

### Changed

- You no longer need to include a `.babelrc` at the root of your project for tests to work correctly [[#278](https://github.com/Shopify/sewing-kit/pull/278)]
- Jest and its typings have been added as a dependency, so projects do not need to manually install them [[#278](https://github.com/Shopify/sewing-kit/pull/278)]

## [0.12.4] - 2017-09-18

### Added

- `sewing-kit playground` spins up a hot-reloading playground [[#255](https://github.com/Shopify/sewing-kit/pull/255)]

### Fixed

- `.scss` linter now skips all `node_modules` folders
- Vendor DLL libraries are no longer duplicated in other development bundles [[#279](https://github.com/Shopify/sewing-kit/pull/279)]

## [0.12.3] - 2017-09-13

### Added

- `sewing-kit lint` now ignores JavaScript files generated by Rails (`tmp`, `public`) [[#267](https://github.com/Shopify/sewing-kit/pull/267)]
- The new `railgun.yml` file is used for the dev server hostname [[#275](https://github.com/Shopify/sewing-kit/pull/275)]

## [0.12.2] - 2017-09-07

### Fixed

- Embedded app production builds no longer attempt to access non-existent esnext files [[#266](https://github.com/Shopify/sewing-kit/pull/266)]

### Added

- Optimize lodash builds using babel-plugin-lodash & lodash-webpack-plugin [[#257](https://github.com/Shopify/sewing-kit/pull/257)]

## [0.12.1] - 2017-09-06

### Added

- Vendor bundle hash is no longer changed by dynamic imports [[#228](https://github.com/Shopify/sewing-kit/pull/228)]

### Changed

- Real world development/production defaults for `publicPath` in Rails projects [[#258](https://github.com/Shopify/sewing-kit/pull/258)]
- `packages` tests are now included in `--app-only` runs [[#251](https://github.com/Shopify/sewing-kit/pull/251)]

## [0.12.0] - 2017-08-30

### Added

- CSS minification for production assets [[#236](https://github.com/Shopify/sewing-kit/pull/236)]
- Add offline GraphQL schema [[#239](https://github.com/Shopify/sewing-kit/pull/239)]
- Vendor caching support in production using `CommonsChunkPlugin` [[#248](https://github.com/Shopify/sewing-kit/pull/248)]
  - Creates a `vendor` and `runtime` chunk
  - Supports consistent vendor caching when app modules are added
  - Supports consistent vendor caching when new entries are added

## [0.11.1] - 2017-08-23

### Added

- `sewing-kit test` now accepts a path pattern parameter that filters out non-matching tests from execution [[#222](https://github.com/Shopify/sewing-kit/pull/222)]
  - e.g., `sewing-kit test Card` will run only tests with `Card` in their file path
- TypeScript errors now use pretty formatting [[#224](https://github.com/Shopify/sewing-kit/pull/224)]

## [0.11.0] - 2017-08-18

### Changed

- `fastProductionBuild` now enables `hard-source-plugin` in production builds [[#214](https://github.com/Shopify/sewing-kit/pull/214)]
- `.svg` files are now processed by [Shopify's icon-loader](https://github.com/Shopify/images/blob/3e92d7960c2bf6b9bdea1e96652b99885d0eca9f/icon-loader.js) [[#202](https://github.com/Shopify/sewing-kit/pull/202)]
  - This replaces `white` fills with `currentColor`, and exports the svg's body as an importable JS module
  - A wrapper component is required to display the stringified SVG (a la [Polaris' `Icon` UI component](https://github.com/Shopify/polaris/blob/fb244772173a91c307492e89f515d40363fb7a61/src/components/Icon/Icon.tsx#L115))
- App tests with GraphQL types no longer depend on a full build [[#216](https://github.com/Shopify/sewing-kit/pull/216)]

## [0.10.1] - 2017-08-12

### Changed

- `env.isCI` returns true when `ENV['CI'] == '1'` [[#203](https://github.com/Shopify/sewing-kit/pull/203)]

## [0.10.0] - 2017-08-11

### Changed

- Updated webpack@3 (just a version bump; no new plugin integration, yet) [[#187](https://github.com/Shopify/sewing-kit/pull/187)]
- Rails projects should build faster. Cacheable build resources are now stores in a directory that buildkite shares between all container builds. [[#198](https://github.com/Shopify/sewing-kit/pull/198)]

### Fixed

- When using `fastProductionBuild`, CSS asset hashes match their content hash again (disabled `cheap-source-maps`) [[#199](https://github.com/Shopify/sewing-kit/pull/199)]

## [0.9.0] - 2017-08-10

### Changed

- Uses `@shopify/polaris@1.3.1` [[#164](https://github.com/Shopify/sewing-kit/pull/164)]
- `typescript` is no longer a mandatory dependency for consumers [[#164](https://github.com/Shopify/sewing-kit/pull/164)]

## [0.8.0] - 2017-08-09

### Changed

- Uses `@shopify/polaris@1.2.1`
- Uses `typescript@2.3.3` (this version allows destructuring of potentially undefined arguments in `.d.ts` files)
- `sewing-kit.config.js` can now define custom paths (via `plugins.paths`)

## [0.7.0] - 2017-08-03

### Added

- `graphql-typescript-definitions` now runs in watch mode [[#171](https://github.com/Shopify/sewing-kit/pull/171)]
- End to end test for Polaris development builds [[#178](https://github.com/Shopify/sewing-kit/pull/178)]
- `fastProductionBuild` experiment [[#178](https://github.com/Shopify/sewing-kit/pull/178), [#184](https://github.com/Shopify/sewing-kit/pull/184)]
  - Allows production builds to use a precompiled version of Polaris with fully namespaced CSS classes
  - Turns off typeschecking
  - Uses `check-source-maps` for faster compilation
- End to end test for more consistent chunk names [[#175](https://github.com/Shopify/sewing-kit/pull/175)]

### Fixed

- GraphQL lint now lints mutations [[#183](https://github.com/Shopify/sewing-kit/pull/183)]
- GraphQL no longer outputs meaningless pages of stack traces on error [[#183](https://github.com/Shopify/sewing-kit/pull/183)]

### Removed

- Redundant static asset middleware route in development mode [[#170](https://github.com/Shopify/sewing-kit/pull/170)]

[0.12.4]: https://github.com/Shopify/sewing-kit/compare/v0.12.3...v0.12.4
[0.12.5]: https://github.com/Shopify/sewing-kit/compare/v0.12.4...v0.12.5
[0.12.6]: https://github.com/Shopify/sewing-kit/compare/v0.12.5...v0.12.6
[0.12.7]: https://github.com/Shopify/sewing-kit/compare/v0.12.6...v0.12.7
[0.12.8]: https://github.com/Shopify/sewing-kit/compare/v0.12.7...v0.12.8
[0.13.0]: https://github.com/Shopify/sewing-kit/compare/v0.12.8...v0.13.0
[0.14.0]: https://github.com/Shopify/sewing-kit/compare/v0.13.0...v0.14.0
[0.14.1]: https://github.com/Shopify/sewing-kit/compare/v0.14.0...v0.14.1
[0.14.2]: https://github.com/Shopify/sewing-kit/compare/v0.14.1...v0.14.2
[0.14.3]: https://github.com/Shopify/sewing-kit/compare/v0.14.2...v0.14.3
[0.14.4]: https://github.com/Shopify/sewing-kit/compare/v0.14.3...v0.14.4
[0.15.0]: https://github.com/Shopify/sewing-kit/compare/v0.14.4...v0.15.0
[0.16.0]: https://github.com/Shopify/sewing-kit/compare/v0.15.0...v0.16.0
[0.16.1]: https://github.com/Shopify/sewing-kit/compare/v0.16.0...v0.16.1
[0.17.0]: https://github.com/Shopify/sewing-kit/compare/v0.16.1...v0.17.0
[0.17.1]: https://github.com/Shopify/sewing-kit/compare/v0.17.0...v0.17.1
[0.18.0]: https://github.com/Shopify/sewing-kit/compare/v0.17.1...v0.18.0
[0.19.0]: https://github.com/Shopify/sewing-kit/compare/v0.18.0...v0.19.0
[0.19.1]: https://github.com/Shopify/sewing-kit/compare/v0.19.0...v0.19.1
[0.20.0]: https://github.com/Shopify/sewing-kit/compare/v0.19.1...v0.20.0
[0.21.0]: https://github.com/Shopify/sewing-kit/compare/v0.20.0...v0.21.0
[0.22.0]: https://github.com/Shopify/sewing-kit/compare/v0.21.0...v0.22.0
[0.22.1]: https://github.com/Shopify/sewing-kit/compare/v0.22.0...v0.22.1
[0.22.2]: https://github.com/Shopify/sewing-kit/compare/v0.22.1...v0.22.2
[0.22.3]: https://github.com/Shopify/sewing-kit/compare/v0.22.2...v0.22.3
[0.23.0]: https://github.com/Shopify/sewing-kit/compare/v0.22.3...v0.23.0
[0.24.0]: https://github.com/Shopify/sewing-kit/compare/v0.23.0...v0.24.0
[0.25.0]: https://github.com/Shopify/sewing-kit/compare/v0.24.0...v0.25.0
[0.26.0]: https://github.com/Shopify/sewing-kit/compare/v0.25.0...v0.26.0
[0.27.0]: https://github.com/Shopify/sewing-kit/compare/v0.26.0...v0.27.0
[0.27.1]: https://github.com/Shopify/sewing-kit/compare/v0.27.0...v0.27.1
[0.28.0]: https://github.com/Shopify/sewing-kit/compare/v0.27.1...v0.28.0
[0.28.1]: https://github.com/Shopify/sewing-kit/compare/v0.28.0...v0.28.1
[0.29.0]: https://github.com/Shopify/sewing-kit/compare/v0.28.1...v0.29.0
[0.29.1]: https://github.com/Shopify/sewing-kit/compare/v0.29.0...v0.29.1
[0.29.2]: https://github.com/Shopify/sewing-kit/compare/v0.29.1...v0.29.2
[0.29.3]: https://github.com/Shopify/sewing-kit/compare/v0.29.2...v0.29.3
[0.29.4]: https://github.com/Shopify/sewing-kit/compare/v0.29.3...v0.29.4
[0.29.5]: https://github.com/Shopify/sewing-kit/compare/v0.29.3...v0.29.5
[0.29.6]: https://github.com/Shopify/sewing-kit/compare/v0.29.5...v0.29.6
[0.29.7]: https://github.com/Shopify/sewing-kit/compare/v0.29.6...v0.29.7
[0.29.8]: https://github.com/Shopify/sewing-kit/compare/v0.29.7...v0.29.8
[0.29.9]: https://github.com/Shopify/sewing-kit/compare/v0.29.8...v0.29.9
[0.29.10]: https://github.com/Shopify/sewing-kit/compare/v0.29.9...v0.29.10
[0.29.11]: https://github.com/Shopify/sewing-kit/compare/v0.29.10...v0.29.11
[0.29.12]: https://github.com/Shopify/sewing-kit/compare/v0.29.11...v0.29.12
[0.29.13]: https://github.com/Shopify/sewing-kit/compare/v0.29.12...v0.29.13
[0.29.14]: https://github.com/Shopify/sewing-kit/compare/v0.29.13...v0.29.14
[0.29.15]: https://github.com/Shopify/sewing-kit/compare/v0.29.14...v0.29.15
[0.29.16]: https://github.com/Shopify/sewing-kit/compare/v0.29.15...v0.29.16
[0.29.17]: https://github.com/Shopify/sewing-kit/compare/v0.29.16...v0.29.17
[0.30.0]: https://github.com/Shopify/sewing-kit/compare/v0.29.17...v0.30.0
[0.30.1]: https://github.com/Shopify/sewing-kit/compare/v0.30.0...v0.30.1
[0.40.0]: https://github.com/Shopify/sewing-kit/compare/v0.30.1...v0.40.0
[0.41.0]: https://github.com/Shopify/sewing-kit/compare/v0.40.0...v0.41.0
[0.41.1]: https://github.com/Shopify/sewing-kit/compare/v0.41.0...v0.41.1
[0.42.0]: https://github.com/Shopify/sewing-kit/compare/v0.41.1...v0.42.0
[0.43.0]: https://github.com/Shopify/sewing-kit/compare/v0.42.0...v0.43.0
[0.44.0]: https://github.com/Shopify/sewing-kit/compare/v0.43.0...v0.44.0
[0.45.0]: https://github.com/Shopify/sewing-kit/compare/v0.44.0...v0.45.0
[0.45.1]: https://github.com/Shopify/sewing-kit/compare/v0.45.0...v0.45.1
[0.45.2]: https://github.com/Shopify/sewing-kit/compare/v0.45.1...v0.45.2
[0.45.3]: https://github.com/Shopify/sewing-kit/compare/v0.45.2...v0.45.3
[0.45.4]: https://github.com/Shopify/sewing-kit/compare/v0.45.3...v0.45.4
[0.45.5]: https://github.com/Shopify/sewing-kit/compare/v0.45.4...v0.45.5
[0.45.6]: https://github.com/Shopify/sewing-kit/compare/v0.45.5...v0.45.6
[0.46.0]: https://github.com/Shopify/sewing-kit/compare/v0.45.6...v0.46.0
[0.47.0]: https://github.com/Shopify/sewing-kit/compare/v0.46.0...v0.47.0
[0.47.1]: https://github.com/Shopify/sewing-kit/compare/v0.47.0...v0.47.1
[0.48.0]: https://github.com/Shopify/sewing-kit/compare/v0.47.1...v0.48.0
[0.48.1]: https://github.com/Shopify/sewing-kit/compare/v0.48.0...v0.48.1
[0.48.2]: https://github.com/Shopify/sewing-kit/compare/v0.48.1...v0.48.2
[0.49.0]: https://github.com/Shopify/sewing-kit/compare/v0.48.2...v0.49.0
[0.49.1]: https://github.com/Shopify/sewing-kit/compare/v0.49.0...v0.49.1
[0.50.0]: https://github.com/Shopify/sewing-kit/compare/v0.49.1...v0.50.0
[0.50.1]: https://github.com/Shopify/sewing-kit/compare/v0.50.0...v0.50.1
[0.51.0]: https://github.com/Shopify/sewing-kit/compare/v0.50.1...v0.51.0
[0.51.1]: https://github.com/Shopify/sewing-kit/compare/v0.51.0...v0.51.1
[0.52.0]: https://github.com/Shopify/sewing-kit/compare/v0.51.1...v0.52.0
[0.53.0]: https://github.com/Shopify/sewing-kit/compare/v0.52.0...v0.53.0
[0.53.1]: https://github.com/Shopify/sewing-kit/compare/v0.53.0...v0.53.1
[0.54.0]: https://github.com/Shopify/sewing-kit/compare/v0.53.1...v0.54.0
[0.55.0]: https://github.com/Shopify/sewing-kit/compare/v0.54.0...v0.55.0
[0.56.0]: https://github.com/Shopify/sewing-kit/compare/v0.55.0...v0.56.0
[0.56.1]: https://github.com/Shopify/sewing-kit/compare/v0.56.0...v0.56.1
[0.57.0]: https://github.com/Shopify/sewing-kit/compare/v0.56.1...v0.57.0
[0.58.0]: https://github.com/Shopify/sewing-kit/compare/v0.57.0...v0.58.0
[0.58.1]: https://github.com/Shopify/sewing-kit/compare/v0.58.0...v0.58.1
[0.59.0]: https://github.com/Shopify/sewing-kit/compare/v0.58.1...v0.59.0
[0.60.0]: https://github.com/Shopify/sewing-kit/compare/v0.59.0...v0.60.0
[0.60.1]: https://github.com/Shopify/sewing-kit/compare/v0.60.0...v0.60.1
[0.60.2]: https://github.com/Shopify/sewing-kit/compare/v0.60.1...v0.60.2
[0.60.3]: https://github.com/Shopify/sewing-kit/compare/v0.60.2...v0.60.3
[0.61.0]: https://github.com/Shopify/sewing-kit/compare/v0.60.3...v0.61.0
[0.62.0]: https://github.com/Shopify/sewing-kit/compare/v0.61.0...v0.62.0
[0.63.0]: https://github.com/Shopify/sewing-kit/compare/v0.62.0...v0.63.0
[0.64.0]: https://github.com/Shopify/sewing-kit/compare/v0.63.0...v0.64.0
[0.64.1]: https://github.com/Shopify/sewing-kit/compare/v0.64.0...v0.64.1
[0.64.2]: https://github.com/Shopify/sewing-kit/compare/v0.64.1...v0.64.2
[0.64.3]: https://github.com/Shopify/sewing-kit/compare/v0.64.2...v0.64.3
[0.64.4]: https://github.com/Shopify/sewing-kit/compare/v0.64.3...v0.64.4
[0.65.0]: https://github.com/Shopify/sewing-kit/compare/v0.64.4...v0.65.0
[0.65.1]: https://github.com/Shopify/sewing-kit/compare/v0.65.0...v0.65.1
[0.66.0]: https://github.com/Shopify/sewing-kit/compare/v0.65.1...v0.66.0
[0.67.0]: https://github.com/Shopify/sewing-kit/compare/v0.66.0...v0.67.0
[0.67.1]: https://github.com/Shopify/sewing-kit/compare/v0.67.0...v0.67.1
[0.67.2]: https://github.com/Shopify/sewing-kit/compare/v0.67.1...v0.67.2
[0.67.3]: https://github.com/Shopify/sewing-kit/compare/v0.67.2...v0.67.3
[0.67.4]: https://github.com/Shopify/sewing-kit/compare/v0.67.3...v0.67.4
[0.68.0]: https://github.com/Shopify/sewing-kit/compare/v0.67.4...v0.68.0
[0.68.1]: https://github.com/Shopify/sewing-kit/compare/v0.68.0...v0.68.1
[0.68.2]: https://github.com/Shopify/sewing-kit/compare/v0.68.1...v0.68.2
[0.68.3]: https://github.com/Shopify/sewing-kit/compare/v0.68.2...v0.68.3
[0.69.0]: https://github.com/Shopify/sewing-kit/compare/v0.68.3...v0.69.0
[0.69.1]: https://github.com/Shopify/sewing-kit/compare/v0.69.0...v0.69.1
[0.70.0]: https://github.com/Shopify/sewing-kit/compare/v0.69.1...v0.70.0
[0.70.1]: https://github.com/Shopify/sewing-kit/compare/v0.70.0...v0.70.1
[0.71.0]: https://github.com/Shopify/sewing-kit/compare/v0.70.1...v0.71.0
[0.72.0]: https://github.com/Shopify/sewing-kit/compare/v0.71.0...v0.72.0
[0.73.0]: https://github.com/Shopify/sewing-kit/compare/v0.72.0...v0.73.0
[0.73.1]: https://github.com/Shopify/sewing-kit/compare/v0.73.0...v0.73.1
[0.73.2]: https://github.com/Shopify/sewing-kit/compare/v0.73.1...v0.73.2
[0.74.0]: https://github.com/Shopify/sewing-kit/compare/v0.73.2...v0.74.0
[0.74.1]: https://github.com/Shopify/sewing-kit/compare/v0.74.0...v0.74.1
[0.74.2]: https://github.com/Shopify/sewing-kit/compare/v0.74.1...v0.74.2
[0.75.0]: https://github.com/Shopify/sewing-kit/compare/v0.74.2...v0.75.0
[0.75.1]: https://github.com/Shopify/sewing-kit/compare/v0.75.0...v0.75.1
[0.75.2]: https://github.com/Shopify/sewing-kit/compare/v0.75.1...v0.75.2
[0.75.3]: https://github.com/Shopify/sewing-kit/compare/v0.75.2...v0.75.3
[0.75.4]: https://github.com/Shopify/sewing-kit/compare/v0.75.3...v0.75.4
[0.76.0]: https://github.com/Shopify/sewing-kit/compare/v0.75.4...v0.76.0
[0.76.1]: https://github.com/Shopify/sewing-kit/compare/v0.76.0...v0.76.1
[0.77.0]: https://github.com/Shopify/sewing-kit/compare/v0.76.1...v0.77.0
[0.78.0]: https://github.com/Shopify/sewing-kit/compare/v0.77.0...v0.78.0
[0.78.1]: https://github.com/Shopify/sewing-kit/compare/v0.78.0...v0.78.1
[0.79.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.78.1...@shopify/sewing-kit@0.79.0
[0.79.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.79.0...@shopify/sewing-kit@0.79.1
[0.79.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.79.1...@shopify/sewing-kit@0.79.2
[0.79.3]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.79.2...@shopify/sewing-kit@0.79.3
[0.80.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.79.3...@shopify/sewing-kit@0.80.0
[0.80.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.80.0...@shopify/sewing-kit@0.80.1
[0.80.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.80.1...@shopify/sewing-kit@0.80.2
[0.81.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.80.2...@shopify/sewing-kit@0.81.0
[0.81.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.81.0...@shopify/sewing-kit@0.81.1
[0.82.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.81.1...@shopify/sewing-kit@0.82.0
[0.82.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.82.0...@shopify/sewing-kit@0.82.1
[0.83.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.82.0...@shopify/sewing-kit@0.83.0
[0.83.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.83.0...@shopify/sewing-kit@0.83.1
[0.83.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.83.1...@shopify/sewing-kit@0.83.2
[0.83.3]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.83.2...@shopify/sewing-kit@0.83.3
[0.83.4]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.83.3...@shopify/sewing-kit@0.83.4
[0.83.5]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.83.4...@shopify/sewing-kit@0.83.5
[0.84.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.83.5...@shopify/sewing-kit@0.84.0
[0.85.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.84.0...@shopify/sewing-kit@0.85.0
[0.85.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.85.0...@shopify/sewing-kit@0.85.1
[0.85.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.85.1...@shopify/sewing-kit@0.85.2
[0.85.3]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.85.2...@shopify/sewing-kit@0.85.3
[0.85.4]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.85.3...@shopify/sewing-kit@0.85.4
[0.85.5]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.85.4...@shopify/sewing-kit@0.85.5
[0.86.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.85.5...@shopify/sewing-kit@0.86.0
[0.87.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.86.0...@shopify/sewing-kit@0.87.0
[0.88.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.87.0...@shopify/sewing-kit@0.88.0
[0.89.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.88.0...@shopify/sewing-kit@0.89.0
[0.89.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.89.0...@shopify/sewing-kit@0.89.1
[0.89.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.89.1...@shopify/sewing-kit@0.89.2
[0.90.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.89.2...@shopify/sewing-kit@0.90.0
[0.91.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.90.0...@shopify/sewing-kit@0.91.0
[0.91.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.91.0...@shopify/sewing-kit@0.91.1
[0.91.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.91.1...@shopify/sewing-kit@0.91.2
[0.92.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.91.2...@shopify/sewing-kit@0.92.0
[0.92.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.92.0...@shopify/sewing-kit@0.92.1
[0.93.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.92.1...@shopify/sewing-kit@0.93.0
[0.94.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.93.0...@shopify/sewing-kit@0.94.0
[0.94.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.94.0...@shopify/sewing-kit@0.94.1
[0.95.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.94.1...@shopify/sewing-kit@0.95.0
[0.95.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.95.0...@shopify/sewing-kit@0.95.1
[0.95.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.95.1...@shopify/sewing-kit@0.95.2
[0.96.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.95.2...@shopify/sewing-kit@0.96.0
[0.97.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.96.0...@shopify/sewing-kit@0.97.0
[0.97.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.97.0...@shopify/sewing-kit@0.97.1
[0.97.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.97.1...@shopify/sewing-kit@0.97.2
[0.97.3]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.97.2...@shopify/sewing-kit@0.97.3
[0.98.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.97.3...@shopify/sewing-kit@0.98.0
[0.99.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.98.0...@shopify/sewing-kit@0.99.0
[0.100.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.99.0...@shopify/sewing-kit@0.100.0
[0.101.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.100.0...@shopify/sewing-kit@0.101.0
[0.102.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.101.0...@shopify/sewing-kit@0.102.0
[0.103.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.102.0...@shopify/sewing-kit@0.103.0
[0.103.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.103.0...@shopify/sewing-kit@0.103.1
[0.103.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.103.1...@shopify/sewing-kit@0.103.2
[0.104.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.103.2...@shopify/sewing-kit@0.104.0
[0.104.1]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.104.0...@shopify/sewing-kit@0.104.1
[0.104.2]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.104.1...@shopify/sewing-kit@0.104.2
[0.105.0]: https://github.com/Shopify/sewing-kit/compare/@shopify/sewing-kit@0.104.2...@shopify/sewing-kit@0.105.0
[unreleased]: https://github.com/Shopify/sewing-kit/compare/v0.105.0...HEAD
