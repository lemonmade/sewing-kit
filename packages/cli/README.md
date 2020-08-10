# `@sewing-kit/cli`

## Installation

```
yarn add @sewing-kit/cli --dev
```

## Usage

```typescript
yarn run sewing-kit <command> <options>
```

### Commands

- `build` - compiles code and SCSS into deployable assets
  | options |
  |-----------------|
  | `--source-maps` |
  | `--env` |

- `dev` - starts a hot-reloading development server

  | options         |
  | --------------- |
  | `--reload`      |
  | `--source-maps` |

- `test` - runs all tests

  | options               |
  | --------------------- |
  | `--help`              |
  | `--no-watch`          |
  | `--coverage`          |
  | `--debug`             |
  | `--update-snapshots`  |
  | `--test-name-pattern` |

- `lint` - lints Sass, JavaScript, TypeScript, and GraphQL files

  | options         |
  | --------------- |
  | `--fix`         |
  | `--cache`       |
  | `--allow-empty` |

- `type-check` - checks TypeScript files for type violations

  | options   |
  | --------- |
  | `--watch` |
  | `--cache` |
