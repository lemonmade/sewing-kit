import {AsyncSeriesHook} from 'tapable';
import {Ui} from '@sewing-kit/ui';

export interface RunnerTasks {
  readonly discovery: AsyncSeriesHook<
    import('./tasks/discovery').DiscoveryTask
  >;
  readonly build: AsyncSeriesHook<import('./tasks/build').BuildTask>;
  readonly dev: AsyncSeriesHook<import('./tasks/dev').DevTask>;
  readonly test: AsyncSeriesHook<import('./tasks/testing').TestTask>;
  readonly lint: AsyncSeriesHook<import('./tasks/lint').LintTask>;
  readonly typeCheck: AsyncSeriesHook<
    import('./tasks/type-check').TypeCheckTask
  >;
}

export interface Runner {
  readonly ui: Ui;
  readonly tasks: RunnerTasks;
}
