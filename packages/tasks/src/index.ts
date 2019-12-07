import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  TypeCheckWorkspaceConfigurationHooks,
  TestWorkspaceConfigurationHooks,
  TestPackageHooks,
  TestWebAppHooks,
  TestProjectWorkspaceContext,
  LintWorkspaceConfigurationHooks,
  BuildWorkspaceConfigurationHooks,
  BuildWebAppHooks,
  BuildPackageHooks,
  BuildServiceHooks,
  DevWorkspaceConfigurationHooks,
  DevWebAppHooks,
  DevPackageHooks,
  DevServiceHooks,
} from '@sewing-kit/hooks';
import {Step} from '@sewing-kit/ui';
import {Workspace, Package, WebApp, Service} from '@sewing-kit/model';

export enum Env {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

// ==================================================================
// CONSOLIDATED
// ==================================================================

export interface WorkspaceTasks {
  readonly build: AsyncSeriesHook<BuildWorkspaceTask>;
  readonly dev: AsyncSeriesHook<DevWorkspaceTask>;
  readonly test: AsyncSeriesHook<TestWorkspaceTask>;
  readonly lint: AsyncSeriesHook<LintWorkspaceTask>;
  readonly typeCheck: AsyncSeriesHook<TypeCheckWorkspaceTask>;
}

export interface ProjectTasks {
  readonly build: AsyncSeriesHook<BuildProjectTask>;
  readonly dev: AsyncSeriesHook<DevProjectTask>;
  readonly test: AsyncSeriesHook<TestProjectTask>;
}

// ==================================================================
// TYPE CHECK
// ==================================================================

export interface TypeCheckOptions {
  readonly watch?: boolean;
  readonly cache?: boolean;
  readonly skip?: readonly string[];
  readonly skipPre?: readonly string[];
  readonly skipPost?: readonly string[];
}

interface TypeCheckWorkspaceStepDetails {
  readonly configuration: TypeCheckWorkspaceConfigurationHooks;
}

export interface TypeCheckWorkspaceTaskHooks {
  readonly configure: AsyncSeriesHook<TypeCheckWorkspaceConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<
    readonly Step[],
    TypeCheckWorkspaceStepDetails
  >;
  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    TypeCheckWorkspaceStepDetails
  >;
  readonly post: AsyncSeriesWaterfallHook<
    readonly Step[],
    TypeCheckWorkspaceStepDetails
  >;
}

export interface TypeCheckWorkspaceTask {
  readonly hooks: TypeCheckWorkspaceTaskHooks;
  readonly options: TypeCheckOptions;
  readonly workspace: Workspace;
}

// ==================================================================
// LINT
// ==================================================================

export interface LintTaskOptions {
  readonly fix?: boolean;
  readonly skip?: string[];
  readonly cache?: boolean;
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface LintWorkspaceStepDetails {
  readonly configuration: LintWorkspaceConfigurationHooks;
}

export interface LintWorkspaceTaskHooks {
  readonly configure: AsyncSeriesHook<LintWorkspaceConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<Step[], LintWorkspaceStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], LintWorkspaceStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], LintWorkspaceStepDetails>;
}

export interface LintWorkspaceTask {
  readonly hooks: LintWorkspaceTaskHooks;
  readonly options: LintTaskOptions;
  readonly workspace: Workspace;
}

// ==================================================================
// TEST
// ==================================================================

export interface TestTaskOptions {
  readonly watch?: boolean;
  readonly debug?: boolean;
  readonly coverage?: boolean;
  readonly testPattern?: string;
  readonly testNamePattern?: string;
  readonly updateSnapshot?: boolean;
  readonly skip?: string[];
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface TestWorkspaceStepDetails {
  readonly context: TestProjectWorkspaceContext;
  readonly configuration: TestWorkspaceConfigurationHooks;
}

export type TestProjectDetails =
  | {
      readonly project: Package;
      readonly hooks: TestPackageHooks;
    }
  | {
      readonly project: WebApp;
      readonly hooks: TestWebAppHooks;
    };

export interface TestWorkspaceTaskHooks {
  readonly pre: AsyncSeriesWaterfallHook<Step[], TestWorkspaceStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], TestWorkspaceStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], TestWorkspaceStepDetails>;
  readonly configure: AsyncSeriesHook<TestWorkspaceConfigurationHooks>;
  readonly context: AsyncSeriesWaterfallHook<TestProjectWorkspaceContext>;
}

