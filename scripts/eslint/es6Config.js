const eslintrc = require('../../.eslintrc');

var ERROR = 2;

module.exports = Object.assign({}, eslintrc, {
  parseOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: Object.assign({}, eslintrc.rules, {
    'no-var': ERROR,
  }),
});
