const eslintrc = require('../../.eslintrc');

module.exports = Object.assign({}, eslintrc, {
  parseOptions: {
    ecmaVersion: 5,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});
