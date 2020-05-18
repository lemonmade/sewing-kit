// see http://eslint.org/docs/rules/#nodejs and https://github.com/mysticatea/eslint-plugin-node

export default {
  // Require return statements after callbacks
  'node/callback-return': 'off',
  // Disallow import declarations of extraneous packages
  // defer to import/no-extraneous-dependencies
  'node/no-extraneous-import': 'off',
  // Disallow require() expressions of extraneous packages
  // defer to import/no-extraneous-dependencies
  'node/no-extraneous-require': 'off',
  // Enforce either module.exports or exports.
  'node/exports-style': ['error', 'module.exports'],
  // Enforce the style of file extensions in import declarations
  'node/file-extension-in-import': 'off',
  // Require require() calls to be placed at top-level module scope
  'node/global-require': 'error',
  // Require error handling in callbacks
  'node/handle-callback-err': 'error',
  // enforce either Buffer or require("buffer").Buffer
  'node/prefer-global/buffer': 'error',
  //	enforce either console or require("console")
  'node/prefer-global/console': 'error',
  // enforce either process or require("process")
  'node/prefer-global/process': 'error',
  // enforce either TextDecoder or require("util").TextDecoder
  'node/prefer-global/text-decoder': 'error',
  // enforce either TextEncoder or require("util").TextEncoder
  'node/prefer-global/text-encoder': 'error',
  // enforce either URLSearchParams or require("url").URLSearchParams
  'node/prefer-global/url-search-params': 'error',
  // enforce either URL or require("url").URL
  'node/prefer-global/url': 'error',
  // Disallow deprecated API.
  'node/no-deprecated-api': 'error',
  // Disallow string concatenation with __dirname and __filename
  'node/no-path-concat': 'error',
  // Disallow import and export declarations for files that don't exist.
  'node/no-missing-import': 'off',
  // Disallow require()s for files that don't exist.
  'node/no-missing-require': 'off',
  // Disallow require calls to be mixed with regular variable declarations
  'node/no-mixed-requires': ['error', {allowCall: true}],
  // Disallow new operators with calls to require
  'node/no-new-require': 'error',
  // Disallow the use of process.env
  'node/no-process-env': 'off',
  // Disallow the use of process.exit()
  'node/no-process-exit': 'off',
  // Disallow specified modules when loaded by import declarations
  'node/no-restricted-import': 'off',
  // Disallow specified modules when loaded by require
  'node/no-restricted-require': 'off',
  // Disallow synchronous methods
  'node/no-sync': 'off',
  // Disallow import and export declarations for files that are not published.
  'node/no-unpublished-import': 'off',
  // Disallow bin files that npm ignores.
  'node/no-unpublished-bin': 'error',
  // Disallow require()s for files that are not published.
  'node/no-unpublished-require': 'off',
  // disallow unsupported ECMAScript built-ins on the specified version
  'node/no-unsupported-features/es-builtins': 'off',
  // disallow unsupported ECMAScript syntax on the specified version
  'node/no-unsupported-features/es-syntax': 'off',
  // disallow unsupported Node.js built-in APIs on the specified version
  'node/no-unsupported-features/node-builtins': 'error',
  // If you turn this rule on, ESLint comes to address process.exit() as throw in code path analysis.
  'node/process-exit-as-throw': 'off',
  // Suggest correct usage of shebang.
  'node/shebang': 'error',
  // disallows callback API in favor of promise API for dns module
  'node/prefer-promises/dns': 'error',
  // disallows callback API in favor of promise API for fs module
  'node/prefer-promises/fs': 'error',
  // disallow the assignment to `exports`
  'node/no-exports-assign': 'error',
  // Ensures the Node.js error-first callback pattern is followed
  'node/no-callback-literal': 'error',
};
