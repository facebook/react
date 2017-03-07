"use strict";

const { rollup } = require('rollup');
const bundles = require('./bundles');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const filesize = require('rollup-plugin-filesize');
const uglify = require('rollup-plugin-uglify');
const chalk = require('chalk');
const boxen = require('boxen');
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

function setDest(config, filename) {
  return Object.assign({}, config, {
    dest: config.destDir + filename,
  });
}

function getPlugins(entry, babelOpts, paths, filename, dev) {
  const plugins = [
    babel(babelOpts),
    alias(getAliases(paths)),
    commonjs(),
  ];
  if (!dev) {
    plugins.push(uglify());
  }
  // this needs to come last
  plugins.push(filesize({
    render: (options, size, gzip) => (
      boxen(chalk.green.bold(`"${filename}" size: `) + chalk.yellow.bold(size) + ', ' +
        chalk.green.bold('gzip size: ') + chalk.yellow.bold(gzip), { padding: 1 }
      )
    ),
  }));

  return plugins;
}

function createBundle({babelOpts, entry, config, paths, name}, dev) {
  const filename = dev ? `${name}.js` : `${name}.min.js`;

  return rollup({
    entry,
    plugins: getPlugins(entry, babelOpts, paths, filename, dev),
    external,
  }).then(({ write }) => write(setDest(config, filename))).catch(console.error);
}

bundles.forEach(bundle => (
  createBundle(bundle, true).then(() => 
     createBundle(bundle, false)
  )
));
