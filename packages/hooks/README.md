# `@sewing-kit/hooks`

Hooks are a pluggable way of extending or configuring components of a Workspace (Packages, WebApps, or Services) that sewing-kit performs [tasks](/packages/tasks/README.md) on. Hooks are the mechanism [plugins](packages/plugins/README.md) use to expand those tasks.  Core hooks are part of sewing-kit and along with custom hooks they comprise the configuration that defines how these tasks are performed.

Hooks are based on the ideas represented in the [Tapable](https://codeburst.io/what-the-hook-learn-the-basics-of-tapable-d95eb0401e2c) library in Webpack.  Hooks are "tapable" in the sense that they can be tapped in or listened to and behaviour extended.  In sewing-kit, hooks define the set of steps to be completed as part of any task. 

Sewing-kit's hooks allow steps in a task to be created.  [Plugins](/packages/plugins/README.md), both those defined at the workspace or project level, have access to an API for creating a step.  Plugins can therefore "tap" in to any sewing-kit task and add a step.

Two different categories of hooks are used in sewing-kit: Waterfall and Series hooks.  Series hooks call functions one after the other, each returning a value.  Waterfall hook functions pass a return value to the next, and the value of the last function call is returned.  

There are also context objects for each of the Project types (Service, Package, or WebApp) for tracking steps as they are executed and reporting on/logging them.  The context helps define the current progress in a sequence of steps.

## Installation

```
yarn add @sewing-kit/hooks --dev
```

## Usage

The following example is for sewing-kit's type-check command where steps are created using a WaterfallHook.

```typescript
export async function runTypeCheck(
  taskContext: TaskContext,
  options: TypeCheckOptions,
) {
  const {workspace} = taskContext;
  const {typeCheck} = await createWorkspaceTasksAndApplyPlugins(taskContext);

  const hooks: TypeCheckWorkspaceTaskHooks = {
    configureHooks: new WaterfallHook(),
    configure: new SeriesHook(),
    pre: new WaterfallHook(),
    steps: new WaterfallHook(),
    post: new WaterfallHook(),
    context: new WaterfallHook(),
  };

  await typeCheck.run({
    hooks,
    options,
  });

  const configuration = await hooks.configureHooks.run({});
  await hooks.configure.run(configuration);

  const context = await hooks.context.run({configuration});

  const pre = await hooks.pre.run([], context);
  const steps = await hooks.steps.run([], context);
  const post = await hooks.post.run([], context);

  await run(taskContext, {
    title: 'type-check',
    pre,
    post,
    steps: steps.map((step) => ({step, target: workspace})),
    epilogue(log) {
      log((fmt) => fmt`{success type-check completed successfully!}`);
    },
  });
}
```

The typescript plugin is hooked into the steps of the type-check task with the following 

```typescript
hooks.steps.hook((steps, {configuration}) => [
        ...steps,
        createRunTypeScriptStep(context, configuration),
]);
```

The `createRunTypeScriptStep` uses the plugin API to create and return the Step

```ts
return api.createStep(
    {
      id: 'TypeScript.TypeCheck',
      label: 'run typescript',
    },
    async (step) => {
      const heap = await configure.typescriptHeap!.run(0);
      const heapArguments = heap ? [`--max-old-space-size=${heap}`] : [];

      try {
        await step.exec(
          'node',
          [...heapArguments, 'node_modules/.bin/tsc', '--build', '--pretty'],
          {all: true, env: {FORCE_COLOR: '1'}},
        );
      } catch (error) {
        throw new DiagnosticError({
          title: 'TypeScript found type errors',
          content: error.all,
        });
      }
    },
  );
```

The step is run from the `runTypeCheck` command where `hooks.steps.run` is called.

```typescript
const steps = await hooks.steps.run([], context);
```
