import {
  createComposedProjectPlugin,
  createProjectPlugin,
} from '@sewing-kit/plugins';
import {webpackBuild} from '@sewing-kit/plugin-webpack';

export function webpackBuilds() {
  return createComposedProjectPlugin('SewingKit.WebpackBuilds', [
    webpackConfiguration(),
    webpackBuild(),
  ]);
}

function webpackConfiguration() {
  return createProjectPlugin('SewingKit.WebpackBuilds.Configuration', () => {});
}
