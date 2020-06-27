import {BuildWebAppTargetOptions} from '@sewing-kit/hooks';
import {createProjectBuildPlugin, WebApp} from '@sewing-kit/plugins';
import {updateSewingKitBabelPreset} from '@sewing-kit/plugin-javascript';
import {updatePostcssEnvPreset} from '@sewing-kit/plugin-css';

import {} from '@sewing-kit/plugin-webpack';

import {LATEST_EVERGREEN} from './groups';

declare module '@sewing-kit/hooks' {
  interface BuildWebAppTargetOptions {
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
    hooks.targets.hook((targets) =>
      targets.map((target) =>
        target.default
          ? target.multiply((currentTarget) =>
              Object.keys(browserGroups).map((browsers) => ({
                ...currentTarget,
                browsers: browsers as BuildWebAppTargetOptions['browsers'],
              })),
            )
          : target,
      ),
    );

    hooks.target.hook(({target, hooks}) => {
      hooks.configure.hook((configuration) => {
        const {browsers} = target.options;
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
  });
}
