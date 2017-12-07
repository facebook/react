const {config, ERROR} = require('./baseConfig');

module.exports = Object.assign({}, config, {
  rules: Object.assign({}, config.rules, {
    'no-var': ERROR,
  }),
});
