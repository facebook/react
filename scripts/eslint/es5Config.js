const eslintrc = require('../../.eslintrc');

module.exports = Object.assign({}, eslintrc, {
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script',
    ecmaFeatures: {
      jsx: true,
    },
  },
});
