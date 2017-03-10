"use strict";

const { rollup } = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const filesize = require('rollup-plugin-filesize');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const chalk = require('chalk');
const boxen = require('boxen');
const { resolve } = require('path');
const {
  createModuleMap,
  getExternalModules,
  getInternalModules,
  replaceInternalModules,
  getFbjsModuleAliases,
  replaceFbjsModuleAliases,
} = require('./modules');
const {
  bundles,
  bundleTypes,
 } = require('./bundles');

function getAliases(paths, bundleType) {
  return Object.assign(
    createModuleMap(paths),
    getInternalModules(bundleType),
    getExternalModules(bundleType),
    getFbjsModuleAliases(bundleType)
  );
}

function getBanner(bundleType, hastName) {
  if (bundleType === bundleTypes.FB) {
    return (
      // intentionally not indented correctly, as whitespace is literal
`/**
  * Copyright 2013-present, Facebook, Inc.
  * All rights reserved.
  *
  * This source code is licensed under the BSD-style license found in the
  * LICENSE file in the root directory of this source tree. An additional grant
  * of patent rights can be found in the PATENTS file in the same directory.
  *
  * @providesModule ${hastName}
  */`
    );
  }
  return '';
}

function updateBabelConfig(babelOpts, bundleType) {
  let newOpts;

  switch (bundleType) {
    case bundleTypes.PROD:
    case bundleTypes.DEV:
    case bundleTypes.NODE:
      newOpts = Object.assign({}, babelOpts);

      // we add the objectAssign transform for these bundles
      newOpts.plugins = newOpts.plugins.slice();
      newOpts.plugins.push(
        resolve('./scripts/babel/transform-object-assign-require')
      );
      return newOpts;
    case bundleTypes.FB:
      newOpts = Object.assign({}, babelOpts);

      // for FB, we don't want the devExpressionWithCodes plugin to run
      newOpts.plugins = [];
      return newOpts;
  }
}

function updateBundleConfig(config, filename, format, bundleType, hastName) {
  return Object.assign({}, config, {
    banner: getBanner(bundleType, hastName),
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

function getFormat(bundleType) {
  switch (bundleType) {
    case bundleTypes.PROD:
    case bundleTypes.DEV:
      return `umd`;
    case bundleTypes.NODE:
    case bundleTypes.FB:
      return `cjs`;
  }
}

function getFilename(name, hasteName, bundleType) {
  switch (bundleType) {
    case bundleTypes.PROD:
      return `${name}.umd.min.js`;
    case bundleTypes.DEV:
      return `${name}.umd.js`;
    case bundleTypes.NODE:
      return `${name}.cjs.js`;
    case bundleTypes.FB:
      return `${hasteName}.js`;
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

function getCommonJsConfig(bundleType) {
  switch (bundleType) {
    case bundleTypes.PROD:
    case bundleTypes.DEV:
      return {};
    case bundleTypes.NODE:
    case bundleTypes.FB:
      // we ignore the require() for some inline modules
      // wrapped in __DEV__
      // return {
      //   ignore: [
      //     'react-dom/lib/ReactPerf',
      //     'react-dom/lib/ReactTestUtils',
      //   ],
      // };
      // change of plan: let's bundle them again
      return {
        ignore: [
          'react/lib/ReactCurrentOwner',
          'ReactCurrentOwner',
        ],
      };
  }
}

function getPlugins(entry, babelOpts, paths, filename, bundleType) {
  const plugins = [
    replace(
      Object.assign(
        replaceInternalModules(bundleType),
        replaceFbjsModuleAliases(bundleType)
      )
    ),
    babel(updateBabelConfig(babelOpts, bundleType)),
    alias(getAliases(paths, bundleType)),
    commonjs(getCommonJsConfig(bundleType)),
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
  plugins.push(
    // this needs to come last or it doesn't report sizes correctly
    filesize({
      render: (options, size, gzip) => (
        boxen(chalk.green.bold(`"${filename}" size: `) + chalk.yellow.bold(size) + ', ' +
          chalk.green.bold('gzip size: ') + chalk.yellow.bold(gzip), { padding: 1 }
        )
      ),
    })
  );

  return plugins;
}

function createBundle({babelOpts, entry, fbEntry, config, paths, name, hasteName}, bundleType) {
  const filename = getFilename(name, hasteName, bundleType);
  const format = getFormat(bundleType);

  return rollup({
    entry: bundleType === bundleTypes.FB ? fbEntry : entry,
    plugins: getPlugins(entry, babelOpts, paths, filename, bundleType),
    external: [
      'react',
    ],
  }).then(({write}) => write(
    updateBundleConfig(config, filename, format, bundleType, hasteName)
  )).catch(console.error);
}

bundles.forEach(bundle => {
  if (bundle.createUMDBundles) {
    createBundle(bundle, bundleTypes.DEV).then(() => 
      createBundle(bundle, bundleTypes.PROD).then(() =>
        createBundle(bundle, bundleTypes.NODE).then(() => 
          createBundle(bundle, bundleTypes.FB)
        )
      )
    );
  } else {
    createBundle(bundle, bundleTypes.NODE).then(() =>
      createBundle(bundle, bundleTypes.FB)
    );
  }
});
