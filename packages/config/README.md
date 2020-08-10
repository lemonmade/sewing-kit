# `@sewing-kit/config`

This package defines how to configure a package, web-app or service in the workspace using a `sewing-kit.config.ts` file. It defines the API for the `sewing-kit.config.ts` file. A `sewing-kit.config.ts` file is required in the root folder of each package, web-app, or service in the workspace.

## Installation

```
yarn add @sewing-kit/config --dev
```

## Usage

Use `createPackage` in a `sewing-kit.config.ts` file to define a package in the workspace.  Sewing-kit itself uses this to define its own packages as follows:

```ts
import {createPackage, Runtime} from '@sewing-kit/config';
import {createSewingKitPackagePlugin} from '../../config/sewing-kit';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.use(createSewingKitPackagePlugin());
});
```

Use `createService` in a `sewing-kit.config.ts` file to define a service in the workspace.

Use `createWebApp` in a `sewing-kit.config.ts` file to define a web-app in the workspace.

Default plugins are provided, or consumers can create their own plugin to define their custom configuration.

Use `createWorkspace` in a `sewing-kit.config.ts` file to define a workspace.  The following config file defines the sewing-kit workspace itself.  A workspace that uses eslint, jest, and TypeScript.

```ts
import {createWorkspace} from '@sewing-kit/config';

import {eslint} from '@sewing-kit/plugin-eslint';
import {jest} from '@sewing-kit/plugin-jest';
import {workspaceTypeScript} from '@sewing-kit/plugin-typescript';

export default createWorkspace((workspace) => {
  workspace.use(eslint(), jest(), workspaceTypeScript());
});
```
