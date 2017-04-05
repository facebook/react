'use strict';

const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const filesize = require('filesize');
const ncp = require('ncp').ncp;
const chalk = require('chalk');
const Table = require('cli-table');
const escapeStringRegexp = require('escape-string-regexp');
const basename = require('path').basename;
const join = require('path').join;
const resolve = require('path').resolve;
const fs = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const extractErrors = require('../error-codes/extract-errors');
const Modules = require('./modules');
const Bundles = require('./bundles');
const propertyMangleWhitelist = require('./mangle').propertyMangleWhitelist;
const sizes = require('./plugins/sizes-plugin');
const branch = require('git-branch');

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const NODE_DEV = Bundles.bundleTypes.NODE_DEV;
const NODE_PROD = Bundles.bundleTypes.NODE_PROD;
const FB_DEV = Bundles.bundleTypes.FB_DEV;
const FB_PROD = Bundles.bundleTypes.FB_PROD;
const RN_DEV = Bundles.bundleTypes.RN_DEV;
const RN_PROD = Bundles.bundleTypes.RN_PROD;

const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};
const reactVersion = require('../../package.json').version;
const inputBundleType = argv.type;
const prevBuildResults = require('./results.json');
const facebookWWW = 'facebook-www';

const currentBuildResults = {
  branch: branch.sync(),
  // Mutated during the build.
  bundleSizes: Object.assign({}, prevBuildResults.bundleSizes),
};

// used for when we property mangle with uglify/gcc
const mangleRegex = (
  new RegExp(`^(?${propertyMangleWhitelist.map(prop => `!${escapeStringRegexp(prop)}`).join('|') }$).*$`, 'g')
);

function getAliases(paths, bundleType, isRenderer) {
  return Object.assign(
    Modules.getReactCurrentOwnerModuleAlias(bundleType, isRenderer),
    Modules.getReactCheckPropTypesModuleAlias(bundleType, isRenderer),
    Modules.getReactComponentTreeHookModuleAlias(bundleType, isRenderer),
    Modules.createModuleMap(paths, argv.extractErrors && extractErrors(errorCodeOpts), bundleType),
    Modules.getInternalModules(),
    Modules.getNodeModules(bundleType),
    Modules.getFbjsModuleAliases(bundleType)
  );
}

function getBanner(bundleType, hasteName, filename) {
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
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
    case RN_DEV:
    case RN_PROD:
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
  } else if (bundleType === RN_DEV || bundleType === RN_PROD) {
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
    case RN_DEV:
    case RN_PROD:
      return `cjs`;
  }
}

function getFilename(name, hasteName, bundleType) {
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/', '-');
  switch (bundleType) {
    case UMD_DEV:
      return `${name}.development.js`;
    case UMD_PROD:
      return `${name}.production.min.js`;
    case NODE_DEV:
      return `${name}.development.js`;
    case NODE_PROD:
      return `${name}.production.min.js`;
    case FB_DEV:
    case RN_DEV:
      return `${hasteName}-dev.js`;
    case FB_PROD:
    case RN_PROD:
      return `${hasteName}-prod.js`;
  }
}

function uglifyConfig(mangle, manglePropertiesOnProd, preserveVersionHeader) {
  return {
    warnings: false,
    compress: {
      screw_ie8: true,
      dead_code: true,
      unused: true,
      drop_debugger: true,
      // we have a string literal <script> that we don't want to evaluate
      // for FB prod bundles (where we disable mangling)
      evaluate: mangle,
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
    case RN_DEV:
    case RN_PROD:
      return {
        ignore: Modules.ignoreReactNativeModules(),
      };
    case FB_DEV:
    case FB_PROD:
      // Modules we don't want to inline in the bundle.
      // Force them to stay as require()s in the output.
      return {
        ignore: Modules.ignoreFBModules(),
      };
  }
}

function asyncCopyTo(from, to) {
  return new Promise(_resolve => {
    ncp(from, to, error => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      _resolve();
    });
  });
}

function createReactNativeBuild() {
  // create the react-native folder for FB bundles
  fs.mkdirSync(join('build', 'react-native'));
  // create the react-native shims folder for FB shims
  fs.mkdirSync(join('build', 'react-native', 'shims'));
  // copy in all the shims from build/rollup/shims/react-native
  const from = join('scripts', 'rollup', 'shims', 'react-native');
  const to = join('build', 'react-native', 'shims');

  return asyncCopyTo(from, to);
}

