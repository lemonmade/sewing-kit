import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {
  Step,
  DevRootConfigurationHooks,
  DevWebAppHooks,
  DevPackageHooks,
  DevServiceHooks,
} from '@sewing-kit/types';

import {Package, WebApp, Service, Workspace} from '../../workspace';

export interface DevTaskOptions {
  readonly sourceMaps?: boolean;
  readonly skip?: string[];
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface DevStepDetails {
  readonly configuration: DevRootConfigurationHooks;
}

export type DevProjectDetails =
  | {
      project: WebApp;
      hooks: DevWebAppHooks;
    }
  | {project: Service; hooks: DevServiceHooks}
  | {project: Package; hooks: DevPackageHooks};

export interface DevTaskHooks {
  readonly configure: AsyncSeriesHook<DevRootConfigurationHooks>;

  readonly project: AsyncSeriesHook<DevProjectDetails>;
  readonly package: AsyncSeriesHook<{pkg: Package; hooks: DevPackageHooks}>;
  readonly webApp: AsyncSeriesHook<{webApp: WebApp; hooks: DevWebAppHooks}>;
  readonly service: AsyncSeriesHook<{service: Service; hooks: DevServiceHooks}>;

  readonly pre: AsyncSeriesWaterfallHook<Step[], DevStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], DevStepDetails>;
}

export interface DevTask {
  readonly hooks: DevTaskHooks;
  readonly options: DevTaskOptions;
  readonly workspace: Workspace;
}
