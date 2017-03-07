"use strict";

const { rollup } = require('rollup');
const { resolve } = require('path');
const bundles = require('./bundles');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const inject = require('rollup-plugin-inject');
const { createModuleMap } = require('./moduleMap');
const { getFbjsModuleAliases } = require('./fbjs');

const external = [
  'fbjs/lib/warning',
];

function getAliases(paths) {
  return Object.assign(
    createModuleMap(paths),
    getFbjsModuleAliases()
  );
}

function getPlugins(entry, babelOpts, paths) {
  return [
    babel(babelOpts),
    inject({
      'Object.assign': resolve('./node_modules/object-assign/index.js'),
    }),
    alias(getAliases(paths)),
    commonjs(),
  ];
}

bundles.forEach(({babelOpts, entry, config, paths}) => (
  rollup({
    entry,
    plugins: getPlugins(entry, babelOpts, paths),
    external,
  }).then(({ write }) => write(config)).catch(console.error)
));