export interface TestProjectTaskHooks {
  readonly project: AsyncSeriesHook<TestProjectDetails>;
  readonly package: AsyncSeriesHook<{
    readonly pkg: Package;
    readonly hooks: TestPackageHooks;
  }>;
  readonly webApp: AsyncSeriesHook<{
    readonly webApp: WebApp;
    readonly hooks: TestWebAppHooks;
  }>;
}

export interface TestWorkspaceTask {
  readonly hooks: TestWorkspaceTaskHooks;
  readonly options: TestTaskOptions;
  readonly workspace: Workspace;
}

export interface TestProjectTask {
  readonly hooks: TestProjectTaskHooks;
  readonly context: TestProjectWorkspaceContext;
  readonly options: TestTaskOptions;
  readonly workspace: Workspace;
}

// ==================================================================
// BUILD
// ==================================================================

export interface BuildTaskOptions {
  readonly env: Env;
  readonly simulateEnv: Env;
  readonly sourceMaps?: boolean;
  readonly cache?: boolean;
  readonly skip?: string[];
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface BuildStepDetails {
  readonly configuration: BuildWorkspaceConfigurationHooks;
}

export interface BuildWebAppDetails {
  readonly webApp: WebApp;
  readonly hooks: BuildWebAppHooks;
}

export interface BuildPackageDetails {
  readonly pkg: Package;
  readonly hooks: BuildPackageHooks;
}

export interface BuildServiceDetails {
  readonly service: Service;
  readonly hooks: BuildServiceHooks;
}

export type BuildProjectDetails =
  | {
      readonly project: WebApp;
      readonly hooks: BuildWebAppHooks;
    }
  | {readonly project: Package; readonly hooks: BuildPackageHooks}
  | {readonly project: Service; readonly hooks: BuildServiceHooks};

export interface BuildWorkspaceTaskHooks {
  readonly configure: AsyncSeriesHook<BuildWorkspaceConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<readonly Step[], BuildStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<readonly Step[], BuildStepDetails>;
}

export interface BuildProjectTaskHooks {
  readonly project: AsyncSeriesHook<BuildProjectDetails>;
  readonly package: AsyncSeriesHook<BuildPackageDetails>;
  readonly webApp: AsyncSeriesHook<BuildWebAppDetails>;
  readonly service: AsyncSeriesHook<BuildServiceDetails>;
}

export interface BuildWorkspaceTask {
  readonly hooks: BuildWorkspaceTaskHooks;
  readonly options: BuildTaskOptions;
  readonly workspace: Workspace;
}

export interface BuildProjectTask {
  readonly hooks: BuildProjectTaskHooks;
  readonly options: BuildTaskOptions;
  readonly workspace: Workspace;
}

// ==================================================================
// DEV
// ==================================================================

export interface DevTaskOptions {
  readonly sourceMaps?: boolean;
  readonly skip?: string[];
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface DevWorkspaceStepDetails {
  readonly configuration: DevWorkspaceConfigurationHooks;
}

export type DevProjectDetails =
  | {
      readonly project: WebApp;
      readonly hooks: DevWebAppHooks;
    }
  | {readonly project: Service; readonly hooks: DevServiceHooks}
  | {readonly project: Package; readonly hooks: DevPackageHooks};

export interface DevWorkspaceTaskHooks {
  readonly configure: AsyncSeriesHook<DevWorkspaceConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<
    readonly Step[],
    DevWorkspaceStepDetails
  >;
  readonly post: AsyncSeriesWaterfallHook<
    readonly Step[],
    DevWorkspaceStepDetails
  >;
}

export interface DevProjectTaskHooks {
  readonly project: AsyncSeriesHook<DevProjectDetails>;
  readonly package: AsyncSeriesHook<{
    readonly pkg: Package;
    readonly hooks: DevPackageHooks;
  }>;
  readonly webApp: AsyncSeriesHook<{
    readonly webApp: WebApp;
    readonly hooks: DevWebAppHooks;
  }>;
  readonly service: AsyncSeriesHook<{
    readonly service: Service;
    readonly hooks: DevServiceHooks;
  }>;
}

export interface DevWorkspaceTask {
  readonly hooks: DevWorkspaceTaskHooks;
  readonly options: DevTaskOptions;
  readonly workspace: Workspace;
}

export interface DevProjectTask {
  readonly hooks: DevProjectTaskHooks;
  readonly options: DevTaskOptions;
  readonly workspace: Workspace;
}
