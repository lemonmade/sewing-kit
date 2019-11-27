import {AsyncSeriesWaterfallHook, AsyncSeriesHook} from 'tapable';
import {Step, TypeCheckRootConfigurationHooks} from '@sewing-kit/types';
import {Workspace} from '../../workspace';

export interface TypeCheckOptions {
  readonly watch?: boolean;
  readonly skip?: string[];
  readonly skipPre?: string[];
  readonly skipPost?: string[];
}

interface TypeCheckStepDetails {
  readonly configuration: TypeCheckRootConfigurationHooks;
}

export interface TypeCheckTaskHooks {
  readonly configure: AsyncSeriesHook<TypeCheckRootConfigurationHooks>;
  readonly pre: AsyncSeriesWaterfallHook<Step[], TypeCheckStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], TypeCheckStepDetails>;
  readonly post: AsyncSeriesWaterfallHook<Step[], TypeCheckStepDetails>;
}

export interface TypeCheckTask {
  readonly hooks: TypeCheckTaskHooks;
  readonly options: TypeCheckOptions;
  readonly workspace: Workspace;
}
