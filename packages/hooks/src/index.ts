type Step = import('@sewing-kit/ui').Step;

// ==================================================================
// PRIMITIVES
// ==================================================================

export const UNSET = Symbol('SewingKit.Hooks.Unset');
type Unset = typeof UNSET;

export type SeriesHookArguments<
  First = Unset,
  Second = Unset,
  Third = Unset
> = First extends Unset
  ? []
  : Second extends Unset
  ? [First]
  : Third extends Unset
  ? [First, Second]
  : [First, Second, Third];

export type SeriesHookFunction<First, Second, Third> = (
  ...args: SeriesHookArguments<First, Second, Third>
) => void | Promise<void>;

export class SeriesHook<First = Unset, Second = Unset, Third = Unset> {
  private hooks = new Set<SeriesHookFunction<First, Second, Third>>();

  hook(
    idOrHook: string | SeriesHookFunction<First, Second, Third>,
    maybeHook?: SeriesHookFunction<First, Second, Third>,
  ) {
    if (typeof idOrHook === 'function') {
      this.hooks.add(idOrHook);
    } else if (maybeHook != null) {
      this.hooks.add(maybeHook);
    }

    return this;
  }

  async run(...args: SeriesHookArguments<First, Second, Third>) {
    for (const hook of [...this.hooks]) {
      await hook(...args);
    }
  }
}

export type WaterfallHookArguments<
  Value,
  First = Unset,
  Second = Unset,
  Third = Unset
> = First extends Unset
  ? [Value]
  : Second extends Unset
  ? [Value, First]
  : Third extends Unset
  ? [Value, First, Second]
  : [Value, First, Second, Third];

export type WaterfallHookFunction<Value, First, Second, Third> = (
  ...args: WaterfallHookArguments<Value, First, Second, Third>
) => Value | Promise<Value>;

export class WaterfallHook<
  Value,
  First = Unset,
  Second = Unset,
  Third = Unset
> {
  private hooks = new Set<WaterfallHookFunction<Value, First, Second, Third>>();

  // ID is automatically being passed in, but we just aren’t using it for anything
  hook(
    idOrHook: string | WaterfallHookFunction<Value, First, Second, Third>,
    maybeHook?: WaterfallHookFunction<Value, First, Second, Third>,
  ) {
    if (typeof idOrHook === 'function') {
      this.hooks.add(idOrHook);
    } else if (maybeHook != null) {
      this.hooks.add(maybeHook);
    }

    return this;
  }

  async run(...args: WaterfallHookArguments<Value, First, Second, Third>) {
    const [initialValue, ...extraArgs] = args;

    let currentValue = initialValue;

    for (const hook of [...this.hooks]) {
      currentValue = await (hook as any)(currentValue, ...extraArgs);
    }

    return currentValue;
  }
}

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

export interface BuildPackageStepCustomContext {}

interface BuildPackageStepCoreContext {
  readonly variant: Partial<BuildPackageOptions>;
  readonly configuration: BuildPackageConfigurationHooks;
}

export interface BuildPackageStepContext
  extends BuildPackageStepCoreContext,
    Partial<BuildPackageStepCustomContext> {}

export interface BuildPackageHooks {
  readonly variants: WaterfallHook<readonly Partial<BuildPackageOptions>[]>;
  readonly configureHooks: WaterfallHook<BuildPackageConfigurationHooks>;
  readonly configure: SeriesHook<
    BuildPackageConfigurationHooks,
    Partial<BuildPackageOptions>
  >;
  readonly context: WaterfallHook<BuildPackageStepContext>;
  readonly steps: WaterfallHook<readonly Step[], BuildPackageStepContext>;
}

// SERVICE

export interface BuildServiceConfigurationCustomHooks {}

export interface BuildServiceConfigurationCoreHooks {}

export interface BuildServiceConfigurationHooks
  extends BuildServiceConfigurationCoreHooks,
    Partial<BuildServiceConfigurationCustomHooks> {}

export interface BuildServiceStepCustomContext {}

interface BuildServiceStepCoreContext {
  readonly configuration: BuildServiceConfigurationHooks;
}

export interface BuildServiceStepContext
  extends BuildServiceStepCoreContext,
    Partial<BuildServiceStepCustomContext> {}

export interface BuildServiceHooks {
  readonly configureHooks: WaterfallHook<BuildServiceConfigurationHooks>;
  readonly configure: SeriesHook<BuildServiceConfigurationHooks>;
  readonly context: WaterfallHook<BuildServiceStepContext>;
  readonly steps: WaterfallHook<readonly Step[], BuildServiceStepContext>;
}

// WEB APP

export interface BuildWebAppOptions {}

export interface BuildWebAppConfigurationCoreHooks {}

export interface BuildWebAppConfigurationCustomHooks {}

export interface BuildWebAppConfigurationHooks
  extends BuildWebAppConfigurationCoreHooks,
    Partial<BuildWebAppConfigurationCustomHooks> {}

