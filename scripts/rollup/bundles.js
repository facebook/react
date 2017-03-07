'use strict';

const {
  babelOptsReact,
} = require('./babel');

const bundles = [
  {
    config: {
      dest: 'build/rollup/react.js',
      format: 'umd',
      moduleName: 'React',
      sourceMap: false,
    },
    entry: 'src/umd/ReactUMDEntry.js',
    babelOpts: babelOptsReact,
    paths: [
      'src/umd/ReactUMDEntry.js',
      'src/umd/ReactWithAddonsUMDEntry.js',
      'src/umd/shims/**/*.js',

      'src/isomorphic/**/*.js',
      'src/addons/**/*.js',

      'src/ReactVersion.js',
      'src/shared/**/*.js',
    ],
  },
];

module.exports = bundles;
