# `@sewing-kit/plugins`

Plugins can be defined at the workspace or project level.  See [Plugins](/documentation/plugins.md)

# Installation

```
yarn add @sewing-kit/plugins --dev
```

## Usage

Sewing-kit defines many pre-built plugins for typical use that execute common tasks such as build, dev, test, lint, typeCheck. In the `sewing-kit.config` for a project or workspace, you can specify which plugins you want to use. 

### Workspace plugins

```typescript
eslint()
stylelint()
jest()
workspaceTypeScript()
```
An example `sewing-kit.config` for a workspace could be
```ts
export default createWorkspace((workspace) => {
  workspace.use(eslint(), jest(), workspaceTypeScript());
});
```

### Project plugins

```ts
webpackBuilds()
webpackHooks()
webpackConfiguration() 
webpackDevWebApp()
webpackDevService()
vscode()
typescript()
javascript()
css()
react()
graphql()
buildCommonJsOutput()
differentialServing()
nodeOutput()
buildNodeOutput()
esnextOutput() 
buildEsNextOutput()
buildBinaries()
```
An example `sewing-kit.config` for a project could be
```ts

export default createPackage((pkg) => {
  pkg.use(typescript(), css(), react(), graphql();
});

```

## Plugin API

Both types of plugins provide a common Plugin API. In particular, `createStep()` for defining the steps that will be executed for the task a plugin is extending.  See [Hooks](/packages/hooks/README.md).

```typescript

createStep(options: Omit<Step, 'run' | 'source'>, run: Step['run']): Step;

```
