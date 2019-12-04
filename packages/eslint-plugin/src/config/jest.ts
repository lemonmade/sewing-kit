import jest from './rules/jest';

export default {
  env: {
    'jest/globals': true,
  },

  plugins: ['jest'],

  rules: {
    ...jest,
  },
};
