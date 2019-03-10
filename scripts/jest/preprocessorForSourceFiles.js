'use strict';

const path = require('path');
const babel = require('babel-core');
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');

// Use require.resolve to be resilient to file moves, npm updates, etc
const pathToBabel = path.join(
  require.resolve('babel-core'),
  '..',
  'package.json'
);
const pathToBabelPluginDevWithCode = require.resolve(
  '../error-codes/minify-error-messages'
);
const pathToBabelPluginWrapWarning = require.resolve(
  '../babel/wrap-warning-with-env-check'
);
const pathToBabelrc = path.join(__dirname, '..', '..', '.babelrc');
const pathToErrorCodes = require.resolve('../error-codes/codes.json');

module.exports = {
  process(src, filePath) {
    // for test files, we also apply the async-await transform, but we want to
    // make sure we don't accidentally apply that transform to product code.
    return babel.transform(src, {
      filename: path.relative(process.cwd(), filePath),
      plugins: [
        // For Node environment only. For builds, Rollup takes care of ESM.
        require.resolve('babel-plugin-transform-es2015-modules-commonjs'),

        require.resolve('../babel/transform-prevent-infinite-loops'),

        pathToBabelPluginDevWithCode,
        pathToBabelPluginWrapWarning,
      ],
      retainLines: true,
    }).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    pathToBabel,
    pathToBabelrc,
    pathToBabelPluginDevWithCode,
    pathToBabelPluginWrapWarning,
    pathToErrorCodes,
  ]),
};
