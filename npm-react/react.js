module.exports = require('./lib/React');
if ('production' !== process.env.NODE_ENV) {
  module.exports = require('./ReactJSErrors').wrap(module.exports);
}
