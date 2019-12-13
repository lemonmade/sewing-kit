import {basename} from 'path';
import {Readable, Writable} from 'stream';
import arg, {Result} from 'arg';
import {sync as glob} from 'glob';

import {LogLevel} from '@sewing-kit/ui';
import {loadConfig, ConfigurationKind} from '@sewing-kit/config/load';
import {ProjectPlugin} from '@sewing-kit/plugins';
import {SewingKitDelegate} from '@sewing-kit/core';
import {Package, Service, WebApp, Workspace, Project} from '@sewing-kit/model';

export function createCommand<Flags extends {[key: string]: any}>(
  flagSpec: Flags,
  run: (
    flags: Result<Flags>,
    context: import('@sewing-kit/core').TaskContext,
  ) => Promise<void>,
) {
  return async (
    argv: string[],
    {
      __internal: internalOptions = {},
    }: {
      __internal?: {
        stdin?: Readable;
        stdout?: Writable;
        stderr?: Writable;
      };
    } = {},
  ) => {
    const {Ui, DiagnosticError} = await import('@sewing-kit/ui');

    const {
      '--root': root = process.cwd(),
      '--log-level': logLevel,
      ...flags
    } = arg({...flagSpec, '--root': String, '--log-level': String}, {argv});

    const ui = new Ui({
      ...(internalOptions as any),
      level: mapLogLevel(logLevel as any),
    });

    try {
      const packages = new Set<Package>();
      const webApps = new Set<WebApp>();
      const services = new Set<Service>();
      const pluginMap = new WeakMap<Project, readonly ProjectPlugin[]>();

      const configFiles = glob('**/sewing-kit.config.*', {
        cwd: root as string,
        ignore: ['**/node_modules/**', '**/build/**'],
        absolute: true,
      });

      const loadedConfigs = await Promise.all(configFiles.map(loadConfig));
      const workspaceConfigs = loadedConfigs.filter(
        (config) =>
          config.workspacePlugins.length > 0 ||
          config.kind === ConfigurationKind.Workspace,
      );

      if (workspaceConfigs.length > 1) {
        // needs a better error, showing files/ what workspace plugins exist
        throw new DiagnosticError({
          title: `Multiple workspace configurations found`,
          content: `Found ${workspaceConfigs.length} workspace configurations. Only one sewing-kit config can declare workspace plugins and/ or use the createWorkspace() utility from @sewing-kit/config`,
        });
      }

      const [workspaceConfig] = workspaceConfigs;

      if (
        workspaceConfig?.workspacePlugins.length > 0 &&
        workspaceConfig.kind !== ConfigurationKind.Workspace &&
        loadedConfigs.length > 1
      ) {
        // needs a better error, showing which project
        throw new DiagnosticError({
          title: `Invalid workspace plugins in project configuration`,
          content: `You declared workspace plugins in a project, but this is only supported for workspace with a single project.`,
          suggestion: `Move the workspace plugins to a root sewing-kit config file, and include them using the createWorkspace() function from @sewing-kit/config`,
        });
      }

      for (const {kind, options, projectPlugins} of loadedConfigs) {
        switch (kind) {
          case ConfigurationKind.Package: {
            const pkg = new Package({
              entries: [
                {root: './src/index', runtime: (options as any).runtime},
              ],
              ...options,
            } as any);
            packages.add(pkg);
            pluginMap.set(pkg, projectPlugins);
            break;
          }
          case ConfigurationKind.WebApp: {
            const webApp = new WebApp({entry: './index', ...options} as any);
            webApps.add(webApp);
            pluginMap.set(webApp, projectPlugins);
            break;
          }
          case ConfigurationKind.Service: {
            const service = new Service({entry: './index', ...options} as any);
            services.add(service);
            pluginMap.set(service, projectPlugins);
            break;
          }
        }
      }

      const workspace = new Workspace({
        root: root as string,
        name: basename(root as string),
        ...(workspaceConfig?.options ?? {}),
        webApps: [...webApps],
        packages: [...packages],
        services: [...services],
      });

      const delegate: SewingKitDelegate = {
        pluginsForProject: (project) => pluginMap.get(project) ?? [],
        pluginsForWorkspace: (targetWorkspace) =>
          targetWorkspace === workspace
            ? workspaceConfig?.workspacePlugins ?? []
            : [],
      };

      await run(flags as any, {workspace, ui, delegate});
    } catch (error) {
      if (error instanceof DiagnosticError) {
        ui.log(error.message);
      } else {
        ui.log(
          'The following unexpected error occurred. Please raise an issue on [the sewing-kit repo](https://github.com/Shopify/sewing-kit).',
        );
        ui.log(error.message);
        ui.log(error.stack);
      }

      // eslint-disable-next-line require-atomic-updates
      process.exitCode = 1;
    }
  };
}

function mapLogLevel(level?: string) {
  if (level == null) {
    return LogLevel.Info;
  }

  switch (level) {
    case 'errors':
      return LogLevel.Errors;
    case 'warnings':
      return LogLevel.Warnings;
    case 'info':
      return LogLevel.Info;
    case 'debug':
      return LogLevel.Debug;
    default:
      throw new Error(`Unrecognized --log-level option: ${level}`);
  }
}
