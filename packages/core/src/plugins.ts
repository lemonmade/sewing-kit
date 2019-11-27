import {Plugin, PluginTarget} from '@sewing-kit/types';

export interface RootPlugin extends Plugin {
  readonly target: PluginTarget.Root;
  (tasks: import('./runner').RunnerTasks): void;
}

export interface BuildProjectPlugin extends Plugin {
  readonly target: PluginTarget.BuildProject;
  (details: import('./tasks/build').BuildProjectDetails): void;
}

export interface BuildPackagePlugin extends Plugin {
  readonly target: PluginTarget.BuildPackage;
  (details: import('./tasks/build').BuildPackageDetails): void;
}

export interface BuildWebAppPlugin extends Plugin {
  readonly target: PluginTarget.BuildWebApp;
  (details: import('./tasks/build').BuildWebAppDetails): void;
}

export interface BuildServicePlugin extends Plugin {
  readonly target: PluginTarget.BuildService;
  (details: import('./tasks/build').BuildServiceDetails): void;
}

export interface TestProjectPlugin extends Plugin {
  readonly target: PluginTarget.TestProject;
  (details: import('./tasks/testing').TestProjectDetails): void;
}

export interface PluginTargetMap {
  [PluginTarget.Root]: RootPlugin;
  [PluginTarget.BuildProject]: BuildProjectPlugin;
  [PluginTarget.BuildWebApp]: BuildWebAppPlugin;
  [PluginTarget.BuildPackage]: BuildPackagePlugin;
  [PluginTarget.BuildService]: BuildServicePlugin;
  [PluginTarget.TestProject]: TestProjectPlugin;
}
