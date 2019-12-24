import {join, dirname, basename} from 'path';

import {BuildWebAppOptions} from '@sewing-kit/hooks';
import {createProjectBuildPlugin, WebApp} from '@sewing-kit/plugins';
import {changeBaseJavaScriptBabelPreset} from '@sewing-kit/plugin-javascript';

import {} from '@sewing-kit/plugin-babel';
import {} from '@sewing-kit/plugin-webpack';

declare module '@sewing-kit/hooks' {
  interface BuildWebAppOptions {
    readonly browserTarget: string;
  }
}

const DEFAULT_BROWSER_GROUPS = {
  latest: [
    'last 1 chrome versions',
    'last 1 chromeandroid versions',
    'last 1 firefox versions',
    'last 1 opera versions',
    'last 1 edge versions',
    'safari >= 11',
    'ios >= 11',
  ],
};

const PLUGIN = 'SewingKit.differential-serving';

export interface Options {
  readonly groups?: {readonly [key: string]: readonly string[]};
}

export function differentialServing({
  groups = DEFAULT_BROWSER_GROUPS,
}: Options = {}) {
  return createProjectBuildPlugin<WebApp>(PLUGIN, ({hooks}) => {
    hooks.variants.hook((variants) => [
      ...variants,
      ...Object.keys(groups).flatMap((browserTarget) =>
        variants.map((build) => ({
          ...build,
          browserTarget: browserTarget as BuildWebAppOptions['browserTarget'],
        })),
      ),
    ]);

    hooks.configure.hook((configuration, {browserTarget}) => {
      if (browserTarget == null) {
        return;
      }

      configuration.webpackOutputFilename?.hook((filename) => {
        return join(dirname(filename), browserTarget, basename(filename));
      });

      configuration.babelConfig?.hook(
        changeBaseJavaScriptBabelPreset({
          target: groups[browserTarget],
        }),
      );
    });
  });
}
