const eslintrc = require('../../.eslintrc');

const ERROR = 2;

module.exports = Object.assign({}, eslintrc, {
  rules: Object.assign({}, eslintrc.rules, {
    'no-var': ERROR,
  }),
});
