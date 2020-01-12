import {
  SeriesHook,
  WaterfallHook,
  TypeCheckWorkspaceConfigurationHooks,
  TestWorkspaceConfigurationHooks,
  TestPackageHooks,
  TestWebAppHooks,
  TestServiceHooks,
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

interface TypeCheckWorkspaceStepDetails {
  readonly configuration: TypeCheckWorkspaceConfigurationHooks;
}

export interface TypeCheckWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<TypeCheckWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<TypeCheckWorkspaceConfigurationHooks>;
  readonly pre: WaterfallHook<readonly Step[], TypeCheckWorkspaceStepDetails>;
  readonly steps: WaterfallHook<readonly Step[], TypeCheckWorkspaceStepDetails>;
  readonly post: WaterfallHook<readonly Step[], TypeCheckWorkspaceStepDetails>;
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

interface LintWorkspaceStepDetails {
  readonly configuration: LintWorkspaceConfigurationHooks;
}

export interface LintWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<LintWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<LintWorkspaceConfigurationHooks>;
  readonly pre: WaterfallHook<Step[], LintWorkspaceStepDetails>;
  readonly steps: WaterfallHook<Step[], LintWorkspaceStepDetails>;
  readonly post: WaterfallHook<Step[], LintWorkspaceStepDetails>;
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
  readonly pre: WaterfallHook<Step[], TestProjectWorkspaceContext>;
  readonly post: WaterfallHook<Step[], TestProjectWorkspaceContext>;
  readonly steps: WaterfallHook<Step[], TestProjectWorkspaceContext>;
  readonly configure: SeriesHook<TestWorkspaceConfigurationHooks>;
  readonly configureHooks: WaterfallHook<TestWorkspaceConfigurationHooks>;
  readonly context: WaterfallHook<TestProjectWorkspaceContext>;
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
  readonly context: TestProjectWorkspaceContext;
  readonly options: TestTaskOptions;
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

interface BuildStepContext {
  readonly configuration: BuildWorkspaceConfigurationHooks;
}

export interface BuildWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<BuildWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<BuildWorkspaceConfigurationHooks>;
  readonly pre: WaterfallHook<readonly Step[], BuildStepContext>;
  readonly post: WaterfallHook<readonly Step[], BuildStepContext>;
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
}

// ==================================================================
// DEV
// ==================================================================

export interface DevTaskOptions {
  readonly sourceMaps?: boolean;
}

interface DevWorkspaceStepDetails {
  readonly configuration: DevWorkspaceConfigurationHooks;
}

export interface DevWorkspaceTaskHooks {
  readonly configureHooks: WaterfallHook<DevWorkspaceConfigurationHooks>;
  readonly configure: SeriesHook<DevWorkspaceConfigurationHooks>;
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
}
