import react from './rules/react';
import reactHooks from './rules/react-hooks';
import jsxA11y from './rules/jsx-a11y';

export default {
  settings: {
    react: {
      version: 'detect',
    },
  },

  env: {
    browser: true,
  },

  parserOptions: {
    ecmaFeatures: {jsx: true},
  },

  plugins: ['react', 'jsx-a11y', 'react-hooks'],

  rules: {...react, ...reactHooks, ...jsxA11y},

  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        // Disable JS specific rules
        'react/jsx-filename-extension': 'off',
        'react/default-props-match-prop-types': 'off',
        'react/prop-types': 'off',

        // Breaks @typescript-eslint/parser
        'react/jsx-indent': 'off',
        'react/no-typos': 'off',
        'react/jsx-closing-tag-location': 'off',
        'react/jsx-wrap-multilines': 'off',
      },
    },
  ],
};
