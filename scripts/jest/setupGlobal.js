/* eslint-disable */

const {join} = require('path');
const {exec} = require('child-process-promise');

module.exports = async () => {
  // can use beforeEach/afterEach or setupEnvironment.js in node >= 13: https://github.com/nodejs/node/pull/20026
  // jest's `setupFiles` is too late: https://stackoverflow.com/a/56482581/3406963
  process.env.TZ = 'UTC';

  const cwd = join(
    __dirname,
    '..',
    '..',
    'packages',
    'eslint-plugin-react-hooks'
  );
  // Run TypeScript on eslint-plugin-react-hooks prior to tests
  return await exec('yarn build', {cwd});
};
