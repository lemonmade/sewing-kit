import {
  SeriesHook,
  WaterfallHook,
  TypeCheckWorkspaceContext,
  TypeCheckWorkspaceConfigurationHooks,
  TestWorkspaceConfigurationHooks,
  TestPackageHooks,
  TestWebAppHooks,
  TestServiceHooks,
  TestWorkspaceContext,
  LintWorkspaceContext,
  LintWorkspaceConfigurationHooks,
  BuildWorkspaceContext,
  BuildWorkspaceConfigurationHooks,
  BuildWebAppHooks,
  BuildPackageHooks,
  BuildServiceHooks,
  DevWorkspaceContext,
  DevWorkspaceConfigurationHooks,
  DevWebAppHooks,
  DevPackageHooks,
  DevServiceHooks,
} from '@sewing-kit/hooks';
import {Package, WebApp, Service, Project} from '@sewing-kit/model';

type Step = import('@sewing-kit/core').Step;

export enum Env {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

export enum Task {
  Build = 'build',
  Dev = 'dev',
  Test = 'test',
  Lint = 'lint',
  TypeCheck = 'typeCheck',
}

// ==================================================================
// CONSOLIDATED
// ==================================================================

export interface WorkspaceTasks {
  readonly build: SeriesHook<BuildWorkspaceTask>;
  readonly dev: SeriesHook<DevWorkspaceTask>;
  readonly test: SeriesHook<TestWorkspaceTask>;
  readonly lint: SeriesHook<LintWorkspaceTask>;
  readonly typeCheck: SeriesHook<TypeCheckWorkspaceTask>;
}

export interface ProjectTasks<Type extends Project> {
  readonly build: SeriesHook<BuildProjectTask<Type>>;
  readonly dev: SeriesHook<DevProjectTask<Type>>;
  readonly test: SeriesHook<TestProjectTask<Type>>;
}

// ==================================================================
// TYPE CHECK
// ==================================================================

export interface TypeCheckOptions {
  readonly watch?: boolean;
  readonly cache?: boolean;
}

export interface TypeCheckWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<TypeCheckWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<TypeCheckWorkspaceConfigurationHooks>;
  readonly context: WaterfallHook<TypeCheckWorkspaceContext>;
  readonly pre: WaterfallHook<readonly Step[], TypeCheckWorkspaceContext>;
  readonly steps: WaterfallHook<readonly Step[], TypeCheckWorkspaceContext>;
  readonly post: WaterfallHook<readonly Step[], TypeCheckWorkspaceContext>;
}

export interface TypeCheckWorkspaceTask {
  readonly hooks: TypeCheckWorkspaceTaskHooks;
  readonly options: TypeCheckOptions;
}

// ==================================================================
// LINT
// ==================================================================

export interface LintTaskOptions {
  readonly fix?: boolean;
  readonly cache?: boolean;
  readonly allowEmpty?: boolean;
}

export interface LintWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<LintWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<LintWorkspaceConfigurationHooks>;
  readonly context: WaterfallHook<LintWorkspaceContext>;
  readonly pre: WaterfallHook<Step[], LintWorkspaceContext>;
  readonly steps: WaterfallHook<Step[], LintWorkspaceContext>;
  readonly post: WaterfallHook<Step[], LintWorkspaceContext>;
}

export interface LintWorkspaceTask {
  readonly hooks: LintWorkspaceTaskHooks;
  readonly options: LintTaskOptions;
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
  readonly updateSnapshots?: boolean;
}

export interface TestWorkspaceTaskHooks {
  readonly context: WaterfallHook<TestWorkspaceContext>;
  readonly pre: WaterfallHook<Step[], TestWorkspaceContext>;
  readonly post: WaterfallHook<Step[], TestWorkspaceContext>;
  readonly steps: WaterfallHook<Step[], TestWorkspaceContext>;
  readonly project: SeriesHook<TestWorkspaceProjectDetails>;
  readonly webApp: SeriesHook<TestWorkspaceProjectDetails<WebApp>>;
  readonly package: SeriesHook<TestWorkspaceProjectDetails<Package>>;
  readonly service: SeriesHook<TestWorkspaceProjectDetails<Service>>;
  readonly configure: SeriesHook<TestWorkspaceConfigurationHooks>;
  readonly configureHooks: WaterfallHook<TestWorkspaceConfigurationHooks>;
}

