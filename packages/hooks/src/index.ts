import {AsyncSeriesHook, AsyncSeriesWaterfallHook} from 'tapable';
import {Step} from '@sewing-kit/ui';

// ==================================================================
// BUILD
// ==================================================================

// PACKAGE

export interface BuildPackageOptions {}

export interface BuildPackageConfigurationCustomHooks {}

export interface BuildPackageConfigurationCoreHooks {}

export interface BuildPackageConfigurationHooks
  extends BuildPackageConfigurationCoreHooks,
    Partial<BuildPackageConfigurationCustomHooks> {}

export interface BuildPackageStepContext {}

export interface BuildPackageStepDetails {
  readonly variant: Partial<BuildPackageOptions>;
  readonly config: BuildPackageConfigurationHooks;
}

export interface BuildPackageHooks {
  readonly variants: AsyncSeriesWaterfallHook<
    readonly Partial<BuildPackageOptions>[]
  >;

  readonly configure: AsyncSeriesHook<
    BuildPackageConfigurationHooks,
    Partial<BuildPackageOptions>
  >;

  readonly context: AsyncSeriesWaterfallHook<Partial<BuildPackageStepContext>>;

  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    BuildPackageStepDetails,
    Partial<BuildPackageStepContext>
  >;
}

// SERVICE

export interface BuildServiceConfigurationCustomHooks {}

export interface BuildServiceConfigurationCoreHooks {}

export interface BuildServiceConfigurationHooks
  extends BuildServiceConfigurationCoreHooks,
    Partial<BuildServiceConfigurationCustomHooks> {}

export interface BuildServiceStepContext {}

export interface BuildServiceStepDetails {
  readonly config: BuildServiceConfigurationHooks;
}

export interface BuildServiceHooks {
  readonly configure: AsyncSeriesHook<BuildServiceConfigurationHooks>;

  readonly context: AsyncSeriesWaterfallHook<Partial<BuildServiceStepContext>>;

  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    BuildServiceStepDetails,
    Partial<BuildServiceStepContext>
  >;
}

// WEB APP

export interface BuildWebAppOptions {}

export interface BuildWebAppConfigurationCoreHooks {}

export interface BuildWebAppConfigurationCustomHooks {}

export interface BuildWebAppConfigurationHooks
  extends BuildWebAppConfigurationCoreHooks,
    Partial<BuildWebAppConfigurationCustomHooks> {}

export interface BuildWebAppStepContext {}

export interface BuildWebAppStepDetails {
  readonly variant: Partial<BuildWebAppOptions>;
  readonly config: BuildWebAppConfigurationHooks;
}

export interface BuildWebAppHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<BuildWebAppOptions>[]>;

  readonly configure: AsyncSeriesHook<
    BuildWebAppConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;

  readonly context: AsyncSeriesWaterfallHook<Partial<BuildWebAppStepContext>>;

  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    BuildWebAppStepDetails,
    Partial<BuildWebAppStepContext>
  >;
}

// WORKSPACE

export interface BuildWorkspaceConfigurationCustomHooks {}

export interface BuildWorkspaceConfigurationCoreHooks {}

export interface BuildWorkspaceConfigurationHooks
  extends BuildWorkspaceConfigurationCoreHooks,
    Partial<BuildWorkspaceConfigurationCustomHooks> {}

// ==================================================================
// DEV
// ==================================================================

// PACKAGE

export interface DevPackageConfigurationCustomHooks {}
export interface DevPackageConfigurationCoreHooks {}
export interface DevPackageConfigurationHooks
  extends DevPackageConfigurationCoreHooks,
    Partial<DevPackageConfigurationCustomHooks> {}

export interface DevPackageStepDetails {
  readonly config: DevPackageConfigurationHooks;
}

export interface DevPackageStepContext {}

export interface DevPackageHooks {
  readonly configure: AsyncSeriesHook<DevPackageConfigurationHooks>;
  readonly context: AsyncSeriesWaterfallHook<Partial<DevPackageStepContext>>;
  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    DevPackageStepDetails,
    Partial<DevPackageStepContext>
  >;
}

// SERVICE

export interface DevServiceConfigurationCustomHooks {}

export interface DevServiceConfigurationCoreHooks {
  readonly ip: AsyncSeriesWaterfallHook<string | undefined>;
  readonly port: AsyncSeriesWaterfallHook<number | undefined>;
}

