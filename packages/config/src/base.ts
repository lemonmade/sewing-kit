import {
  PluginTarget,
  WorkspacePlugin,
  ProjectPlugin,
  AnyPlugin,
  PLUGIN_MARKER,
} from '@sewing-kit/plugins';
import {DiagnosticError} from '@sewing-kit/ui';

type WritableValue<T> = T extends readonly (infer U)[] ? U[] : T;

type Writable<T> = {
  -readonly [K in keyof T]: WritableValue<T[K]>;
};

export enum ConfigurationKind {
  Workspace = 'Workspace',
  WebApp = 'WebApp',
  Service = 'Service',
  Package = 'Package',
}

export const BUILDER_RESULT_MARKER = Symbol('SewingKit.BuilderResult');

export interface ConfigurationBuilderResult<
  T extends {readonly name: string; readonly root: string} = {
    readonly name: string;
    readonly root: string;
  }
> {
  readonly kind: ConfigurationKind;
  readonly options: Partial<Writable<T>>;
  readonly workspacePlugins: readonly WorkspacePlugin[];
  readonly projectPlugins: readonly ProjectPlugin[];
  readonly [BUILDER_RESULT_MARKER]: true;
}

export class BaseBuilder<
  T extends {readonly name: string; readonly root: string} = {
    readonly name: string;
    readonly root: string;
  }
> {
  protected readonly options: Partial<Writable<T>> = {};
  private readonly workspacePlugins = new Set<WorkspacePlugin>();
  private readonly projectPlugins = new Set<ProjectPlugin>();

  private readonly kind: ConfigurationKind;

  constructor(kind: ConfigurationKind) {
    this.kind = kind;
  }

  root(root: string) {
    this.options.root = root as any;
  }

  name(name: string) {
    this.options.name = name as any;
  }

  plugin(...plugins: AnyPlugin[]) {
    this.plugins(...plugins);
  }

  plugins(...plugins: AnyPlugin[]) {
    for (const plugin of plugins) {
      if (!plugin[PLUGIN_MARKER]) {
        throw new DiagnosticError({
          title: 'Invalid configuration file',
          content: 'The configuration contains invalid plugins',
          suggestion: `Make sure that all plugins included in the configuration file were generated using the utilities from @sewing-kit/plugin. If this is the case, you may have duplicate versions of some @sewing-kit dependencies. Resolve any duplicate versions and try your command again.`,
        });
      }

      if (plugin.target === PluginTarget.Workspace) {
        this.workspacePlugins.add(plugin);
      } else {
        this.projectPlugins.add(plugin);
      }
    }
  }

  toOptions(): ConfigurationBuilderResult<T> {
    return {
      kind: this.kind,
      options: this.options,
      workspacePlugins: [...this.workspacePlugins],
      projectPlugins: [...this.projectPlugins],
      [BUILDER_RESULT_MARKER]: true,
    };
  }
}