export type TestProjectTaskHooks<Type extends Project> = Type extends Package
  ? TestPackageHooks
  : Type extends WebApp
  ? TestWebAppHooks
  : Type extends Service
  ? TestServiceHooks
  : TestPackageHooks | TestWebAppHooks | TestServiceHooks;

export interface TestWorkspaceTask {
  readonly hooks: TestWorkspaceTaskHooks;
  readonly options: TestTaskOptions;
}

export interface TestProjectTask<Type extends Project> {
  readonly hooks: TestProjectTaskHooks<Type>;
  readonly options: TestTaskOptions;
  readonly context: TestWorkspaceContext;
}

export interface TestWorkspaceProjectDetails<Type extends Project = Project>
  extends TestProjectTask<Type> {
  readonly project: Project;
}

// ==================================================================
// BUILD
// ==================================================================

export interface BuildTaskOptions {
  readonly env: Env;
  readonly simulateEnv: Env;
  readonly sourceMaps?: boolean;
  readonly cache?: boolean;
}

export interface BuildWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<BuildWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<BuildWorkspaceConfigurationHooks>;
  readonly context: WaterfallHook<BuildWorkspaceContext>;
  readonly project: SeriesHook<BuildWorkspaceProjectDetails>;
  readonly webApp: SeriesHook<BuildWorkspaceProjectDetails<WebApp>>;
  readonly package: SeriesHook<BuildWorkspaceProjectDetails<Package>>;
  readonly service: SeriesHook<BuildWorkspaceProjectDetails<Service>>;
  readonly pre: WaterfallHook<readonly Step[], BuildWorkspaceContext>;
  readonly post: WaterfallHook<readonly Step[], BuildWorkspaceContext>;
}

export type BuildProjectTaskHooks<Type extends Project> = Type extends Package
  ? BuildPackageHooks
  : Type extends WebApp
  ? BuildWebAppHooks
  : Type extends Service
  ? BuildServiceHooks
  : BuildPackageHooks | BuildWebAppHooks | BuildServiceHooks;

export interface BuildWorkspaceTask {
  readonly hooks: BuildWorkspaceTaskHooks;
  readonly options: BuildTaskOptions;
}

export interface BuildProjectTask<Type extends Project> {
  readonly hooks: BuildProjectTaskHooks<Type>;
  readonly options: BuildTaskOptions;
  readonly context: BuildWorkspaceContext;
}

export interface BuildWorkspaceProjectDetails<Type extends Project = Project>
  extends BuildProjectTask<Type> {
  readonly project: Project;
}

// ==================================================================
// DEV
// ==================================================================

export type DevReloadStyle = 'fast' | false;

export interface DevTaskOptions {
  readonly reload?: DevReloadStyle;
  readonly sourceMaps?: boolean;
}

interface DevWorkspaceStepDetails {
  readonly configuration: DevWorkspaceConfigurationHooks;
}

export interface DevWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<DevWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<DevWorkspaceConfigurationHooks>;
  readonly context: WaterfallHook<DevWorkspaceContext>;
  readonly project: SeriesHook<DevWorkspaceProjectDetails>;
  readonly webApp: SeriesHook<DevWorkspaceProjectDetails<WebApp>>;
  readonly package: SeriesHook<DevWorkspaceProjectDetails<Package>>;
  readonly service: SeriesHook<DevWorkspaceProjectDetails<Service>>;
  readonly pre: WaterfallHook<readonly Step[], DevWorkspaceStepDetails>;
  readonly post: WaterfallHook<readonly Step[], DevWorkspaceStepDetails>;
}

export type DevProjectTaskHooks<Type extends Project> = Type extends Package
  ? DevPackageHooks
  : Type extends WebApp
  ? DevWebAppHooks
  : Type extends Service
  ? DevServiceHooks
  : DevPackageHooks | DevWebAppHooks | DevServiceHooks;

export interface DevWorkspaceTask {
  readonly hooks: DevWorkspaceTaskHooks;
  readonly options: DevTaskOptions;
}

export interface DevProjectTask<Type extends Project> {
  readonly hooks: DevProjectTaskHooks<Type>;
  readonly options: DevTaskOptions;
  readonly context: DevWorkspaceContext;
}

export interface DevWorkspaceProjectDetails<Type extends Project = Project>
  extends DevProjectTask<Type> {
  readonly project: Project;
}
