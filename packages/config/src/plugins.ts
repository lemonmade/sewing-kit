import {Workspace, Project} from '@sewing-kit/model';
import {WorkspacePlugin, ProjectPlugin} from '@sewing-kit/plugins';

export interface PluginSource {
  pluginsForWorkspace(workspace: Workspace): readonly WorkspacePlugin[];
  pluginsForProject<Type extends Project>(
    project: Project,
  ): readonly ProjectPlugin<Type>[];
  ancestorsForPlugin<Plugin extends ProjectPlugin<any> | WorkspacePlugin>(
    plugin: Plugin,
  ): readonly Plugin[];
}
