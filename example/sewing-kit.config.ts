import {createWorkspace} from '@sewing-kit/config';
import {composePlugins} from '@sewing-kit/plugin-utilities';

import babel from '@sewing-kit/plugin-babel';
import eslint from '@sewing-kit/plugin-eslint';
import jest from '@sewing-kit/plugin-jest';
import webpack from '@sewing-kit/plugin-webpack';
import javascript from '@sewing-kit/plugin-javascript';
import typescript from '@sewing-kit/plugin-typescript';
import json from '@sewing-kit/plugin-json';
import graphql from '@sewing-kit/plugin-graphql';
import sass from '@sewing-kit/plugin-sass';
import react from '@sewing-kit/plugin-react';
import webAppBase from '@sewing-kit/plugin-web-app-base';
import serviceBase from '@sewing-kit/plugin-service-base';

const plugin = composePlugins('SewingKitExample', [
  babel,
  eslint,
  jest,
  webpack,
  json,
  javascript,
  typescript,
  graphql,
  sass,
  react,
  webAppBase,
  serviceBase,
]);

export default createWorkspace((workspace) => {
  workspace.plugin(plugin);
});
