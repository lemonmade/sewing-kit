module.exports = {
  extends: [
    'plugin:shopify/node',
    'plugin:shopify/typescript',
    'plugin:shopify/prettier',
  ],
  rules: {
    'no-process-env': 'off',
    'callback-return': 'off',
  },
};
