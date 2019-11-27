import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Env,
  Step,
  BuildRootConfigurationHooks,
  BuildWebAppHooks,
  BuildPackageHooks,
  BuildServiceHooks,
} from '@sewing-kit/types';

import {Package, WebApp, Workspace, Service} from '../../workspace';

export interface BuildTaskOptions {
  readonly env: Env;
  readonly simulateEnv: Env;
  readonly sourceMaps?: boolean;
  readonly skip?: string[];
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface BuildStepDetails {
  readonly configuration: BuildRootConfigurationHooks;
}

export interface BuildWebAppDetails {
  webApp: WebApp;
  hooks: BuildWebAppHooks;
}

export interface BuildPackageDetails {
  pkg: Package;
  hooks: BuildPackageHooks;
}

export interface BuildServiceDetails {
  service: Service;
  hooks: BuildServiceHooks;
}

export type BuildProjectDetails =
  | {
      project: WebApp;
      hooks: BuildWebAppHooks;
    }
  | {project: Package; hooks: BuildPackageHooks}
  | {project: Service; hooks: BuildServiceHooks};

export interface BuildTaskHooks {
  readonly configure: AsyncSeriesHook<BuildRootConfigurationHooks>;

  readonly project: AsyncSeriesHook<BuildProjectDetails>;
  readonly package: AsyncSeriesHook<BuildPackageDetails>;
  readonly webApp: AsyncSeriesHook<BuildWebAppDetails>;
  readonly service: AsyncSeriesHook<BuildServiceDetails>;

  readonly pre: AsyncSeriesWaterfallHook<Step[], BuildStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], BuildStepDetails>;
}

export interface BuildTask {
  readonly hooks: BuildTaskHooks;
  readonly options: BuildTaskOptions;
  readonly workspace: Workspace;
}
