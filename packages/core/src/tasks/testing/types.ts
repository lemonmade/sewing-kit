import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Step,
  TestRootConfigurationHooks,
  TestPackageHooks,
  TestWebAppHooks,
} from '@sewing-kit/types';
import {Package, Workspace, WebApp} from '../../workspace';

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

interface TestStepDetails {
  configuration: TestRootConfigurationHooks;
}

export type TestProjectDetails =
  | {
      project: Package;
      hooks: TestPackageHooks;
    }
  | {project: WebApp; hooks: TestWebAppHooks};

export interface TestTaskHooks {
  readonly project: AsyncSeriesHook<TestProjectDetails>;
  readonly package: AsyncSeriesHook<{
    pkg: Package;
    hooks: TestPackageHooks;
  }>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: TestWebAppHooks}>;

  readonly configure: AsyncSeriesHook<TestRootConfigurationHooks>;

  readonly pre: AsyncSeriesWaterfallHook<Step[], TestStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], TestStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], TestStepDetails>;
}

export interface TestTask {
  readonly hooks: TestTaskHooks;
  readonly workspace: Workspace;
  readonly options: TestTaskOptions;
}
