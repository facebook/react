"use strict";

const { rollup } = require('rollup');
const bundles = require('./bundles');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const filesize = require('rollup-plugin-filesize');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const chalk = require('chalk');
const boxen = require('boxen');
const { createModuleMap } = require('./moduleMap');
const { getFbjsModuleAliases } = require('./fbjs');
const { 
  getExternalModules,
  replaceExternalModules,
} = require('./external');

const bundleTypes = {
  DEV: 'DEV',
  PROD: 'PROD',
  NODE: 'NODE',
};

function getAliases(paths) {
  return Object.assign(
    createModuleMap(paths, false),
    getExternalModules(),
    getFbjsModuleAliases()
  );
}

function updateConfig(config, filename, format) {
  return Object.assign({}, config, {
    dest: config.destDir + filename,
    format,
  });
}

function stripDevCode() {
  return {
    '__DEV__': 'false',
    'process.env.NODE_ENV': "'production'",
  };
}

function uglifyConfig() {
  return {
    warnings: false,
    compress: {
      screw_ie8: true,
      dead_code: true,
      unused: true,
      drop_debugger: true,
      booleans: true,
    },
    mangle: {
      screw_ie8: true,
    },
  };
}

function getPlugins(entry, babelOpts, paths, filename, bundleType) {
  const plugins = [
    replace(
      replaceExternalModules()
    ),
    babel(babelOpts),
    alias(getAliases(paths)),
    commonjs(),
  ];
  if (bundleType === bundleTypes.PROD) {
    plugins.push(
      uglify(uglifyConfig()),
      replace(
        stripDevCode()
      )
    );
  }
  // this needs to come last or it doesn't report sizes correctly
  plugins.push(filesize({
    render: (options, size, gzip) => (
      boxen(chalk.green.bold(`"${filename}" size: `) + chalk.yellow.bold(size) + ', ' +
        chalk.green.bold('gzip size: ') + chalk.yellow.bold(gzip), { padding: 1 }
      )
    ),
  }));

  return plugins;
}

function createBundle({babelOpts, entry, config, paths, name, umd}, bundleType) {
  const filename = bundleType === bundleTypes.PROD ? `${name}.min.js` : `${name}.js`;
  const format = umd ? 'umd' : 'cjs';

  return rollup({
    entry,
    plugins: getPlugins(entry, babelOpts, paths, filename, bundleType),
    external: [
      'react',
    ],
  }).then(({write}) => write(updateConfig(config, filename, format))).catch(console.error);
}

bundles.forEach(bundle => (
  createBundle(bundle, bundleTypes.DEV).then(() => 
     createBundle(bundle, bundleTypes.PROD)
  )
));
