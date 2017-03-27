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
const { resolve, join, basename } = require('path');
const {
  mkdirSync,
  unlinkSync,
  existsSync,
} = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const extractErrors = require('../error-codes/extract-errors');
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
  getReactCheckPropTypesModuleAlias,
  getReactComponentTreeHookModuleAlias,
  facebookWWWSrcDependencies,
  replaceDevOnlyStubbedModules,
} = require('./modules');
const {
  bundles,
  bundleTypes,
 } = require('./bundles');

const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

function getAliases(paths, bundleType, isRenderer) {
  return Object.assign(
    getReactCurrentOwnerModuleAlias(bundleType, isRenderer),
    getReactCheckPropTypesModuleAlias(bundleType, isRenderer),
    getReactComponentTreeHookModuleAlias(bundleType, isRenderer),
    createModuleMap(paths, argv.extractErrors && extractErrors(errorCodeOpts)),
    getInternalModules(),
    getNodeModules(bundleType),
    getFbjsModuleAliases(bundleType)
  );
}

// the facebook-www directory
const facebookWWW = 'facebook-www';

// bundle types for shorthand
const { UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD, RN } = bundleTypes;

function getBanner(bundleType, hastName) {
  if (bundleType === FB_DEV || bundleType === FB_PROD || bundleType === RN) {
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
  */${bundleType === FB_DEV ? `\n\n'use strict';\n\nif (__DEV__) {\n` : ''}
  `
    );
  }
  return '';
}

function getFooter(bundleType) {
  if (bundleType === FB_DEV) {
    return '\n}\n';
  }
  return '';
}

function updateBabelConfig(babelOpts, bundleType) {
  let newOpts;

  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
    case RN:
      newOpts = Object.assign({}, babelOpts);

      // we add the objectAssign transform for these bundles
      newOpts.plugins = newOpts.plugins.slice();
      newOpts.plugins.push(
        resolve('./scripts/babel/transform-object-assign-require')
      );
      return newOpts;
    case FB_DEV:
    case FB_PROD:
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
  let dest = config.destDir + filename;

  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    dest = `${config.destDir}${facebookWWW}/${filename}`;
  } else if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
    dest = `${config.destDir}dist/${filename}`;
  } else if (bundleType === RN) {
    dest = `${config.destDir}react-native/${filename}`;
  }
  return Object.assign({}, config, {
    banner: getBanner(bundleType, hastName),
    dest,
    footer: getFooter(bundleType),
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
    case UMD_DEV:
    case UMD_PROD:
      return `umd`;
    case NODE_DEV:
    case NODE_PROD:
    case FB_DEV:
    case FB_PROD:
    case RN:
      return `cjs`;
  }
}

function getFilename(name, hasteName, bundleType) {
  switch (bundleType) {
    case UMD_DEV:
      return `${name}.development.js`;
    case UMD_PROD:
      return `${name}.production.min.js`;
    case NODE_DEV:
      return `${name}.node-development.js`;
    case NODE_PROD:
      return `${name}.node-production.min.js`;
    case RN:
      return `${hasteName}.js`;
    case FB_DEV:
      return `${hasteName}-dev.js`;
    case FB_PROD:
      return `${hasteName}-prod.js`;
  }
}

function uglifyConfig(mangle) {
  return {
    warnings: false,
    compress: {
      screw_ie8: true,
      dead_code: true,
      unused: true,
      drop_debugger: true,
      booleans: true, 
    },
    output: {
      beautify: !mangle,
    },
    mangle: mangle ? {
      screw_ie8: true,
      toplevel: true,
    } : false,
  };
}

function getCommonJsConfig(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
      return {};
    case RN:
      return {
        ignore: ignoreReactNativeModules(),
      };
    case FB_DEV:
    case FB_PROD:
      // Modules we don't want to inline in the bundle.
      // Force them to stay as require()s in the output.
      return {
        ignore: ignoreFBModules(),
      };
  }
}

function asyncCopyTo(from, to) {
  return new Promise(res => {
    ncp(from, to, error => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      res();
    });
  });
}

async function createReactNativeBuild() {
  // create the react-native folder for FB bundles
  mkdirSync(join('build', 'react-native'));
  // create the react-native shims folder for FB shims
  mkdirSync(join('build', 'react-native', 'shims'));
  // copy in all the shims from build/rollup/shims/react-native
  const from = join('scripts', 'rollup', 'shims', 'react-native');
  const to = join('build', 'react-native', 'shims');

  await asyncCopyTo(from, to);
}

async function createFacebookWWWBuild() {
  // create the facebookWWW folder for FB bundles
  mkdirSync(join('build', facebookWWW));
  // create the facebookWWW shims folder for FB shims
  mkdirSync(join('build', facebookWWW, 'shims'));
  // copy in all the shims from build/rollup/shims/facebook-www
  const from = join('scripts', 'rollup', 'shims', facebookWWW);
  const to = join('build', facebookWWW, 'shims');

  await asyncCopyTo(from, to);
  // we also need to copy over some specific files from src
  // defined in facebookWWWSrcDependencies
  for (const srcDependency of facebookWWWSrcDependencies) {
    await asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency)));
  }
}

function copyNodePackageTemplate(packageName) {
  const from = resolve(`./packages/${packageName}`);
  const to = resolve(`./build/packages/${packageName}`);  

  // if the package directory already exists, we skip copying to it
  if (!existsSync(to) && existsSync(from)) {
    return asyncCopyTo(from, to);
  } else {
    return Promise.resolve();
  }
}

function copyBundleIntoNodePackage(packageName, filename, bundleType) {
  const packageDirectory = resolve(`./build/packages/${packageName}`);

  if (existsSync(packageDirectory)) {  
    let from = resolve(`./build/${filename}`);
    let to = `${packageDirectory}/${filename}`;
    // for UMD bundles we have to move the files into a dist directory
    // within the package directory. we also need to set the from
    // to be the root build from directory
    if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
      const distDirectory = `${packageDirectory}/dist`;
      // create a dist directory if not created
      if (!existsSync(distDirectory)) {
        mkdirSync(distDirectory);
      }
      from = resolve(`./build/dist/${filename}`);
      to = `${packageDirectory}/dist/${filename}`;
    }
    return asyncCopyTo(from, to).then(() => {
      // delete the old file if this is a not a UMD bundle
      if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
        unlinkSync(from);
      }
    });
  } else {
    return Promise.resolve();
  }
}

function createNodePackage(bundleType, packageName, filename) {
  // the only case where we don't want to copy the package is for FB bundles
  if (bundleType !== FB_DEV && bundleType !== FB_PROD) {
    return copyNodePackageTemplate(packageName).then(
      () => copyBundleIntoNodePackage(packageName, filename, bundleType)
    );
  }
  return Promise.resolve();
}

function getPlugins(entry, babelOpts, paths, filename, bundleType, isRenderer) {
  const plugins = [
    replace(
      Object.assign(
        replaceInternalModules(),
        replaceFbjsModuleAliases(bundleType),
        replaceDevOnlyStubbedModules(bundleType)
      )
    ),
    babel(updateBabelConfig(babelOpts, bundleType)),
    alias(getAliases(paths, bundleType, isRenderer)),
    commonjs(getCommonJsConfig(bundleType)),
  ];
  if (bundleType === UMD_PROD || bundleType === NODE_PROD || bundleType === FB_PROD) {
    plugins.push(
      uglify(uglifyConfig(bundleType !== FB_PROD)),
      replace(
        stripEnvVariables(true)
      )
    );
  } else if (bundleType === UMD_DEV || bundleType === NODE_DEV || FB_DEV) {
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
  if ((inputBundleType && bundleType.indexOf(inputBundleType) === -1)
    || bundleTypesToUse.indexOf(bundleType) === -1) {
    return Promise.resolve();
  }
  const filename = getFilename(name, hasteName, bundleType);
  const format = getFormat(bundleType);
  return rollup({
    entry: bundleType === FB_DEV || bundleType === FB_PROD ? fbEntry : entry,
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

// clear the build directory
rimraf('build', async () => {
  // create a new build directory
  mkdirSync('build');
  // create the packages folder for NODE+UMD bundles
  mkdirSync(join('build', 'packages'));
  // create the dist folder for UMD bundles
  mkdirSync(join('build', 'dist'));
  // we make these in sync so it doesn't cause IO issues
  await createFacebookWWWBuild();
  await createReactNativeBuild();
  // rather than run concurently, opt to run them serially
  // this helps improve console/warning/error output
  // and fixes a bunch of IO failures that sometimes occured
  for (const bundle of bundles) {
    await createBundle(bundle, UMD_DEV);
    await createBundle(bundle, UMD_PROD);
    await createBundle(bundle, NODE_DEV);
    await createBundle(bundle, NODE_PROD);
    await createBundle(bundle, FB_DEV);
    await createBundle(bundle, FB_PROD);
    await createBundle(bundle, RN);
  }
  if (argv.extractErrors) {
    console.warn(
      '\nWarning: this build was created with --extractErrors enabled.\n' +
      'this will result in extremely slow builds and should only be\n' +
      'used when the error map needs to be rebuilt.\n'
    );
  }
});


