type Step = import('@sewing-kit/core').Step;

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

  get hasHooks() {
    return this.hooks.size > 0;
  }

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

  get hasHooks() {
    return this.hooks.size > 0;
  }

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

// PROJECT

export interface BuildProjectConfigurationCustomHooks {}
export interface BuildProjectConfigurationCoreHooks {}
export interface BuildProjectConfigurationHooks
  extends BuildProjectConfigurationCoreHooks,
    Partial<BuildProjectConfigurationCustomHooks> {}

export interface BuildProjectCustomContext {}
export interface BuildProjectCoreContext {}
export interface BuildProjectContext
  extends BuildProjectCoreContext,
    Partial<BuildProjectCustomContext> {}

// PACKAGE

export interface BuildPackageOptions {}

export interface BuildPackageConfigurationCustomHooks
  extends BuildProjectConfigurationCustomHooks {}

export interface BuildPackageConfigurationCoreHooks
  extends BuildProjectConfigurationCoreHooks {}

export interface BuildPackageConfigurationHooks
  extends BuildProjectConfigurationHooks,
    BuildPackageConfigurationCoreHooks,
    Partial<BuildPackageConfigurationCustomHooks> {}

export interface BuildPackageCustomContext extends BuildProjectCustomContext {}

interface BuildPackageCoreContext extends BuildProjectCoreContext {}

export interface BuildPackageContext
  extends BuildPackageCoreContext,
    Partial<BuildPackageCustomContext> {}

export interface BuildPackageVariantHooks {
  readonly configure: SeriesHook<BuildPackageConfigurationHooks>;
  readonly steps: WaterfallHook<
    readonly Step[],
    BuildWebAppConfigurationHooks,
    BuildPackageContext
  >;
}

export interface BuildPackageVariantDetails {
  readonly variant: Partial<BuildPackageOptions>;
  readonly hooks: BuildPackageVariantHooks;
}

export interface BuildPackageHooks {
  readonly variants: WaterfallHook<readonly Partial<BuildPackageOptions>[]>;
  readonly configureHooks: WaterfallHook<BuildPackageConfigurationHooks>;
  readonly configure: SeriesHook<BuildPackageConfigurationHooks>;
  readonly variant: SeriesHook<BuildPackageVariantDetails>;
  readonly context: WaterfallHook<BuildPackageContext>;
  readonly steps: WaterfallHook<
    readonly Step[],
    BuildWebAppConfigurationHooks,
    BuildPackageContext
  >;
}

// SERVICE

export interface BuildServiceOptions {}

export interface BuildServiceConfigurationCustomHooks
  extends BuildProjectConfigurationCustomHooks {}

export interface BuildServiceConfigurationCoreHooks
  extends BuildProjectConfigurationCoreHooks {}

export interface BuildServiceConfigurationHooks
  extends BuildProjectConfigurationHooks,
    BuildServiceConfigurationCoreHooks,
    Partial<BuildServiceConfigurationCustomHooks> {}

export interface BuildServiceCustomContext extends BuildProjectCustomContext {}

interface BuildServiceCoreContext extends BuildProjectCoreContext {}

export interface BuildServiceContext
  extends BuildServiceCoreContext,
    Partial<BuildServiceCustomContext> {}

export interface BuildServiceVariantHooks {
  readonly configure: SeriesHook<BuildServiceConfigurationHooks>;
  readonly steps: WaterfallHook<
    readonly Step[],
    BuildWebAppConfigurationHooks,
    BuildServiceContext
  >;
}

export interface BuildServiceVariantDetails {
  readonly variant: Partial<BuildServiceOptions>;
  readonly hooks: BuildServiceVariantHooks;
}

export interface BuildServiceHooks {
  readonly variants: WaterfallHook<readonly Partial<BuildServiceOptions>[]>;
  readonly configureHooks: WaterfallHook<BuildServiceConfigurationHooks>;
  readonly configure: SeriesHook<BuildServiceConfigurationHooks>;
  readonly context: WaterfallHook<BuildServiceContext>;
  readonly steps: WaterfallHook<
    readonly Step[],
    BuildWebAppConfigurationHooks,
    BuildServiceContext
  >;
  readonly variant: SeriesHook<BuildServiceVariantDetails>;
}

// WEB APP

export interface BuildWebAppOptions {}

export interface BuildWebAppConfigurationCustomHooks
  extends BuildProjectConfigurationCustomHooks {}

