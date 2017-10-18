'use strict';

const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const chalk = require('chalk');
const escapeStringRegexp = require('escape-string-regexp');
const join = require('path').join;
const resolve = require('path').resolve;
const fs = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('./bundles');
const propertyMangleWhitelist = require('./mangle').propertyMangleWhitelist;
const sizes = require('./plugins/sizes-plugin');
const Stats = require('./stats');
const syncReactDom = require('./sync').syncReactDom;
const syncReactNative = require('./sync').syncReactNative;
const syncReactNativeRT = require('./sync').syncReactNativeRT;
const syncReactNativeCS = require('./sync').syncReactNativeCS;
const Packaging = require('./packaging');
const Header = require('./header');
const closure = require('rollup-plugin-closure-compiler-js');

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const NODE_DEV = Bundles.bundleTypes.NODE_DEV;
const NODE_PROD = Bundles.bundleTypes.NODE_PROD;
const FB_DEV = Bundles.bundleTypes.FB_DEV;
const FB_PROD = Bundles.bundleTypes.FB_PROD;
const RN_DEV = Bundles.bundleTypes.RN_DEV;
const RN_PROD = Bundles.bundleTypes.RN_PROD;

const RECONCILER = Bundles.moduleTypes.RECONCILER;

const reactVersion = require('../../package.json').version;
const requestedBundleTypes = (argv.type || '')
  .split(',')
  .map(type => type.toUpperCase());
const requestedBundleNames = (argv._[0] || '')
  .split(',')
  .map(type => type.toLowerCase());
const syncFbsource = argv['sync-fbsource'];
const syncWww = argv['sync-www'];

// used for when we property mangle with uglify/gcc
const mangleRegex = new RegExp(
  `^(?${propertyMangleWhitelist
    .map(prop => `!${escapeStringRegexp(prop)}`)
    .join('|')}$).*$`,
  'g'
);

function getHeaderSanityCheck(bundleType, hasteName) {
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      let hasteFinalName = hasteName;
      switch (bundleType) {
        case FB_DEV:
        case RN_DEV:
          hasteFinalName += '-dev';
          break;
        case FB_PROD:
        case RN_PROD:
          hasteFinalName += '-prod';
          break;
      }
      return hasteFinalName;
    case UMD_DEV:
    case UMD_PROD:
      return reactVersion;
    default:
      return null;
  }
}

function getBanner(bundleType, hasteName, filename, moduleType) {
  if (moduleType === RECONCILER) {
    // Standalone reconciler is only used by third-party renderers.
    // It is handled separately.
    return getReconcilerBanner(bundleType, filename);
  }

  switch (bundleType) {
    // UMDs are not wrapped in conditions.
    case UMD_DEV:
    case UMD_PROD:
      return Header.getHeader(filename, reactVersion);
    // CommonJS DEV bundle is guarded to help weak dead code elimination.
    case NODE_DEV:
      let banner = Header.getHeader(filename, reactVersion);
      // Wrap the contents of the if-DEV check with an IIFE.
      // Block-level function definitions can cause problems for strict mode.
      banner += `'use strict';\n\n\nif (process.env.NODE_ENV !== "production") {\n(function() {\n`;
      return banner;
    case NODE_PROD:
      return Header.getHeader(filename, reactVersion);
    // All FB and RN bundles need Haste headers.
    // DEV bundle is guarded to help weak dead code elimination.
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      const isDev = bundleType === FB_DEV || bundleType === RN_DEV;
      const hasteFinalName = hasteName + (isDev ? '-dev' : '-prod');
      // Wrap the contents of the if-DEV check with an IIFE.
      // Block-level function definitions can cause problems for strict mode.
      return (
        Header.getProvidesHeader(hasteFinalName) +
        (isDev ? `\n\n'use strict';\n\n\nif (__DEV__) {\n(function() {\n` : '')
      );
    default:
      throw new Error('Unknown type.');
  }
}

function getFooter(bundleType, filename, moduleType) {
  if (moduleType === RECONCILER) {
    // Standalone reconciler is only used by third-party renderers.
    // It is handled separately.
    return getReconcilerFooter(bundleType);
  }

  // Only need a footer if getBanner() has an opening brace.
  switch (bundleType) {
    // Non-UMD DEV bundles need conditions to help weak dead code elimination.
    case NODE_DEV:
    case FB_DEV:
    case RN_DEV:
      return '\n})();\n}\n';
    default:
      return '';
  }
}

