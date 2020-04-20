# Sewing Kit

> An opinionated orchestrator of web development tools,

Understanding the architecture about this project is mostly about understanding the problem it seeks to solve. In short, that there is a complex matrix of tasks and tools involved in web development, and sewing kit’s job is to model those concepts in a way that enables us to give web developers a world-class starting point; a set of configuration for those tools that will maximize both end user and developer happiness, and that aligns with the technology bets we are making as a company. The matrix modeled by `sewing-kit`

- **Tasks**: when actively working on or verifying a project, we might be linting, testing, type checking, building, developing, or deploying (others might exist too; sewing-kit seeks to model them). **[link to CLI command landing page]**
- **Projects**: even a single logical "app" might be made up of several components that are treated differently for the purposes of our tasks and tools. Sewing kit currently understands the notion of a service, a web app, and a package, and a repo can conceivably contain as many of each as is appropriate for solving the problem at hand in a way that is ergonomic to the developer. **[link to more detail on projects/ workspace and to configuration]**
- **Tools**: some tools are used for a single task, like ESLint for linting. Some are used for multiple tasks, like webpack. Some are languages or other concepts that apply regardless of task, like Sass. Unlike projects and tasks, `sewing-kit` does not model tools directly like it does for projects and tasks. Instead, it offers a plugin API that can be used to connect tools to the tasks and projects with appropriate configuration, and even to expose API for other plugins to configure behavior in a flexible way. **[link to plugin/ hook docs]**

> ^ This is a decent way of structuring an intro to SK (obviously, much cleaned up)

## TODO

- [x] Get rid of discovery. Discovery should just be looking for every `sewing-kit.config.*`, running it, and collecting the results to form the project.
- [x] Find a way to help avoid issues where re-export of a type leads to an unresolvable export once compiled from TS to another format (the re-export of the type can remain because babel doesn’t know it has to be removed)
- [ ] Work on better API for what hooks get and how they declare steps. Right now steps are too dumb because they don't understand dependencies between steps, resource utilization, pausing/ unpausing of work, etc. Additionally, the hooks API is dumb because some stuff comes as part of that first argument to hooks, and some stuff comes in as a random "special" argument.
- [ ] Better experience with unknown flags for CLI commands
- [x] Get off of tapable, make our own simple version that just has the async hooks we actually use
- [x] Order is too important for plugins right now. This is primarily because of the `configure` hooks, plugins that add hooks need to come before those that use them (e.g., `plugin-javascript` after `plugin-babel`). If we moved all "hook augmentation" stuff to a dedicated hook, order would be a lot more intuitive (e.g., just put the plugin whose config you most want to "win" latest).
- [x] Hooks are organized so it should be possible for any given message to see what plugin did it and what the "plugin hierarchy" was (what parents, if any, and what project/ workspace it was for)
- [x] It's super annoying when writing custom plugins that I need to specify service/ webapp. Maybe that could be inferred from a generic on the plugin, which could be helped along by the argument type of `createX` correctly indicating what types of plugins are allowed? E.g., `ProjectPlugin<Project>` is default, `ProjectPlugin<Service>` would be expected as a type for all plugins in a service, providing that type and some other indication at the call site will then scope the hooks to only those that project type (or, for all project types, but the typings for that are annoying if they don't all share at least some subset of hooks). Actually — might not need to provide any other indication at the callsite — types can be the things that help you out, and then at runtime, we just pass the project through to the plugin without checking anything, we assume types ensured the plugin can handle that project type.
- [ ] Add a way for composing plugins to see the dependencies of the project during composition

## Ideal at Shopify

```ts
// Root sewing-kit.config.ts
import {createWorkspace} from '@sewing-kit/config';
import {defaultWorkspacePlugin} from '@shopify-internal/sewing-kit-plugins';

export default createWorkspace((workspace) => {
  // Adds TS, ESLint, yarn, jest, prettier, stylelint, ... for lint/ test/ type-check
  workspace.use(defaultWorkspacePlugin);
});

// Web app sewing-kit.config.ts
import {createWebApp} from '@sewing-kit/config';
import {defaultWebAppPlugin} from '@shopify-internal/sewing-kit-plugins';

export default createWebApp((webApp) => {
  // It would include plugins for:
  // - TS, react (conditionally), quilt (conditionally)
  // - detecting environment from dev/ railgun, maybe adding some default deploy stuff
  webApp.use(defaultWebAppPlugin);
});

// Service sewing-kit.config.ts
import {createService} from '@sewing-kit/config';
import {defaultServicePlugin} from '@shopify-internal/sewing-kit-plugins';

export default createService((service) => {
  service.use(defaultServicePlugin);
});
```

## Plugin ideas

### Composition

Plugin composition is something that's obviously going to be important if we keep the plugins sufficiently focused, which I’d like to. The key thing I want out of a composition API is that messages produced by `sk`'s UI layer should always be able to track a message or error back to the source plugin **and** include it’s "ancestors". Plugin composition also has to be programmatic, not declarative, so that projects can look at details about the project (and, maybe, eventually, ask questions) to decide how/ what to compose.

I'm explicitly willing to trade off things like being able to detect and resolve duplicate plugins because I don’t think we’ll need it for our use case (I imagine all our projects will a small number of composed plugins, rather than a large number of plugins, so duplicates are less likely).

### Types

I think we need two kinds of plugins:

- **Workspace plugins.** These configure behavior and tasks that apply to the workspace as a whole. This would typically be tool related, like plugins that add `eslint` or `jest` running to the `lint` and `test` commands. It can also be used for pre- and post- steps that apply to the entire repo, like having `typescript` run `tsc --build` before the `build` command (since TS project references apply to the repo, not the project, but projects need that build for their own individual build outputs).
- **Project plugins.** These configure behavior and tasks that apply to individual projects. This means that they are currently only relevant to `sewing-kit dev` and `sewing-kit build`, because those are the only ones we currently have project-specific hooks for. This would be useful for the majority of the plugins we make, because they are mostly about changing some behavior of a project’s build/ dev/ test (i18n builds, differential serving, package building, webpack configuring, etc).

To make this work, we’ll need the following changes:

- We’ll need to split the current hook API in half, at the boundary where it switches to the `project/webApp/service/package` hooks.
- We’ll need to give projects the same kind of "global" access to set hooks as workspace ones do; e.g., a plugin can configure dev + build configuration as part of the same plugin
- The project plugins will need to specify whether they are for services, packages, apps, or any. Currently, we have the `project/webApp/service/package` hooks that allow us to branch, so we’ll either need to replicate that in the project hooks or have it be part of creating the plugin (IMO the latter is better because we can use strong typing to ensure only the right kind of plugins end up together, and it also enables a single plugin to work across project types which is maybe nice and still plenty explicit).

When declaring the configuration for a workspace/ project, I think we should only allow them to include their own types of plugins. Projects including workspace plugins definitely doesn't make sense, and though workspace including project plugins could be sensible (treat it as included for every project for which it would be a valid plugin to include), it feels uncomfortable and means workspace configuration is inherently serial with finding the rest of the project configuration.
