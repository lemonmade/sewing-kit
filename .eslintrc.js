module.exports = {
  extends: [
    'plugin:shopify/typescript',
    'plugin:shopify/node',
    'plugin:shopify/prettier',
  ],
  rules: {
    'no-console': 'error',
    'callback-return': 'off',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', './tests/**/*'],
      extends: ['plugin:shopify/jest'],
    },
    {
      files: ['sewing-kit.config.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