function createFacebookWWWBuild() {
  // create the facebookWWW folder for FB bundles
  fs.mkdirSync(join('build', facebookWWW));
  // create the facebookWWW shims folder for FB shims
  fs.mkdirSync(join('build', facebookWWW, 'shims'));
  // copy in all the shims from build/rollup/shims/facebook-www
  const from = join('scripts', 'rollup', 'shims', facebookWWW);
  const to = join('build', facebookWWW, 'shims');

  return asyncCopyTo(from, to).then(() => {
    let promises = [];
    // we also need to copy over some specific files from src
    // defined in facebookWWWSrcDependencies
    for (const srcDependency of Modules.facebookWWWSrcDependencies) {
      promises.push(asyncCopyTo(resolve(srcDependency), join(to, basename(srcDependency))));
    }
    return Promise.all(promises);
  });
}

function copyNodePackageTemplate(packageName) {
  const from = resolve(`./packages/${packageName}`);
  const to = resolve(`./build/packages/${packageName}`);  

  // if the package directory already exists, we skip copying to it
  if (!fs.existsSync(to) && fs.existsSync(from)) {
    return Promise.all([
      asyncCopyTo(from, to),
      asyncCopyTo(resolve('./LICENSE'), `${to}/LICENSE`),
      asyncCopyTo(resolve('./PATENTS'), `${to}/PATENTS`),
    ]);
  } else {
    return Promise.resolve();
  }
}

function copyBundleIntoNodePackage(packageName, filename, bundleType) {
  const packageDirectory = resolve(`./build/packages/${packageName}`);

  if (fs.existsSync(packageDirectory)) {
    let from = resolve(`./build/${filename}`);
    let to = `${packageDirectory}/${filename}`;
    // for UMD bundles we have to move the files into a umd directory
    // within the package directory. we also need to set the from
    // to be the root build from directory
    if (bundleType === UMD_DEV || bundleType === UMD_PROD) {
      const distDirectory = `${packageDirectory}/umd`;
      // create a dist directory if not created
      if (!fs.existsSync(distDirectory)) {
        fs.mkdirSync(distDirectory);
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
      if (!fs.existsSync(distDirectory)) {
        fs.mkdirSync(distDirectory);
      }
      to = `${packageDirectory}/cjs/${filename}`;
    }
    return asyncCopyTo(from, to).then(() => {
      // delete the old file if this is a not a UMD bundle
      if (bundleType !== UMD_DEV && bundleType !== UMD_PROD) {
        fs.unlinkSync(from);
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

function saveResults() {
  fs.writeFileSync(
    join('scripts', 'rollup', 'results.json'),
    JSON.stringify(currentBuildResults, null, 2)
  );
}

function percentChange(prev, current) {
  const change = Math.floor((current - prev) / prev * 100);

  if (change > 0) {
    return chalk.red.bold(`+${change} %`);
  } else if (change <= 0) {
    return chalk.green.bold(change + ' %');
  }
}

function printResults() {
  const table = new Table({
    head: [
      chalk.gray.yellow('Bundle'),
      chalk.gray.yellow('Prev Size'),
      chalk.gray.yellow('Current Size'),
      chalk.gray.yellow('Diff'),
      chalk.gray.yellow('Prev Gzip'),
      chalk.gray.yellow('Current Gzip'),
      chalk.gray.yellow('Diff'),
    ],
  });
  Object.keys(currentBuildResults.bundleSizes).forEach(key => {
    const result = currentBuildResults.bundleSizes[key];
    const prev = prevBuildResults.bundleSizes[key];
    if (result === prev) {
      // We didn't rebuild this bundle.
      return;
    }

    const size = result.size;
    const gzip = result.gzip;
    let prevSize = prev ? prev.size : 0;
    let prevGzip = prev ? prev.gzip : 0;
    table.push([
      chalk.white.bold(key),
      chalk.gray.bold(filesize(prevSize)),
      chalk.white.bold(filesize(size)),
      percentChange(prevSize, size),
      chalk.gray.bold(filesize(prevGzip)),
      chalk.white.bold(filesize(gzip)),
      percentChange(prevGzip, gzip),
    ]);
  });
  return (
    table.toString() + 
    `\n\nThe difference was compared to the last build on "${
      chalk.green.bold(prevBuildResults.branch)
    }" branch.\n`
  );
}

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
}

function getPlugins(entry, babelOpts, paths, filename, bundleType, isRenderer, manglePropertiesOnProd) {
  const plugins = [
    replace(
      Object.assign({},
        Modules.replaceInternalModules(),
        Modules.replaceFbjsModuleAliases(bundleType),
        Modules.replaceDevOnlyStubbedModules(bundleType)
      )
    ),
    babel(updateBabelConfig(babelOpts, bundleType)),
    alias(getAliases(paths, bundleType, isRenderer)),
  ];
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_DEV:
    case RN_PROD:
      plugins.push(
        replace(
          stripEnvVariables(false)
        ),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType))
      );
      break;
    case UMD_PROD:
    case NODE_PROD:
    case FB_PROD:
    case RN_DEV:
      plugins.push(
        replace(
          stripEnvVariables(true)
        ),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType)),
        uglify(uglifyConfig(bundleType !== FB_PROD, manglePropertiesOnProd, bundleType === UMD_PROD))
      );
      break;
  }
  // this needs to come last or it doesn't report sizes correctly
  plugins.push(
    sizes({
      getSize: (size, gzip) => {
        const key = `${filename} (${bundleType})`;
        currentBuildResults.bundleSizes[key] = {
          size,
          gzip,
        };
      },
    })
  );

  return plugins;
}

