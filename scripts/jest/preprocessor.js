/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

const path = require('path');

const babel = require('@babel/core');
const coffee = require('coffee-script');

const tsPreprocessor = require('./typescript/preprocessor');
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const getIgnoredNpmFiles = require('./getIgnoredNpmFiles');

const pathToBabel = path.join(
  require.resolve('@babel/core'),
  '../..',
  'package.json'
);
const pathToBabelPluginDevWithCode = require.resolve(
  '../error-codes/transform-error-messages'
);
const pathToBabelPluginWrapWarning = require.resolve(
  '../babel/wrap-warning-with-env-check'
);
const pathToBabelPluginAsyncToGenerator = require.resolve(
  '@babel/plugin-transform-async-to-generator'
);
const pathToTransformInfiniteLoops = require.resolve(
  '../babel/transform-prevent-infinite-loops'
);
const pathToBabelrc = path.join(__dirname, '..', '..', 'babel.config.js');
const pathToErrorCodes = require.resolve('../error-codes/codes.json');

const babelOptions = {
  plugins: [
    // For Node environment only. For builds, Rollup takes care of ESM.
    require.resolve('@babel/plugin-transform-modules-commonjs'),

    pathToBabelPluginDevWithCode,
    pathToBabelPluginWrapWarning,

    // Keep stacks detailed in tests.
    // Don't put this in .babelrc so that we don't embed filenames
    // into ReactART builds that include JSX.
    // TODO: I have not verified that this actually works.
    require.resolve('@babel/plugin-transform-react-jsx-source'),

    pathToTransformInfiniteLoops,

    // This optimization is important for extremely performance-sensitive (e.g. React source).
    // It's okay to disable it for tests.
    [
      require.resolve('@babel/plugin-transform-block-scoping'),
      {throwIfClosureRequired: false},
    ],
  ],
  retainLines: true,
};

const ignoredNpmFiles = new Set();
for (const file of getIgnoredNpmFiles()) {
  ignoredNpmFiles.add(path.resolve('packages', file));
}

module.exports = {
  process: function(src, filePath) {
    if (ignoredNpmFiles.has(filePath)) {
      // If this file is not part of the `files` array, throw an error when
      // attempting to import it, since it will not exist in the final npm
      // package artifact.
      return `
throw Error(
  'Cannot import an npm module path if it is not included in the \`files\` ' +
  'array in \`package.json\`. If this is an experimental module, be sure to ' +
  'mark the test as experimental: ${filePath}'
);
`;
    }

    if (filePath.match(/\.coffee$/)) {
      return coffee.compile(src, {bare: true});
    }
    if (filePath.match(/\.ts$/) && !filePath.match(/\.d\.ts$/)) {
      return tsPreprocessor.compile(src, filePath);
    }
    if (filePath.match(/\.json$/)) {
      return src;
    }
    if (!filePath.match(/\/third_party\//)) {
      // for test files, we also apply the async-await transform, but we want to
      // make sure we don't accidentally apply that transform to product code.
      const isTestFile = !!filePath.match(/\/__tests__\//);
      return babel.transform(
        src,
        Object.assign(
          {filename: path.relative(process.cwd(), filePath)},
          babelOptions,
          isTestFile
            ? {
                plugins: [pathToBabelPluginAsyncToGenerator].concat(
                  babelOptions.plugins
                ),
              }
            : {}
        )
      );
    }
    return src;
  },

  getCacheKey: createCacheKeyFunction(
    [
      __filename,
      pathToBabel,
      pathToBabelrc,
      pathToBabelPluginDevWithCode,
      pathToBabelPluginWrapWarning,
      pathToTransformInfiniteLoops,
      pathToErrorCodes,
    ],
    [__EXPERIMENTAL__]
  ),
};
