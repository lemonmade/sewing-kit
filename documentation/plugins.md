# Plugins

Almost everything that sewing-kit does is actually done by plugins. The core part of sewing-kit only provides the scaffolding for tasks, a set of primitives for generating UI, and a collection of "hooks" to which plugins can bind. Understanding what hooks are available is key to developing plugins and, as a result, to building features into sewing-kit.

## Design Goals

The plugin system was designed with the following ideas in mind:

1. **Plugins drive everything except for the core tasks and models.** Plugins determine every step for every task, but they are not capable of adding additional tasks. Likewise, plugins determine what projects make up a workspace, but the concept of a workspace and its sub-projects exists outside of plugins (both tasks and the workspace are described in `@sewing-kit/core`).
1. **Plugins are type-safe.** Plugins can safely extend any type from `@sewing-kit/types` whose name ends in `CustomHooks`. These hooks will be assumed to be optionally available for all other plugins, which allows plugins to depend on additional hooks added by their dependencies in a type-safe way.
1. **Plugins can defer code execution as late as possible.** This is done primarily by making all hooks asynchronous, which allows for dynamic code loading. This means that plugins can (and should!) avoid loading code and dependencies until the hook where they are needed.
1. **Plugins can handle the entirety of their domain.** A given technology may need particular handling in tests, build, lint, etc. A single plugin is capable of dictating all of that behavior across tasks. This allows a plugin like `@sewing-kit/plugin-typescript` to define the basics of how TypeScript files are handled across the board, rather than needing additional plugins for every task/ tool combination.

## Targets

Plugins can have only one target. A target is the point in a task where the plugin is injected. Most plugins will be targeted at "root" (represented by `PluginTarget.Root`). These plugins are called with the ability to hook in to any task. However, plugins can also target more specific parts of some tasks by only being run in the context of a single sub-project (package/ web app/ service). These plugins allow users to define per-project customizations by adding the plugin only to the configuration files for the projects that actually need that customization. You can see a list of available plugin types in `@sewing-kit/core`.

## Hooks

Once plugins are called, they should make use of the many hooks provided by the core of sewing-kit, and by other plugins. These hooks use `tapable`, a flexible library for defining custom behavior.

## Tools

The `@sewing-kit/plugin-utilities` library provides most of the helpers you’ll need to create a plugin. Most notably, this package exports the `createPlugin` and `PluginTarget` values, which are needed to define a valid plugin. `@sewing-kit/types` provides most of the hooks used in the various sewing-kit tasks. These types are generally unnecessary, but if you are adding additional hooks (for example, `@sewing-kit/plugin-webpack` adds additional hooks to some parts of the build task), you will need to [augment the `@sewing-kit/types` module](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation). `@sewing-kit/ui` is also typically needed for any plugin dealing with `Steps`, a key UI concept used by several different tasks.

## Styleguide

- Plugins provided by sewing-kit itself should have an `id` prefixed with `SewingKit.`.
- Plugins that define meaningful behavior for more than one task should split the task handling into files, and use the `lazy` helper to asynchronously load code for each task (see `@sewing-kit/plugin-typescript` for an example).
- Plugins are generally one of the following categories: tool (often adds hooks), language (often adds configuration for those custom hooks), discovery (finds projects and outlines the rough handling), and others. They should typically be composed in that order also, as it ensures that the necessary custom hooks are available at the right time.
- Functions that are plugins should end in `Plugin` (e.g., `jsonPlugin`). Functions that create plugins should be prefixed with `create` and postfixed with `Plugin` (e.g., `createJavaScriptPlugin`). Plugins that target anything other than root should include the name of the target immediately before the postfixed `Plugin` (e.g., `createSassIncludesBuildProjectPlugin`).
