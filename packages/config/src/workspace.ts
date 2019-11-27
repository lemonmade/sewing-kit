import {Plugin, PluginTarget} from '@sewing-kit/types';
import {DiagnosticError} from '@sewing-kit/ui';

interface WorkspaceCreateOptions {
  plugins: Plugin[];
}

class WorkspaceCreator {
  constructor(private readonly builder: Partial<WorkspaceCreateOptions>) {}

  plugin(...plugins: Plugin[]) {
    const nonRootPlugins = plugins.filter(
      (plugin) => plugin.target !== PluginTarget.Root,
    );

    if (nonRootPlugins.length > 0) {
      throw new DiagnosticError({
        title: 'Invalid configuration file',
        content: `You attempted to add plugins to the workspace that are targetted at individual projects. Only root plugins are allowed when creating configuration with createWorkspace().`,
        suggestion: `If you have only a single package, app, or service in your project, change your sewing-kit.config file to use createPackage, createWebApp, or createService instead. If you are trying to add plugins that target an individual project in the workspace, move the project plugins to their sewing-kit.config files instead. (offending plugin${
          nonRootPlugins.length > 1 ? 's' : ''
        }: ${nonRootPlugins.map(({id}) => id).join(',')})`,
      });
    }

    this.builder.plugins = this.builder.plugins || [];
    this.builder.plugins.push(...plugins);
  }
}

export function createWorkspace(
  create: (pkg: WorkspaceCreator) => void | Promise<void>,
) {
  return async (): Promise<Partial<WorkspaceCreateOptions>> => {
    const options = {};
    const creator = new WorkspaceCreator(options);
    await create(creator);
    return options;
  };
}
