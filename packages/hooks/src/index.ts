import {AsyncSeriesHook, AsyncSeriesWaterfallHook} from 'tapable';
import {Step} from '@sewing-kit/ui';

// ==================================================================
// BUILD
// ==================================================================

// PACKAGE

export interface BuildPackageOptions {}

export interface BuildPackageConfigurationCustomHooks {}

export interface BuildPackageConfigurationCoreHooks {
  readonly extensions: AsyncSeriesWaterfallHook<readonly string[]>;
}

export interface BuildPackageConfigurationHooks
  extends BuildPackageConfigurationCoreHooks,
    Partial<BuildPackageConfigurationCustomHooks> {}

export interface BuildPackageHooks {
  readonly variants: AsyncSeriesWaterfallHook<
    readonly Partial<BuildPackageOptions>[]
  >;

  readonly configure: AsyncSeriesHook<
    BuildPackageConfigurationHooks,
    Partial<BuildPackageOptions>
  >;

  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    {
      readonly variant: Partial<BuildPackageOptions>;
      readonly config: BuildPackageConfigurationHooks;
    }
  >;
}

// SERVICE

export interface BuildServiceConfigurationCustomHooks {}

export interface BuildServiceConfigurationCoreHooks {
  readonly output: AsyncSeriesWaterfallHook<string>;
  readonly entries: AsyncSeriesWaterfallHook<readonly string[]>;
  readonly extensions: AsyncSeriesWaterfallHook<readonly string[]>;
  readonly filename: AsyncSeriesWaterfallHook<string>;
}

export interface BuildServiceConfigurationHooks
  extends BuildServiceConfigurationCoreHooks,
    Partial<BuildServiceConfigurationCustomHooks> {}

export interface BuildServiceHooks {
  readonly configure: AsyncSeriesHook<BuildServiceConfigurationHooks>;

  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    {
      readonly config: BuildServiceConfigurationHooks;
    }
  >;
}

// WEB APP

export interface BuildWebAppOptions {}

export interface BuildBrowserConfigurationCoreHooks {
  readonly output: AsyncSeriesWaterfallHook<string>;
  readonly entries: AsyncSeriesWaterfallHook<readonly string[]>;
  readonly extensions: AsyncSeriesWaterfallHook<readonly string[]>;
  readonly filename: AsyncSeriesWaterfallHook<string>;
}

export interface BuildBrowserConfigurationCustomHooks {}

export interface BuildBrowserConfigurationHooks
  extends BuildBrowserConfigurationCoreHooks,
    Partial<BuildBrowserConfigurationCustomHooks> {}

export interface BuildServiceWorkerConfigurationCoreHooks
  extends BuildBrowserConfigurationCoreHooks {}

export interface BuildServiceWorkerConfigurationCustomHooks
  extends BuildBrowserConfigurationCustomHooks {}

export interface BuildServiceWorkerConfigurationHooks
  extends BuildServiceWorkerConfigurationCoreHooks,
    Partial<BuildServiceWorkerConfigurationCustomHooks> {}

export interface BuildWebAppHooks {
  readonly variants: AsyncSeriesWaterfallHook<Partial<BuildWebAppOptions>[]>;

  readonly configure: AsyncSeriesHook<
    BuildBrowserConfigurationHooks | BuildServiceWorkerConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;
  readonly configureBrowser: AsyncSeriesHook<
    BuildBrowserConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;
  readonly configureServiceWorker: AsyncSeriesHook<
    BuildBrowserConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;

  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    {
      readonly variant: Partial<BuildWebAppOptions>;
      readonly browserConfig: BuildBrowserConfigurationHooks;
      readonly serviceWorkerConfig: BuildServiceWorkerConfigurationHooks;
    }
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

export interface DevPackageStepCustomDetails {}
export interface DevPackageStepCoreDetails {
  readonly config: DevPackageConfigurationHooks;
  readonly buildConfig: BuildPackageConfigurationHooks;
}

export interface DevPackageStepDetails
  extends DevPackageStepCoreDetails,
    Partial<DevPackageStepCustomDetails> {}

export interface DevPackageHooks {
  readonly configure: AsyncSeriesHook<DevPackageConfigurationHooks>;
  readonly details: AsyncSeriesHook<DevPackageStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], DevPackageStepDetails>;
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

export interface DevServiceStepCustomDetails {}
export interface DevServiceStepCoreDetails {
  readonly config: DevServiceConfigurationHooks;
  readonly buildConfig: BuildServiceConfigurationHooks;
}

export interface DevServiceStepDetails
  extends DevServiceStepCoreDetails,
    Partial<DevServiceStepCustomDetails> {}

export interface DevServiceHooks {
  readonly configure: AsyncSeriesHook<DevServiceConfigurationHooks>;
  readonly details: AsyncSeriesHook<DevServiceStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<
    readonly Step[],
    DevServiceStepDetails
  >;
}

// WEB APP

export interface DevWebAppConfigurationCoreHooks {}
export interface DevWebAppConfigurationCustomHooks {}
export interface DevWebAppConfigurationHooks
  extends DevWebAppConfigurationCoreHooks,
    Partial<DevWebAppConfigurationCustomHooks> {}

export interface DevWebAppStepCustomDetails {}
export interface DevWebAppStepCoreDetails {
  readonly config: DevWebAppConfigurationHooks;
  readonly buildBrowserConfig: BuildBrowserConfigurationHooks;
  readonly buildServiceWorkerConfig: BuildServiceWorkerConfigurationHooks;
}

export interface DevWebAppStepDetails
  extends DevWebAppStepCoreDetails,
    Partial<DevWebAppStepCustomDetails> {}

export interface DevWebAppHooks {
  readonly configure: AsyncSeriesHook<DevWebAppConfigurationHooks>;
  readonly details: AsyncSeriesHook<DevWebAppStepDetails>;
  readonly steps: AsyncSeriesWaterfallHook<Step[], DevWebAppStepDetails>;
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