export interface DevServiceConfigurationHooks
  extends DevServiceConfigurationCoreHooks,
    Partial<DevServiceConfigurationCustomHooks> {}

export interface DevServiceStepDetails {
  readonly config: DevServiceConfigurationHooks;
}

export interface DevServiceStepContext {}

export interface DevServiceHooks {
  readonly configure: AsyncSeriesHook<DevServiceConfigurationHooks>;
  readonly context: AsyncSeriesWaterfallHook<Partial<DevServiceStepContext>>;
  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    DevServiceStepDetails,
    Partial<DevServiceStepContext>
  >;
}

// WEB APP

export interface DevWebAppConfigurationCoreHooks {}
export interface DevWebAppConfigurationCustomHooks {}
export interface DevWebAppConfigurationHooks
  extends DevWebAppConfigurationCoreHooks,
    Partial<DevWebAppConfigurationCustomHooks> {}

export interface DevWebAppStepDetails {
  readonly config: DevWebAppConfigurationHooks;
}

export interface DevWebAppStepContext {}

export interface DevWebAppHooks {
  readonly configure: AsyncSeriesHook<DevWebAppConfigurationHooks>;
  readonly context: AsyncSeriesWaterfallHook<Partial<DevWebAppStepContext>>;
  readonly steps: AsyncSeriesWaterfallHook<
    Step[],
    DevWebAppStepDetails,
    Partial<DevWebAppStepContext>
  >;
}

// WORKSPACE

export interface DevWorkspaceConfigurationCustomHooks {}

export interface DevWorkspaceConfigurationCoreHooks {}

export interface DevWorkspaceConfigurationHooks
  extends DevWorkspaceConfigurationCoreHooks,
    Partial<DevWorkspaceConfigurationCustomHooks> {}

// ==================================================================
// LINT
// ==================================================================

// TASK

export interface LintWorkspaceConfigurationCustomHooks {}
export interface LintWorkspaceConfigurationCoreHooks {}

export interface LintWorkspaceConfigurationHooks
  extends LintWorkspaceConfigurationCoreHooks,
    Partial<LintWorkspaceConfigurationCustomHooks> {}

// ==================================================================
// TEST
// ==================================================================

// PROJECT

export interface TestProjectCustomWorkspaceContext {}

interface TestProjectCoreWorkspaceContext {}

export interface TestProjectWorkspaceContext
  extends TestProjectCoreWorkspaceContext,
    Partial<TestProjectCustomWorkspaceContext> {}

export interface TestProjectConfigurationCustomHooks {}

interface TestProjectConfigurationCoreHooks {}

export interface TestProjectConfigurationHooks
  extends TestProjectConfigurationCoreHooks,
    Partial<TestProjectConfigurationCustomHooks> {}

// WEB APP

export interface TestWebAppConfigurationCustomHooks {}

interface TestWebAppConfigurationCoreHooks {}

export interface TestWebAppConfigurationHooks
  extends TestProjectConfigurationHooks,
    TestWebAppConfigurationCoreHooks,
    Partial<TestWebAppConfigurationCoreHooks> {}

export interface TestWebAppHooks {
  readonly configure: AsyncSeriesHook<TestWebAppConfigurationHooks>;
}

// PACKAGE

export interface TestPackageConfigurationCustomHooks {}

interface TestPackageConfigurationCoreHooks {}

export interface TestPackageConfigurationHooks
  extends TestProjectConfigurationHooks,
    TestPackageConfigurationCoreHooks,
    Partial<TestPackageConfigurationCoreHooks> {}

export interface TestPackageHooks {
  readonly configure: AsyncSeriesHook<TestPackageConfigurationHooks>;
}

// WORKSPACE

export interface TestWorkspaceConfigurationCustomHooks {}

interface TestWorkspaceConfigurationCoreHooks {}

export interface TestWorkspaceConfigurationHooks
  extends TestWorkspaceConfigurationCoreHooks,
    Partial<TestWorkspaceConfigurationCustomHooks> {}

// ==================================================================
// TYPE CHECK
// ==================================================================

// WORKSPACE

export interface TypeCheckWorkspaceConfigurationCustomHooks {}
export interface TypeCheckWorkspaceConfigurationCoreHooks {}

export interface TypeCheckWorkspaceConfigurationHooks
  extends TypeCheckWorkspaceConfigurationCoreHooks,
    Partial<TypeCheckWorkspaceConfigurationCustomHooks> {}