export interface BuildWebAppConfigurationCoreHooks
  extends BuildProjectConfigurationCoreHooks {}

export interface BuildWebAppConfigurationHooks
  extends BuildProjectConfigurationHooks,
    BuildWebAppConfigurationCoreHooks,
    Partial<BuildWebAppConfigurationCustomHooks> {}

export interface BuildWebAppCustomContext extends BuildProjectCustomContext {}

interface BuildWebAppCoreContext extends BuildProjectCoreContext {}

export interface BuildWebAppContext
  extends BuildWebAppCoreContext,
    Partial<BuildWebAppCustomContext> {}

export interface BuildWebAppVariantHooks {
  readonly configure: SeriesHook<BuildWebAppConfigurationHooks>;
  readonly steps: WaterfallHook<
    readonly Step[],
    BuildWebAppConfigurationHooks,
    BuildWebAppContext
  >;
}

export interface BuildWebAppVariantDetails {
  readonly variant: Partial<BuildWebAppOptions>;
  readonly hooks: BuildWebAppVariantHooks;
}

export interface BuildWebAppHooks {
  readonly variants: WaterfallHook<readonly Partial<BuildWebAppOptions>[]>;
  readonly configureHooks: WaterfallHook<BuildWebAppConfigurationHooks>;
  readonly configure: SeriesHook<BuildWebAppConfigurationHooks>;
  readonly context: WaterfallHook<BuildWebAppContext>;
  readonly steps: WaterfallHook<
    readonly Step[],
    BuildWebAppConfigurationHooks,
    BuildWebAppContext
  >;
  readonly variant: SeriesHook<BuildWebAppVariantDetails>;
}

// WORKSPACE

export interface BuildWorkspaceConfigurationCustomHooks {}

export interface BuildWorkspaceConfigurationCoreHooks {}

export interface BuildWorkspaceConfigurationHooks
  extends BuildWorkspaceConfigurationCoreHooks,
    Partial<BuildWorkspaceConfigurationCustomHooks> {}

export interface BuildWorkspaceCustomContext {}

export interface BuildWorkspaceCoreContext {
  readonly configuration: BuildWorkspaceConfigurationHooks;
}

export interface BuildWorkspaceContext
  extends BuildWorkspaceCoreContext,
    Partial<BuildWorkspaceCustomContext> {}

// ==================================================================
// DEV
// ==================================================================

// PROJECT

export interface DevProjectConfigurationCustomHooks {}
export interface DevProjectConfigurationCoreHooks {}
export interface DevProjectConfigurationHooks
  extends DevProjectConfigurationCoreHooks,
    Partial<DevProjectConfigurationCustomHooks> {}

export interface DevProjectCustomContext {}
export interface DevProjectCoreContext {}
export interface DevProjectContext
  extends DevProjectCoreContext,
    Partial<DevProjectCustomContext> {}

// PACKAGE

export interface DevPackageConfigurationCustomHooks
  extends DevProjectConfigurationCustomHooks {}
export interface DevPackageConfigurationCoreHooks
  extends DevProjectConfigurationCoreHooks {}
export interface DevPackageConfigurationHooks
  extends DevProjectConfigurationHooks,
    DevPackageConfigurationCoreHooks,
    Partial<DevPackageConfigurationCustomHooks> {}

export interface DevPackageCustomContext extends DevProjectCustomContext {}

interface DevPackageCoreContext extends DevProjectCoreContext {
  readonly configuration: DevPackageConfigurationHooks;
}

export interface DevPackageContext
  extends DevPackageCoreContext,
    Partial<DevPackageCustomContext> {}

export interface DevPackageHooks {
  readonly configureHooks: WaterfallHook<DevPackageConfigurationHooks>;
  readonly configure: SeriesHook<DevPackageConfigurationHooks>;
  readonly context: WaterfallHook<DevPackageContext>;
  readonly steps: WaterfallHook<readonly Step[], DevPackageContext>;
}

// SERVICE

export interface DevServiceConfigurationCustomHooks
  extends DevProjectConfigurationCustomHooks {}

export interface DevServiceConfigurationCoreHooks
  extends DevProjectConfigurationCoreHooks {
  readonly ip: WaterfallHook<string | undefined>;
  readonly port: WaterfallHook<number | undefined>;
}

