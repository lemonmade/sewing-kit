// This file is only here so that, when we run babel-node to run the source
// version of sewing-kit against itself, it has a set of transforms that will
// actually result in valid code for Node to run.
module.exports = {
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    ['@babel/plugin-proposal-decorators', {legacy: true}],
    ['@babel/plugin-proposal-class-properties', {loose: true}],
    '@babel/plugin-proposal-numeric-separator',
  ],
  presets: [
    ['@babel/preset-env', {targets: {node: true}}],
    '@babel/preset-typescript',
  ],
};
