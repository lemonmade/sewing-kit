import node from './rules/node';

export default {
  env: {
    node: true,
  },

  plugins: ['node'],

  rules: {...node},
};
