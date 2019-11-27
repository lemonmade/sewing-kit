# `sewing-kit` Architecture

This document outlines the key moving pieces that make up `sewing-kit`

## `@sewing-kit/types`

This package defines most of the core types for sewing-kit. Of particular note, many of the hook objects used as part of various sewing-kit tasks rely on this package to give them the object shape. This separation is done so that plugins can "augment" the hook typings, allowing them to add additional hooks in a type-safe way. The `@sewing-kit/types` package is special in that it produces its type definitions to the root of the project, which allows plugins to define augmentations against `@sewing-kit/types` directly, rather than needing to augment a built definition file deeper in the package (e.g., `@sewing-kit/types/build/ts/index`).

## `@sewing-kit/ui`

This package provides a set of utilities for managing the UI of the CLI. It also provides implementation for a core concept of several tasks: steps. Steps are pieces of code that can be run with the UI context, and also support things many tasks need, like the ability to dynamically skip certain tasks based on command-line flags. The `ui` package also provides a default runner for steps, which creates a stateful representation of steps being run and prints them to the terminal. This is useful for tasks that follow a "configure, create steps, run steps" pattern, like building, linting, and testing. Finally, this package provides `DiagnosticError`, a base class for errors that can be elegantly displayed (with troubleshooting information), and that should be used for all errors thrown in the system.

## `@sewing-kit/config`

The config package provides the utilities for loading and validating `sewing-kit.config` files. It also provides the API config files use to declare configuration in a clean, type-safe way (`createWorkspace`, `createPackage`, etc).

## `@sewing-kit/core`

The core package currently provides two key features:

1. The definition of the core model of sewing-kit: `Workspace`, `WebApp`, `Package`, and `Service`
2. The instructions for the different tasks sewing-kit can perform. Given a set of options, a root object, and (usually) a `Workspace`, sewing-kit provides a function that can create and run the appropriate hooks for completing tasks.

## `@sewing-kit/cli`

The CLI takes the task functions from `@sewing-kit/core` and embeds them in a CLI. Because `@sewing-kit/core` does most of the heavy lifting, this package is just a fairly simple layer that translates CLI arguments into options for the task functions to run.
