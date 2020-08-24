# `@sewing-kit/tasks`

`@sewing-kit/tasks` provides a number of helpful types and interfaces that describe the kinds of things that Sewing Kit can do for your workspace.

This package is closely tied with and extends from [`@sewing-kit/hooks`](../hooks/README.md) and the interfaces it provides.

## Installation

```
yarn add @sewing-kit/tasks --dev
```

## Tasks

At a high level, Sewing Kit distinguishes between `WorkspaceTasks` (which apply to the entire workspace) and `ProjectTasks` (which apply to the individual projects within a workspace).

- `WorkspaceTasks`
  - `build` (`BuildWorkspaceTask`)
  - `dev` (`DevWorkspaceTask`)
  - `test` (`TestWorkspaceTask`)
  - `lint` (`LintWorkspaceTask`)
  - `typeCheck` (`TypeCheckWorkspaceTask`)
- `ProjectTasks`
  - `build` (`BuildProjectTask`)
  - `dev` (`DevProjectTask`)
  - `test` (`TestProjectTask`)

A task (e.g. `build`, `dev`, `test`) is made up of options and [hooks](../hooks/README.md). Options exist to configure the task, and can be passed in through [Sewing Kit's CLI](../cli/README.md). Task hooks expose a way for plugins (either `@sewing-kit`'s or your own) to tap into and customize a task's functionality.