export interface BuildWebAppStepCustomContext {}

interface BuildWebAppStepCoreContext {
  readonly variant: Partial<BuildWebAppOptions>;
  readonly configuration: BuildWebAppConfigurationHooks;
}

export interface BuildWebAppStepContext
  extends BuildWebAppStepCoreContext,
    Partial<BuildWebAppStepCustomContext> {}

export interface BuildWebAppHooks {
  readonly variants: WaterfallHook<Partial<BuildWebAppOptions>[]>;
  readonly configureHooks: WaterfallHook<BuildWebAppConfigurationHooks>;
  readonly configure: SeriesHook<
    BuildWebAppConfigurationHooks,
    Partial<BuildWebAppOptions>
  >;
  readonly context: WaterfallHook<BuildWebAppStepContext>;
  readonly steps: WaterfallHook<readonly Step[], BuildWebAppStepContext>;
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

export interface DevPackageStepCustomContext {}

interface DevPackageStepCoreContext {
  readonly configuration: DevPackageConfigurationHooks;
}

export interface DevPackageStepContext
  extends DevPackageStepCoreContext,
    Partial<DevPackageStepCustomContext> {}

export interface DevPackageHooks {
  readonly configureHooks: WaterfallHook<DevPackageConfigurationHooks>;
  readonly configure: SeriesHook<DevPackageConfigurationHooks>;
  readonly context: WaterfallHook<DevPackageStepContext>;
  readonly steps: WaterfallHook<Step[], DevPackageStepContext>;
}

// SERVICE

export interface DevServiceConfigurationCustomHooks {}

export interface DevServiceConfigurationCoreHooks {
  readonly ip: WaterfallHook<string | undefined>;
  readonly port: WaterfallHook<number | undefined>;
}

export interface DevServiceConfigurationHooks
  extends DevServiceConfigurationCoreHooks,
    Partial<DevServiceConfigurationCustomHooks> {}

export interface DevServiceStepCustomContext {}

interface DevServiceStepCoreContext {
  readonly configuration: DevServiceConfigurationHooks;
}

export interface DevServiceStepContext
  extends DevServiceStepCoreContext,
    Partial<DevServiceStepCustomContext> {}

export interface DevServiceHooks {
  readonly configureHooks: WaterfallHook<DevServiceConfigurationHooks>;
  readonly configure: SeriesHook<DevServiceConfigurationHooks>;
  readonly context: WaterfallHook<DevServiceStepContext>;
  readonly steps: WaterfallHook<readonly Step[], DevServiceStepContext>;
}

// WEB APP

export interface DevWebAppConfigurationCoreHooks {}
export interface DevWebAppConfigurationCustomHooks {}
export interface DevWebAppConfigurationHooks
  extends DevWebAppConfigurationCoreHooks,
    Partial<DevWebAppConfigurationCustomHooks> {}

export interface DevWebAppStepCustomContext {}

interface DevWebAppStepCoreContext {
  readonly configuration: DevWebAppConfigurationHooks;
}

export interface DevWebAppStepContext
  extends DevWebAppStepCoreContext,
    Partial<DevWebAppStepCustomContext> {}

export interface DevWebAppHooks {
  readonly configureHooks: WaterfallHook<DevWebAppConfigurationHooks>;
  readonly configure: SeriesHook<DevWebAppConfigurationHooks>;
  readonly context: WaterfallHook<DevWebAppStepContext>;
  readonly steps: WaterfallHook<Step[], DevWebAppStepContext>;
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

interface TestProjectCoreWorkspaceContext {
  readonly configuration: TestWorkspaceConfigurationHooks;
}

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
    Partial<TestWebAppConfigurationCustomHooks> {}

export interface TestWebAppHooks {
  readonly configureHooks: WaterfallHook<TestWebAppConfigurationHooks>;
  readonly configure: SeriesHook<TestWebAppConfigurationHooks>;
}

// SERVICE

export interface TestServiceConfigurationCustomHooks {}

interface TestServiceConfigurationCoreHooks {}

export interface TestServiceConfigurationHooks
  extends TestProjectConfigurationHooks,
    TestServiceConfigurationCoreHooks,
    Partial<TestServiceConfigurationCoreHooks> {}

export interface TestServiceHooks {
  readonly configureHooks: WaterfallHook<TestServiceConfigurationHooks>;
  readonly configure: SeriesHook<TestServiceConfigurationHooks>;
}

// PACKAGE

export interface TestPackageConfigurationCustomHooks {}

interface TestPackageConfigurationCoreHooks {}

export interface TestPackageConfigurationHooks
  extends TestProjectConfigurationHooks,
    TestPackageConfigurationCoreHooks,
    Partial<TestPackageConfigurationCoreHooks> {}

export interface TestPackageHooks {
  readonly configureHooks: WaterfallHook<TestPackageConfigurationHooks>;
  readonly configure: SeriesHook<TestPackageConfigurationHooks>;
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
