import bestPractices from './rules/best-practices';
import legacy from './rules/legacy';
import possibleErrors from './rules/possible-errors';
import strictMode from './rules/strict-mode';
import stylisticIssues from './rules/stylistic-issues';
import variables from './rules/variables';
import eslintComments from './rules/eslint-comments';
import es6 from './rules/ecmascript-6';
import promise from './rules/promise';
import babel from './rules/babel';
import sortClassMembers from './rules/sort-class-members';
import importRules from './rules/import';

export default {
  extends: 'plugin:shopify/core',
  parser: 'babel-eslint',

  env: {
    es6: true,
  },

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },

  plugins: ['babel', 'promise', 'sort-class-members', 'import'],

  settings: {
    'import/ignore': ['node_modules', '\\.s?css'],
  },

  rules: {
    ...bestPractices,
    ...legacy,
    ...possibleErrors,
    ...strictMode,
    ...stylisticIssues,
    ...variables,
    ...eslintComments,
    ...es6,
    ...promise,
    ...babel,
    ...sortClassMembers,
    ...importRules,
    // default params
    'no-param-reassign': 'error',
    // Rules override by the Babel plugin
    camelcase: 'off',
    quotes: 'off',
    'no-unused-expressions': 'off',
    'valid-typeof': 'off',
    'new-cap': 'off',
    'no-await-in-loop': 'off',
    'object-curly-spacing': 'off',
    'no-invalid-this': 'off',
  },
};
