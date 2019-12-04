import graphql from './rules/graphql';

export default {
  overrides: [
    {
      plugins: ['graphql'],
      parser: 'babel-eslint',
      files: ['*.graphql'],
      rules: {
        ...graphql,
      },
    },
  ],
};
