import {join, dirname, basename} from 'path';

import {produce} from 'immer';
import {BuildWebAppOptions} from '@sewing-kit/types';
import {createPlugin, PluginTarget} from '@sewing-kit/plugin-utilities';
import {changeBaseJavaScriptBabelPreset} from '@sewing-kit/plugin-javascript';

import {} from '@sewing-kit/plugin-babel';

declare module '@sewing-kit/types' {
  interface BuildWebAppOptions {
    browserTarget: 'baseline' | 'latest';
  }
}

const BROWSER_TARGETS: {
  [K in BuildWebAppOptions['browserTarget']]: string[];
} = {
  baseline: [],
  latest: [],
};

const PLUGIN = 'SewingKit.differential-serving';

export default createPlugin(
  {id: PLUGIN, target: PluginTarget.BuildWebApp},
  ({hooks}) => {
    hooks.variants.tap(PLUGIN, (variants) =>
      Object.keys(BROWSER_TARGETS).flatMap((browserTarget) =>
        variants.map((build) => ({
          ...build,
          browserTarget: browserTarget as BuildWebAppOptions['browserTarget'],
        })),
      ),
    );

    hooks.configure.tap(PLUGIN, (configuration, {browserTarget}) => {
      if (browserTarget == null) {
        return;
      }

      configuration.filename.tap(PLUGIN, (filename) => {
        return join(dirname(filename), browserTarget, basename(filename));
      });

      configuration.babelConfig?.tap(PLUGIN, (babelConfig) => {
        return produce(
          babelConfig,
          changeBaseJavaScriptBabelPreset({
            target: BROWSER_TARGETS[browserTarget],
          }),
        );
      });
    });
  },
);