// TODO: this is extremely gross.
// But it only affects the "experimental" standalone reconciler build.
// The goal is to avoid having any shared state between renderers sharing it on npm.
// Ideally we should just remove shared state in all Fiber modules and then lint against it.
// But for now, we store the exported function in a variable, and then put the rest of the code
// into a closure that makes all module-level state private to each call.
const RECONCILER_WRAPPER_INTRO = `var $$$reconciler;\nmodule.exports = function(config) {\n`;
const RECONCILER_WRAPPER_OUTRO = `return ($$$reconciler || ($$$reconciler = module.exports))(config);\n};\n`;

function getReconcilerBanner(bundleType, filename) {
  let banner = `${Header.getHeader(filename, reactVersion)}\n\n'use strict';\n\n\n`;
  switch (bundleType) {
    case NODE_DEV:
      banner += `if (process.env.NODE_ENV !== "production") {\n${RECONCILER_WRAPPER_INTRO}`;
      break;
    case NODE_PROD:
      banner += RECONCILER_WRAPPER_INTRO;
      break;
    default:
      throw new Error(
        'Standalone reconciler does not support ' + bundleType + ' builds.'
      );
  }
  return banner;
}

function getReconcilerFooter(bundleType) {
  switch (bundleType) {
    case NODE_DEV:
      return `\n${RECONCILER_WRAPPER_OUTRO}\n}`;
    case NODE_PROD:
      return `\n${RECONCILER_WRAPPER_OUTRO}`;
    default:
      throw new Error(
        'Standalone reconciler does not support ' + bundleType + ' builds.'
      );
  }
}

function updateBabelConfig(babelOpts, bundleType, filename) {
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      return Object.assign({}, babelOpts, {
        plugins: babelOpts.plugins.concat([
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('./plugins/wrap-warning-with-env-check'),
        ]),
      });
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
      return Object.assign({}, babelOpts, {
        plugins: babelOpts.plugins.concat([
          // Use object-assign polyfill in open source
          resolve('./scripts/babel/transform-object-assign-require'),

          // Minify invariant messages
          require('../error-codes/replace-invariant-error-codes'),

          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('./plugins/wrap-warning-with-env-check'),
        ]),
      });
    default:
      return babelOpts;
  }
}

function handleRollupWarnings(warning) {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    console.error(warning.message);
    process.exit(1);
  }
  console.warn(warning.message || warning);
}

function updateBundleConfig(
  config,
  filename,
  format,
  bundleType,
  hasteName,
  moduleType
) {
  return Object.assign({}, config, {
    banner: getBanner(bundleType, hasteName, filename, moduleType),
    dest: Packaging.getPackageDestination(
      config,
      bundleType,
      filename,
      hasteName
    ),
    footer: getFooter(bundleType, filename, moduleType),
    format,
    interop: false,
  });
}

function stripEnvVariables(production) {
  return {
    __DEV__: production ? 'false' : 'true',
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

function uglifyConfig(configs) {
  var mangle = configs.mangle;
  var manglePropertiesOnProd = configs.manglePropertiesOnProd;
  var preserveVersionHeader = configs.preserveVersionHeader;
  var removeComments = configs.removeComments;
  var headerSanityCheck = configs.headerSanityCheck;
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
          if (
            headerSanityCheck &&
            comment.value.indexOf(headerSanityCheck) === -1
          ) {
            // Sanity check: this doesn't look like the bundle header!
            throw new Error(
              'Expected the first comment to be the file header but got: ' +
                comment.value
            );
          }
          return true;
        }
        return !removeComments;
      },
    },
    mangleProperties: mangle && manglePropertiesOnProd
      ? {
          ignore_quoted: true,
          regex: mangleRegex,
        }
      : false,
    mangle: mangle
      ? {
          toplevel: true,
          screw_ie8: true,
        }
      : false,
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

