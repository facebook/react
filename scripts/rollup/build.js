"use strict";

const { rollup } = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const filesize = require('rollup-plugin-filesize');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const ncp = require('ncp').ncp;
const chalk = require('chalk');
const boxen = require('boxen');
const { resolve, join } = require('path');
const { mkdirSync, unlinkSync, existsSync } = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const {
  createModuleMap,
  getNodeModules,
  getInternalModules,
  replaceInternalModules,
  getFbjsModuleAliases,
  replaceFbjsModuleAliases,
  ignoreFBModules,
  ignoreReactNativeModules,
  getExternalModules,
  getReactCurrentOwnerModuleAlias,
} = require('./modules');
const {
  bundles,
  bundleTypes,
 } = require('./bundles');

function getAliases(paths, bundleType, isRenderer) {
  return Object.assign(
    getReactCurrentOwnerModuleAlias(bundleType, isRenderer),
    createModuleMap(paths),
    getInternalModules(bundleType, isRenderer),
    getNodeModules(bundleType),
    getFbjsModuleAliases(bundleType)
  );
}

function getBanner(bundleType, hastName) {
  if (bundleType === bundleTypes.FB || bundleType === bundleTypes.RN) {
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
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
    case bundleTypes.RN:
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

function handleRollupWarnings(warning) {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    console.error(warning.message);
    process.exit(1);
  }
  console.warn(warning.message || warning);
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
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
    case bundleTypes.FB:
    case bundleTypes.RN:
      return `cjs`;
  }
}

function getFilename(name, hasteName, bundleType) {
  switch (bundleType) {
    case bundleTypes.DEV:
      return `${name}.dev.js`;
    case bundleTypes.PROD:
      return `${name}.prod.min.js`;
    case bundleTypes.NODE_DEV:
      return `${name}.node-dev.js`;
    case bundleTypes.NODE_PROD:
      return `${name}.node-prod.min.js`;
    case bundleTypes.FB:
    case bundleTypes.RN:
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
    case bundleTypes.NODE_DEV:
    case bundleTypes.NODE_PROD:
      return {};
    case bundleTypes.RN:
      return {
        ignore: ignoreReactNativeModules(),
      };
    case bundleTypes.FB:
      // Modules we don't want to inline in the bundle.
      // Force them to stay as require()s in the output.
      return {
        ignore: ignoreFBModules(),
      };
  }
}

function copyNodePackageTemplate(packageName) {
  const from = resolve(`./packages/${packageName}`);
  const to = resolve(`./build/rollup/packages/${packageName}`);  

  // if the package directory already exists, we skip copying to it
  if (!existsSync(to)) {
    return new Promise((res, rej) => {
      ncp(from, to, error => {
        if (error) {
          rej(error);
        }
        res();
      });
    });
  } else {
    return Promise.resolve();
  }
}

function copyBundleIntoNodePackage(packageName, filename) {
  const from = resolve(`./build/rollup/${filename}`);
  const to = resolve(`./build/rollup/packages/${packageName}/${filename}`);

  return new Promise((res, rej) => {
    ncp(from, to, error => {
      if (error) {
        rej(error);
      }
      // delete the old file
      unlinkSync(from);
      res();
    });
  });
}

function createNodePackage(bundleType, packageName, filename) {
  const { NODE_DEV, NODE_PROD, RN } = bundleTypes;
  
  // we only copy packages for NODE_DEV, NODE_PROD and FB bundle types
  if (bundleType === NODE_DEV || bundleType === NODE_PROD || bundleType === RN) {
    return copyNodePackageTemplate(packageName).then(
      () => copyBundleIntoNodePackage(packageName, filename)
    );
  }
  return Promise.resolve();
}

function getPlugins(entry, babelOpts, paths, filename, bundleType, isRenderer) {
  const plugins = [
    replace(
      Object.assign(
        replaceInternalModules(),
        replaceFbjsModuleAliases(bundleType)
      )
    ),
    babel(updateBabelConfig(babelOpts, bundleType)),
    alias(getAliases(paths, bundleType, isRenderer)),
    commonjs(getCommonJsConfig(bundleType)),
  ];
  if (bundleType === bundleTypes.PROD || bundleType === bundleTypes.NODE_PROD) {
    plugins.push(
      uglify(uglifyConfig()),
      replace(
        stripEnvVariables(true)
      )
    );
  } else if (bundleType === bundleTypes.DEV || bundleType === bundleTypes.NODE_DEV) {
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

const inputBundleType = argv.type;

function createBundle({
  babelOpts,
  entry,
  fbEntry,
  rnEntry,
  config,
  paths,
  name,
  hasteName,
  bundleTypes: bundleTypesToUse,
  isRenderer,
  externals,
}, bundleType) {
  if ((inputBundleType && inputBundleType !== bundleType)
    || bundleTypesToUse.indexOf(bundleType) === -1) {
    return Promise.resolve();
  }

  const filename = getFilename(name, hasteName, bundleType);
  const format = getFormat(bundleType);
  return rollup({
    entry: bundleType === bundleTypes.FB ? fbEntry : entry,
    external: getExternalModules(externals, bundleType, isRenderer),
    onwarn: handleRollupWarnings,
    plugins: getPlugins(entry, babelOpts, paths, filename, bundleType, isRenderer),
  }).then(({write}) => write(
    updateBundleConfig(config, filename, format, bundleType, hasteName)
  )).then(() => (
    createNodePackage(bundleType, name, filename)
  )).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

// clear the build folder
rimraf(join('build', 'rollup'), () => {
  // TODO: this line can go away once we remove rollup folder
  mkdirSync(resolve(`./build/rollup`));
  // create the packages folder  
  mkdirSync(resolve(`./build/rollup/packages/`));
  bundles.forEach(bundle => 
    Promise.resolve()
      .then(() => createBundle(bundle, bundleTypes.DEV))
      .then(() => createBundle(bundle, bundleTypes.PROD))
      .then(() => createBundle(bundle, bundleTypes.NODE_DEV))
      .then(() => createBundle(bundle, bundleTypes.NODE_PROD))
      .then(() => createBundle(bundle, bundleTypes.FB))
      .then(() => createBundle(bundle, bundleTypes.RN))
  );
});


