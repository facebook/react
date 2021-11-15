/* eslint-disable */

module.exports = () => {
  // can use beforeEach/afterEach or setupEnvironment.js in node >= 13: https://github.com/nodejs/node/pull/20026
  // jest's `setupFiles` is too late: https://stackoverflow.com/a/56482581/3406963
  process.env.TZ = 'UTC';
};
