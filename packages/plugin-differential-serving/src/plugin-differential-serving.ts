import {join, dirname, basename} from 'path';

import {produce} from 'immer';
import {BuildWebAppOptions} from '@sewing-kit/hooks';
import {createProjectBuildPlugin} from '@sewing-kit/plugins';
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

export const createDifferentialServingPlugin = ({
  groups = DEFAULT_BROWSER_GROUPS,
}: Options = {}) =>
  createProjectBuildPlugin(PLUGIN, ({hooks}) => {
    hooks.webApp.tap(PLUGIN, ({hooks}) => {
      hooks.variants.tap(PLUGIN, (variants) => [
        ...variants,
        ...Object.keys(groups).flatMap((browserTarget) =>
          variants.map((build) => ({
            ...build,
            browserTarget: browserTarget as BuildWebAppOptions['browserTarget'],
          })),
        ),
      ]);

      hooks.configureBrowser.tap(PLUGIN, (configuration, {browserTarget}) => {
        if (browserTarget == null) {
          return;
        }

        configuration.webpackOutputFilename?.tap(PLUGIN, (filename) => {
          return join(dirname(filename), browserTarget, basename(filename));
        });

        configuration.babelConfig?.tap(PLUGIN, (babelConfig) => {
          return produce(
            babelConfig,
            changeBaseJavaScriptBabelPreset({
              target: groups[browserTarget],
            }),
          );
        });
      });
    });
  });

export const differentialServingPlugin = createDifferentialServingPlugin();