export interface DevServiceConfigurationHooks
  extends DevProjectConfigurationHooks,
    DevServiceConfigurationCoreHooks,
    Partial<DevServiceConfigurationCustomHooks> {}

export interface DevServiceCustomContext extends DevProjectCustomContext {}

interface DevServiceCoreContext extends DevProjectCoreContext {
  readonly configuration: DevServiceConfigurationHooks;
}

export interface DevServiceContext
  extends DevServiceCoreContext,
    Partial<DevServiceCustomContext> {}

export interface DevServiceHooks {
  readonly configureHooks: WaterfallHook<DevServiceConfigurationHooks>;
  readonly configure: SeriesHook<DevServiceConfigurationHooks>;
  readonly context: WaterfallHook<DevServiceContext>;
  readonly steps: WaterfallHook<readonly Step[], DevServiceContext>;
}

// WEB APP

export interface DevWebAppConfigurationCustomHooks
  extends DevProjectConfigurationCustomHooks {}
export interface DevWebAppConfigurationCoreHooks
  extends DevProjectConfigurationCoreHooks {}
export interface DevWebAppConfigurationHooks
  extends DevProjectConfigurationHooks,
    DevWebAppConfigurationCoreHooks,
    Partial<DevWebAppConfigurationCustomHooks> {}

export interface DevWebAppCustomContext extends DevProjectCustomContext {}

interface DevWebAppCoreContext extends DevProjectCoreContext {
  readonly configuration: DevWebAppConfigurationHooks;
}

export interface DevWebAppContext
  extends DevWebAppCoreContext,
    Partial<DevWebAppCustomContext> {}

export interface DevWebAppHooks {
  readonly configureHooks: WaterfallHook<DevWebAppConfigurationHooks>;
  readonly configure: SeriesHook<DevWebAppConfigurationHooks>;
  readonly context: WaterfallHook<DevWebAppContext>;
  readonly steps: WaterfallHook<readonly Step[], DevWebAppContext>;
}

// WORKSPACE

export interface DevWorkspaceConfigurationCustomHooks {}

export interface DevWorkspaceConfigurationCoreHooks {}

export interface DevWorkspaceConfigurationHooks
  extends DevWorkspaceConfigurationCoreHooks,
    Partial<DevWorkspaceConfigurationCustomHooks> {}

export interface DevWorkspaceCustomContext {}

export interface DevWorkspaceCoreContext {
  readonly configuration: DevWorkspaceConfigurationHooks;
}

export interface DevWorkspaceContext
  extends DevWorkspaceCoreContext,
    Partial<DevWorkspaceCustomContext> {}

// ==================================================================
// LINT
// ==================================================================

// WORKSPACE

export interface LintWorkspaceConfigurationCustomHooks {}
export interface LintWorkspaceConfigurationCoreHooks {}

export interface LintWorkspaceConfigurationHooks
  extends LintWorkspaceConfigurationCoreHooks,
    Partial<LintWorkspaceConfigurationCustomHooks> {}

export interface LintWorkspaceCustomContext {}

interface LintWorkspaceCoreContext {
  readonly configuration: LintWorkspaceConfigurationHooks;
}

export interface LintWorkspaceContext
  extends LintWorkspaceCoreContext,
    Partial<LintWorkspaceCustomContext> {}

// ==================================================================
// TEST
// ==================================================================

// PROJECT

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

export interface TestWorkspaceCustomContext {}

interface TestWorkspaceCoreContext {
  readonly configuration: TestWorkspaceConfigurationHooks;
}

export interface TestWorkspaceContext
  extends TestWorkspaceCoreContext,
    Partial<TestWorkspaceCustomContext> {}

// ==================================================================
// TYPE CHECK
// ==================================================================

// WORKSPACE

export interface TypeCheckWorkspaceConfigurationCustomHooks {}
export interface TypeCheckWorkspaceConfigurationCoreHooks {}

export interface TypeCheckWorkspaceConfigurationHooks
  extends TypeCheckWorkspaceConfigurationCoreHooks,
    Partial<TypeCheckWorkspaceConfigurationCustomHooks> {}

export interface TypeCheckWorkspaceCustomContext {}

interface TypeCheckWorkspaceCoreContext {
  readonly configuration: TypeCheckWorkspaceConfigurationHooks;
}

export interface TypeCheckWorkspaceContext
  extends TypeCheckWorkspaceCoreContext,
    Partial<TypeCheckWorkspaceCustomContext> {}
