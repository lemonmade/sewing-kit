# `@sewing-kit/tasks`

`@sewing-kit/tasks` provides a number of interfaces that define the structure of tasks sewing-kit has knowledge on. This structure is heavily based on interfaces provided by `@sewing-kit/hooks`

At a high level, `sewing-kit` represents the tasks applied against a given codebase through `WorkspaceTasks` and `ProjectTasks`. These tasks, in turn, can include a number of other tasks that can represent the tasks associated with building, linting, testing a codebase and more. Example tasks are `build`, `dev` and `test`, which apply to both, but `lint` and `type-check` tasks can also be run on a Workspace.

A Task is defined with a set of [hooks](/packages/hooks/README.md) and options.

## Installation

```
yarn add @sewing-kit/tasks --dev
```
