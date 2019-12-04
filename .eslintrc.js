module.exports = {
  extends: [
    'plugin:@sewing-kit/typescript',
    'plugin:@sewing-kit/node',
    'plugin:@sewing-kit/prettier',
  ],
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', './tests/**/*'],
      extends: ['plugin:@sewing-kit/jest'],
    },
    {
      files: ['sewing-kit.config.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
