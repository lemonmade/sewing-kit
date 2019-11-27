# `plugin-package-typescript`

This `sewing-kit` plugin is charged with generating type definitions for packages. It does this only in cases where the packages are actually meant for publishing, not when the packages are being treated as "in-repo packages" for a web app or service.

To build type definitions, this plugin requires that the packages use TypeScript project references. This allows for faster, reproducible builds. Once it has built the project, it writes `.d.ts` entry files at the root of the package for each entrypoint in the package. This means that developers still get the typings they need from different entrypoints, but can't access all typings from the project unless they reach into the build directory (which is heavily discouraged).

This plugin adds an additional option you can pass when creating a package entry in a `sewing-kit` config file: `typesAtRoot`. This option means that, instead of creating `.d.ts` entry point files that re-export all the contents of the corresponding built `.d.ts` file, the `.d.ts` files at root **must** contain the raw type declarations. This can be useful in packages that rely heavily on module augmentations, like `@sewing-kit/types`.

## Implementation details

There is a bit of a trick with what this plugin does: in order to build the TypeScript project, we need to first have the `.d.ts` files in place. These `.d.ts` files need to work for both the default and `typesAtRoot` cases. In order to do this, this plugin inserts itself at two points in the build pipeline:

1. `pre`: the plugin first writes symlinks for every entry `.d.ts` file. This will ensure that those files resolve properly for subsequent packages being built that depend on another package in the project, and will also work for cases where all types need to appear at root. The plugin then runs `tsc --build` to actually build the type definitions for the project.

2. regular step: the plugin either writes entry point `.d.ts` files (overwriting the symlinks used to make the package resolve properly during build), or, if any entry point in the project specifies the `typesAtRoot` option, it will simply copy the `.d.ts` files from the built directory to the root of the package (this does create an issue with source mapping for the `.d.ts` files, which we'd like to fix at some point). While it might be tempting to instead have the `tsconfig` for the project point output at root, this has the unfortunate side effect of also putting built `.js` files at root, which we want to avoid so we can keep the entrypoints for the package clear.
