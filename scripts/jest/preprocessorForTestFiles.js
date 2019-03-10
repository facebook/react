'use strict';

const path = require('path');
const babel = require('babel-core');
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const pathToBabelPluginAsyncToGenerator = require.resolve(
  'babel-plugin-transform-async-to-generator'
);

// Use require.resolve to be resilient to file moves, npm updates, etc
const pathToBabel = path.join(
  require.resolve('babel-core'),
  '..',
  'package.json'
);
const pathToBabelrc = path.join(__dirname, '..', '..', '.babelrc');

module.exports = {
  process(src, filePath) {
    return babel.transform(src, {
      filename: path.relative(process.cwd(), filePath),
      plugins: [
        require.resolve('babel-plugin-transform-react-jsx-source'),
        require.resolve('../babel/transform-prevent-infinite-loops'),
        require.resolve('babel-plugin-transform-async-to-generator'),
      ],
    }).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    pathToBabel,
    pathToBabelrc,
    pathToBabelPluginAsyncToGenerator,
  ]),
};