function createBundle(bundle, bundleType) {
  if ((inputBundleType && bundleType.indexOf(inputBundleType) === -1)
    || bundle.bundleTypes.indexOf(bundleType) === -1) {
    // Skip this bundle because its config doesn't specify this target.
    return Promise.resolve();
  }

  const filename = getFilename(bundle.name, bundle.hasteName, bundleType);
  const logKey = chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = getPackageName(bundle.name);

  console.log(`${chalk.bgYellow.black(' STARTING ')} ${logKey}`);
  return rollup({
    entry: (bundleType === FB_DEV || bundleType === FB_PROD) ? bundle.fbEntry : bundle.entry,
    external: Modules.getExternalModules(bundle.externals, bundleType, bundle.isRenderer),
    onwarn: handleRollupWarnings,
    plugins: getPlugins(
      bundle.entry,
      bundle.babelOpts,
      bundle.paths,
      filename,
      bundleType,
      bundle.isRenderer,
      bundle.manglePropertiesOnProd
    ),
  }).then(result => result.write(
    updateBundleConfig(bundle.config, filename, format, bundleType, bundle.hasteName)
  )).then(() => (
    createNodePackage(bundleType, packageName, filename)
  )).then(() => {
    console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
  }).catch(error => {
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
rimraf('build', () => {
  // create a new build directory
  fs.mkdirSync('build');
  // create the packages folder for NODE+UMD bundles
  fs.mkdirSync(join('build', 'packages'));
  // create the dist folder for UMD bundles
  fs.mkdirSync(join('build', 'dist'));

  const tasks = [
    createFacebookWWWBuild,
    createReactNativeBuild,
  ];
  for (const bundle of Bundles.bundles) {
    tasks.push(
      () => createBundle(bundle, UMD_DEV),
      () => createBundle(bundle, UMD_PROD),
      () => createBundle(bundle, NODE_DEV),
      () => createBundle(bundle, NODE_PROD),
      () => createBundle(bundle, FB_DEV),
      () => createBundle(bundle, FB_PROD),
      () => createBundle(bundle, RN_DEV),
      () => createBundle(bundle, RN_PROD)
    );
  }
  // rather than run concurently, opt to run them serially
  // this helps improve console/warning/error output
  // and fixes a bunch of IO failures that sometimes occured
  return runWaterfall(tasks).then(() => {
    // output the results
    console.log(printResults());
    // save the results for next run
    saveResults();
    if (argv.extractErrors) {
      console.warn(
        '\nWarning: this build was created with --extractErrors enabled.\n' +
        'this will result in extremely slow builds and should only be\n' +
        'used when the error map needs to be rebuilt.\n'
      );
    }
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
});

function runWaterfall(promiseFactories) {
  if (promiseFactories.length === 0) {
    return Promise.resolve();
  }

  const head = promiseFactories[0];
  const tail = promiseFactories.slice(1);

  const nextPromiseFactory = head;
  const nextPromise = nextPromiseFactory();
  if (!nextPromise || typeof nextPromise.then !== 'function') {
    throw new Error('runWaterfall() received something that is not a Promise.');
  }

  return nextPromise.then(() => {
    return runWaterfall(tail);
  });
}
