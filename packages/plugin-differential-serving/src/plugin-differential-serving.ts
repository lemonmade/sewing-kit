import {BuildWebAppOptions} from '@sewing-kit/hooks';
import {createProjectBuildPlugin, WebApp} from '@sewing-kit/plugins';
import {updateSewingKitBabelPreset} from '@sewing-kit/plugin-javascript';
import {updatePostcssEnvPreset} from '@sewing-kit/plugin-css';

import {} from '@sewing-kit/plugin-webpack';

import {LATEST_EVERGREEN} from './groups';

declare module '@sewing-kit/hooks' {
  interface BuildWebAppOptions {
    readonly browsers: string;
  }
}

const DEFAULT_BROWSER_GROUPS = {
  latest: LATEST_EVERGREEN,
};

const PLUGIN = 'SewingKit.DifferentialServing';

export interface Options {
  readonly babel?: boolean;
  readonly postcss?: boolean;
  readonly browsers?: {readonly [key: string]: string | string[]};
}

export function differentialServing({
  babel = true,
  postcss = true,
  browsers: browserGroups = DEFAULT_BROWSER_GROUPS,
}: Options = {}) {
  return createProjectBuildPlugin<WebApp>(PLUGIN, ({hooks}) => {
    hooks.variants.hook((variants) => [
      ...variants,
      ...Object.keys(browserGroups).flatMap((browsers) =>
        variants.map((build) => ({
          ...build,
          browsers: browsers as BuildWebAppOptions['browsers'],
        })),
      ),
    ]);

    hooks.configure.hook((configuration, {browsers}) => {
      const browserslistQuery = browsers && browserGroups[browsers];

      if (babel) {
        configuration.babelConfig?.hook(
          updateSewingKitBabelPreset(
            {target: browserslistQuery},
            {addIfMissing: false},
          ),
        );
      }

      if (postcss) {
        configuration.postcssPlugins?.hook(
          updatePostcssEnvPreset(
            {browsers: browserslistQuery},
            {addIfMissing: false},
          ),
        );
      }
    });
  });
}