function getPlugins(
  entry,
  babelOpts,
  paths,
  filename,
  bundleType,
  hasteName,
  moduleType,
  manglePropertiesOnProd,
  modulesToStub
) {
  const plugins = [
    babel(updateBabelConfig(babelOpts, bundleType)),
    alias(
      Modules.getAliases(paths, bundleType, moduleType, argv['extract-errors'])
    ),
  ];

  const replaceModules = Modules.getDefaultReplaceModules(
    bundleType,
    modulesToStub
  );

  // We have to do this check because Rollup breaks on empty object.
  // TODO: file an issue with rollup-plugin-replace.
  if (Object.keys(replaceModules).length > 0) {
    plugins.unshift(replace(replaceModules));
  }

  const headerSanityCheck = getHeaderSanityCheck(bundleType, hasteName);

  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_DEV:
      plugins.push(
        replace(stripEnvVariables(false)),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType))
      );
      break;
    case UMD_PROD:
    case NODE_PROD:
      plugins.push(
        replace(stripEnvVariables(true)),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType)),
        closure({
          compilationLevel: 'SIMPLE',
          languageIn: 'ECMASCRIPT5_STRICT',
          languageOut: 'ECMASCRIPT5_STRICT',
          env: 'CUSTOM',
          warningLevel: 'QUIET',
          // Don't let it create global variables in the browser.
          // https://github.com/facebook/react/issues/10909
          assumeFunctionWrapper: bundleType !== UMD_PROD,
          applyInputSourceMaps: false,
          useTypesForOptimization: false,
          processCommonJsModules: false,
        })
      );
      break;
    case FB_PROD:
      plugins.push(
        replace(stripEnvVariables(true)),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType)),
        uglify(
          uglifyConfig({
            mangle: bundleType !== FB_PROD,
            manglePropertiesOnProd,
            preserveVersionHeader: bundleType === UMD_PROD,
            // leave comments in for source map debugging purposes
            // they will be stripped as part of FB's build process
            removeComments: bundleType !== FB_PROD,
            headerSanityCheck,
          })
        )
      );
      break;
    case RN_DEV:
    case RN_PROD:
      plugins.push(
        replace(stripEnvVariables(bundleType === RN_PROD)),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType)),
        uglify(
          uglifyConfig({
            mangle: false,
            manglePropertiesOnProd,
            preserveVersionHeader: true,
            removeComments: true,
            headerSanityCheck,
          })
        )
      );
      break;
  }
  // this needs to come last or it doesn't report sizes correctly
  plugins.push(
    sizes({
      getSize: (size, gzip) => {
        const key = `${filename} (${bundleType})`;
        Stats.currentBuildResults.bundleSizes[key] = {
          size,
          gzip,
        };
      },
    })
  );

  return plugins;
}

function createBundle(bundle, bundleType) {
  const shouldSkipBundleType = bundle.bundleTypes.indexOf(bundleType) === -1;
  if (shouldSkipBundleType) {
    return Promise.resolve();
  }
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      requestedType => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return Promise.resolve();
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => bundle.label.indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return Promise.resolve();
    }
  }

  const filename = getFilename(bundle.name, bundle.hasteName, bundleType);
  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.name);

  console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
  return rollup({
    entry: bundleType === FB_DEV || bundleType === FB_PROD
      ? bundle.fbEntry
      : bundle.entry,
    external: Modules.getExternalModules(
      bundle.externals,
      bundleType,
      bundle.moduleType
    ),
    onwarn: handleRollupWarnings,
    plugins: getPlugins(
      bundle.entry,
      bundle.babelOpts,
      bundle.paths,
      filename,
      bundleType,
      bundle.hasteName,
      bundle.moduleType,
      bundle.manglePropertiesOnProd,
      bundle.modulesToStub
    ),
  })
    .then(result =>
      result.write(
        updateBundleConfig(
          bundle.config,
          filename,
          format,
          bundleType,
          bundle.hasteName,
          bundle.moduleType
        )
      )
    )
    .then(() => Packaging.createNodePackage(bundleType, packageName, filename))
    .then(() => {
      console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
    })
    .catch(error => {
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
    Packaging.createFacebookWWWBuild,
    Packaging.createReactNativeBuild,
    Packaging.createReactNativeRTBuild,
    Packaging.createReactNativeCSBuild,
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
  if (syncFbsource) {
    tasks.push(() =>
      syncReactNative(join('build', 'react-native'), syncFbsource)
    );
    tasks.push(() =>
      syncReactNativeRT(join('build', 'react-native-rt'), syncFbsource)
    );
    tasks.push(() =>
      syncReactNativeCS(join('build', 'react-native-cs'), syncFbsource)
    );
  } else if (syncWww) {
    tasks.push(() => syncReactDom(join('build', 'facebook-www'), syncWww));
  }
  // rather than run concurently, opt to run them serially
  // this helps improve console/warning/error output
  // and fixes a bunch of IO failures that sometimes occurred
  return runWaterfall(tasks)
    .then(() => {
      // output the results
      console.log(Stats.printResults());
      // save the results for next run
      Stats.saveResults();
      if (argv['extract-errors']) {
        console.warn(
          '\nWarning: this build was created with --extract-errors enabled.\n' +
            'this will result in extremely slow builds and should only be\n' +
            'used when the error map needs to be rebuilt.\n'
        );
      }
    })
    .catch(err => {
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
