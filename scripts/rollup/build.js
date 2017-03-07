"use strict";

const { rollup } = require('rollup');
const bundles = require('./bundles');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const { createModuleMap } = require('./moduleMap');
// const nodeResolve = require('rollup-plugin-node-resolve');

const external = [];

function getAliases(paths) {
  return Object.assign(
    createModuleMap(paths),
    {
      // ...
    }
  );
}

function getPlugins(entry, babelOpts, paths) {
  return [
    babel(babelOpts),
    alias(getAliases(paths)),
    // nodeResolve({ jsnext: true, main: true }),
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

