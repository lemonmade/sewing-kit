// This file is only here so that, when we run babel-node to run the source
// version of sewing-kit against itself, it has a set of transforms that will
// actually result in valid code for Node to run.
module.exports = {
  presets: [['babel-preset-shopify/node', {typescript: true}]],
};
