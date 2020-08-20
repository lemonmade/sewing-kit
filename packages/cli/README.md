# `@sewing-kit/cli`

The CLI for working with Sewing Kit.

## Installation

```
yarn add @sewing-kit/cli --dev
```

## Usage

```ts
yarn sewing-kit <command> <options>
// or...
yarn sk <command> <options>
```

## Commands

| Command                       | Function                                                  |
| ----------------------------- | --------------------------------------------------------- |
| [`build`](###build)           | Builds the apps, services, and packages in your workspace |
| [`dev`](###dev)               | Starts a hot-reloading development server                 |
| [`test`](###test)             | Runs tests                                                |
| [`lint`](###lint)             | Lints your code                                           |
| [`type-check`](###type-check) | Type-checks your code                                     |

## Options

### `build`

| Option          | Description |
| --------------- | ----------- |
| `--source-maps` |             |
| `--env`         |             |

### `dev`

| Option          | Description |
| --------------- | ----------- |
| `--source-maps` |             |
| `--reload`      |             |

### `test`

| Option                | Description |
| --------------------- | ----------- |
| `--help`              |             |
| `--no-watch`          |             |
| `--coverage`          |             |
| `--debug`             |             |
| `--update-snapshots`  |             |
| `--test-name-pattern` |             |

### `lint`

| Option          | Description |
| --------------- | ----------- |
| `--fix`         |             |
| `--cache`       |             |
| `--allow-empty` |             |

#### `type-check`

| Option    | Description |
| --------- | ----------- |
| `--watch` |             |
| `--cache` |             |
