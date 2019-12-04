import prettier from './rules/prettier';

export default {
  extends: ['prettier'],

  plugins: ['prettier', 'babel'],

  rules: {
    ...prettier,
    // rules to disable to prefer prettier
    'babel/semi': 'off',

    // Special rule for 'lines-around-comment'
    // https://github.com/prettier/eslint-config-prettier/blob/984de70e8c6b57684b444283561019389ccebd11/README.md#lines-around-comment
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: true,
      },
    ],

    // Special rule for 'no-unexpected-multiline'
    // https://github.com/prettier/eslint-config-prettier/blob/5399175c37466747aae9d407021dffec2c169c8b/README.md#no-unexpected-multiline
    'no-unexpected-multiline': 'error',
  },

  overrides: [
    {
      // disable prettier processing of graphql files
      // eslint-plugin-graphql is required to process graphql files, but it also
      // suppresses all lint violations except its own, which results in a
      // wasteful no-op.
      files: ['*.graphql', '*.gql'],
      rules: {
        'prettier/prettier': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      rules: {
        // don't use lint rules, defer to prettier rules instead
        '@typescript-eslint/quotes': 'off',
        '@typescript-eslint/brace-style': 'off',
        '@typescript-eslint/func-call-spacing': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/no-extra-parens': 'off',
        '@typescript-eslint/semi': 'off',
        '@typescript-eslint/type-annotation-spacing': 'off',
      },
    },
  ],
};
