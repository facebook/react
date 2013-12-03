module.exports = require('./lib/ReactWithAddons');
if ('production' !== process.env.NODE_ENV) {
  module.exports = require('./ReactJSErrors').wrap(module.exports);
}
