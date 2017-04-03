'use strict';

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
const escapeStringRegexp = require('escape-string-regexp');
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
const { propertyMangleWhitelist } = require('./mangle');

const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

function getAliases(paths, bundleType, isRenderer) {
  return Object.assign(
    getReactCurrentOwnerModuleAlias(bundleType, isRenderer),
    getReactCheckPropTypesModuleAlias(bundleType, isRenderer),
    getReactComponentTreeHookModuleAlias(bundleType, isRenderer),
    createModuleMap(paths, argv.extractErrors && extractErrors(errorCodeOpts), bundleType),
    getInternalModules(),
    getNodeModules(bundleType),
    getFbjsModuleAliases(bundleType)
  );
}

// the facebook-www directory
const facebookWWW = 'facebook-www';

// bundle types for shorthand
const { UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD, FB_DEV, FB_PROD, RN } = bundleTypes;

const reactVersion = require('../../package.json').version;

function getBanner(bundleType, hasteName, filename) {
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN:
      let hasteFinalName = hasteName;
      switch (bundleType) {
        case FB_DEV:
          hasteFinalName += '-dev';
          break;
        case FB_PROD:
          hasteFinalName += '-prod';
          break;
      }
        const fbDevCode = (
          `\n\n'use strict';\n\n` +
          `\nif (__DEV__) {\n`
        );
      return (
`/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ${hasteFinalName}
 */${bundleType === FB_DEV ? fbDevCode : ''}
`
      );
    case UMD_DEV:
    case UMD_PROD:
      return (
`/**
 * ${filename} v${reactVersion}
 */
`
      );
    default:
      return '';
  }
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

function updateBundleConfig(config, filename, format, bundleType, hasteName) {
  let dest = config.destDir + filename;

  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    dest = `${config.destDir}${facebookWWW}/${filename}`;
  } else if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
    dest = `${config.destDir}dist/${filename}`;
  } else if (bundleType === RN) {
    dest = `${config.destDir}react-native/${filename}`;
  }
  return Object.assign({}, config, {
    banner: getBanner(bundleType, hasteName, filename),
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
      return `${name}.development.js`;
    case NODE_PROD:
      return `${name}.production.min.js`;
    case RN:
      return `${hasteName}.js`;
    case FB_DEV:
      return `${hasteName}-dev.js`;
    case FB_PROD:
      return `${hasteName}-prod.js`;
  }
}

const mangleRegex = (
  new RegExp(`^(?${propertyMangleWhitelist.map(prop => `!${escapeStringRegexp(prop)}`).join('|') }$).*$`, 'g')
);

function uglifyConfig(mangle, manglePropertiesOnProd, preserveVersionHeader) {
  return {
    warnings: false,
    compress: {
      screw_ie8: true,
      dead_code: true,
      unused: true,
      drop_debugger: true,
      booleans: true,
      // Our www inline transform combined with Jest resetModules is confused
      // in some rare cases unless we keep all requires at the top:
      hoist_funs: mangle,
    },
    output: {
      beautify: !mangle,
      comments(node, comment) {
        if (preserveVersionHeader && comment.pos === 0 && comment.col === 0) {
          // Keep the very first comment (the bundle header) in prod bundles.
          if (comment.value.indexOf(reactVersion) === -1) {
            // Sanity check: this doesn't look like the bundle header!
            throw new Error(
              'Expected the first comment to be the file header but got: ' +
              comment.value
            );
          }
          return true;
        }
        // Keep all comments in FB bundles.
        return !mangle;
      },
    },
    mangleProperties: mangle && manglePropertiesOnProd ? {
      ignore_quoted: true,
      regex: mangleRegex,
    } : false,
    mangle: mangle ? {
      toplevel: true,
      screw_ie8: true,
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
    // for UMD bundles we have to move the files into a umd directory
    // within the package directory. we also need to set the from
    // to be the root build from directory
    if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
      const distDirectory = `${packageDirectory}/umd`;
      // create a dist directory if not created
      if (!existsSync(distDirectory)) {
        mkdirSync(distDirectory);
      }
      from = resolve(`./build/dist/${filename}`);
      to = `${packageDirectory}/umd/${filename}`;
    }
    // for NODE bundles we have to move the files into a cjs directory
    // within the package directory. we also need to set the from
    // to be the root build from directory
    if (bundleType === NODE_DEV || bundleType === NODE_PROD) {
      const distDirectory = `${packageDirectory}/cjs`;
      // create a dist directory if not created
      if (!existsSync(distDirectory)) {
        mkdirSync(distDirectory);
      }
      to = `${packageDirectory}/cjs/${filename}`;
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

function getPlugins(entry, babelOpts, paths, filename, bundleType, isRenderer, manglePropertiesOnProd) {
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
  ];
  if (bundleType === UMD_PROD || bundleType === NODE_PROD || bundleType === FB_PROD) {
    plugins.push(
      replace(
        stripEnvVariables(true)
      ),
      // needs to happen after strip env
      commonjs(getCommonJsConfig(bundleType)),
      uglify(uglifyConfig(bundleType !== FB_PROD, manglePropertiesOnProd, bundleType === UMD_PROD))
    );
  } else if (bundleType === UMD_DEV || bundleType === NODE_DEV || bundleType === FB_DEV) {
    plugins.push(
      replace(
        stripEnvVariables(false)
      ),
      // needs to happen after strip env
      commonjs(getCommonJsConfig(bundleType))
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
  manglePropertiesOnProd,
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
    plugins: getPlugins(
      entry,
      babelOpts,
      paths,
      filename,
      bundleType,
      isRenderer,
      manglePropertiesOnProd
    ),
  }).then(({write}) => write(
    updateBundleConfig(config, filename, format, bundleType, hasteName)
  )).then(() => (
    createNodePackage(bundleType, name, filename)
  )).catch(error => {
    if (error.code) {
      console.error(`\x1b[31m-- ${error.code} (${error.plugin}) --`);
      console.error(error.message);
      console.error(error.loc);
      console.error(error.codeFrame);
    } else {
      console.error(error);
    }
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


