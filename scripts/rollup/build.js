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
const {
  createModuleMap,
  getExternalModules,
  getInternalModules,
  replaceInternalModules,
  getFbjsModuleAliases,
} = require('./modules');

const bundleTypes = {
  DEV: 'DEV',
  PROD: 'PROD',
  NODE: 'NODE',
};

function getAliases(paths, bundleType) {
  return Object.assign(
    createModuleMap(paths),
    getInternalModules(),
    bundleType !== bundleTypes.NODE ? getExternalModules() : {},
    bundleType !== bundleTypes.NODE ? getFbjsModuleAliases() : {}
  );
}

function updateConfig(config, filename, format) {
  return Object.assign({}, config, {
    dest: config.destDir + filename,
    format,
    interop: false,
  });
}

function stripEnvVariables(production) {
  return {
    '__DEV__': production ? 'false' : 'true',
    'process.env.NODE_ENV': production ? "'production'" : "'development'",
  };
}

function getFilename(name, bundleType) {
  switch (bundleType) {
    case bundleTypes.PROD:
      return `${name}.min.js`;
    case bundleTypes.DEV:
      return `${name}.js`;
    case bundleTypes.NODE:
      return `${name}.cjs.js`;
  }
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
      replaceInternalModules()
    ),
    babel(babelOpts),
    alias(getAliases(paths, bundleType)),
    commonjs(),
  ];
  if (bundleType === bundleTypes.PROD) {
    plugins.push(
      uglify(uglifyConfig()),
      replace(
        stripEnvVariables(true)
      )
    );
  } else if (bundleType === bundleTypes.DEV) {
    plugins.push(
      replace(
        stripEnvVariables(false)
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

function createBundle({babelOpts, entry, config, paths, name}, bundleType) {
  const filename = getFilename(name, bundleType);
  const format = bundleType === bundleTypes.NODE ? 'cjs' : 'umd';

  return rollup({
    entry,
    plugins: getPlugins(entry, babelOpts, paths, filename, bundleType),
    external: [
      'react',
    ],
  }).then(({write}) => write(updateConfig(config, filename, format))).catch(console.error);
}

bundles.forEach(bundle => {
  if (bundle.createUMDBundles) {
    createBundle(bundle, bundleTypes.DEV).then(() => 
      createBundle(bundle, bundleTypes.PROD).then(() =>
        createBundle(bundle, bundleTypes.NODE)
      )
    );
  } else {
    createBundle(bundle, bundleTypes.NODE);
  }
});
