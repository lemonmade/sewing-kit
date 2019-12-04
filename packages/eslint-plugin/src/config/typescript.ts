import typescript from './rules/typescript';

export default {
  overrides: [
    {
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@sewing-kit/esnext', 'plugin:import/typescript'],
      plugins: ['@typescript-eslint', 'babel', 'import'],
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      files: ['*.ts', '*.tsx'],
      rules: {
        ...typescript,

        // TypeScript provides a better mechanism (explicit `this` type)
        // for ensuring proper `this` usage in functions not assigned to
        // object properties.
        'babel/no-invalid-this': 'off',

        // Handled by TypeScript itself
        'no-undef': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'no-useless-constructor': 'off',
        'no-shadow': 'off',
        'no-use-before-define': 'off',
        semi: 'off',
        quotes: 'off',
        indent: 'off',
        'brace-style': 'off',
        'require-await': 'off',
        'no-magic-numbers': 'off',
        'no-extra-parens': 'off',
        'no-empty-function': 'off',
        'func-call-spacing': 'off',
        'babel/camelcase': 'off',
        camelcase: 'off',
        'no-array-constructor': 'off',
        'no-dupe-args': 'off',
        'no-dupe-keys': 'off',
        'no-unreachable': 'off',
        'valid-typeof': 'off',
        'no-const-assign': 'off',
        'no-new-symbol': 'off',
        'no-this-before-super': 'off',
        'no-redeclare': 'off',
        'consistent-return': 'off',

        // Flag overloaded methods in TS
        'no-dupe-class-members': 'off',

        // Does not support TS equivalent
        'import/no-unresolved': 'off',

        // Flag typedef files with multiple modules with export default
        'import/export': 'off',

        // Breaks @typescript-eslint/parser
        strict: 'off',
        'array-callback-return': 'off',
        'getter-return': 'off',
      },
    },
  ],
};
