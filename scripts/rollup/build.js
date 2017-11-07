'use strict';

const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const chalk = require('chalk');
const join = require('path').join;
const resolve = require('path').resolve;
const resolvePlugin = require('rollup-plugin-node-resolve');
const fs = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('./bundles');
const sizes = require('./plugins/sizes-plugin');
const Stats = require('./stats');
const extractErrorCodes = require('../error-codes/extract-errors');
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
const shouldExtractErrors = argv['extract-errors'];
const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

function getHeaderSanityCheck(bundleType, globalName) {
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      let hasteFinalName = globalName;
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

function getBanner(bundleType, globalName, filename, moduleType) {
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
      const hasteFinalName = globalName + (isDev ? '-dev' : '-prod');
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
  let banner = `${Header.getHeader(
    filename,
    reactVersion
  )}\n\n'use strict';\n\n\n`;
  switch (bundleType) {
    case NODE_DEV:
      banner += `if (process.env.NODE_ENV !== "production") {\n${
        RECONCILER_WRAPPER_INTRO
      }`;
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

function getBabelConfig(updateBabelOptions, bundleType, filename) {
  let options = {
    exclude: 'node_modules/**',
    presets: [],
    plugins: [],
  };
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('./plugins/wrap-warning-with-env-check'),
        ]),
      });
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Use object-assign polyfill in open source
          resolve('./scripts/babel/transform-object-assign-require'),

          // Minify invariant messages
          require('../error-codes/replace-invariant-error-codes'),

          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('./plugins/wrap-warning-with-env-check'),
        ]),
      });
    default:
      return options;
  }
}

function handleRollupWarnings(warning) {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    console.error(warning.message);
    process.exit(1);
  }
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
    const match = warning.message.match(/external module '([^']+)'/);
    if (!match || typeof match[1] !== 'string') {
      throw new Error(
        'Could not parse a Rollup warning. ' + 'Fix this method.'
      );
    }
    const importSideEffects = Modules.getImportSideEffects();
    const path = match[1];
    if (typeof importSideEffects[path] !== 'boolean') {
      throw new Error(
        'An external module "' +
          path +
          '" is used in a DEV-only code path ' +
          'but we do not know if it is safe to omit an unused require() to it in production. ' +
          'Please add it to the `importSideEffects` list in `scripts/rollup/modules.js`.'
      );
    }
    // Don't warn. We will remove side effectless require() in a later pass.
    return;
  }
  console.warn(warning.message || warning);
}

function getRollupOutputOptions(
  filename,
  format,
  bundleType,
  globals,
  globalName,
  moduleType
) {
  return Object.assign(
    {},
    {
      banner: getBanner(bundleType, globalName, filename, moduleType),
      destDir: 'build/',
      file:
        'build/' +
        Packaging.getOutputPathRelativeToBuildFolder(
          bundleType,
          filename,
          globalName
        ),
      footer: getFooter(bundleType, filename, moduleType),
      format,
      globals,
      interop: false,
      name: globalName,
      sourcemap: false,
    }
  );
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

function getFilename(name, globalName, bundleType) {
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
      return `${globalName}-dev.js`;
    case FB_PROD:
    case RN_PROD:
      return `${globalName}-prod.js`;
  }
}

function getUglifyConfig(configs) {
  var mangle = configs.mangle;
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
    mangle: mangle
      ? {
          toplevel: true,
          screw_ie8: true,
        }
      : false,
  };
}

// FB uses require('React') instead of require('react').
// We can't set up a forwarding module due to case sensitivity issues.
function rewriteFBReactImport() {
  return {
    transformBundle(source) {
      return source.replace(/require\(['"]react['"]\)/g, "require('React')");
    },
  };
}

// Strip 'use strict' directives in individual modules
// because we always emit them in the file headers.
// The whole bundle is strict.
function stripUseStrict() {
  return {
    transform(source) {
      return source.replace(/['"]use strict['"']/g, '');
    },
  };
}

// Plugin that writes to the error code file so that by the time it is picked
// up by Babel, the errors are already extracted.
function writeErrorCodes() {
  const flush = extractErrorCodes(errorCodeOpts);
  return {
    transform(source) {
      flush(source);
      return source;
    },
  };
}

function getPlugins(
  entry,
  externals,
  updateBabelOptions,
  filename,
  bundleType,
  globalName,
  moduleType,
  modulesToStub,
  featureFlags
) {
  const shims = Modules.getShims(bundleType, entry, featureFlags);
  const plugins = [
    // Extract error codes from invariant() messages into a file.
    shouldExtractErrors && writeErrorCodes(),
    // Shim some modules for www custom behavior and optimizations.
    alias(shims),
    // Use Node resolution mechanism.
    resolvePlugin({
      skip: externals,
    }),
    // Compile to ES5.
    babel(getBabelConfig(updateBabelOptions, bundleType)),
    stripUseStrict(),
  ].filter(Boolean);

  const headerSanityCheck = getHeaderSanityCheck(bundleType, globalName);
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
      plugins.push(replace(stripEnvVariables(false)), commonjs());
      break;
    case UMD_PROD:
    case NODE_PROD:
      plugins.push(
        replace(stripEnvVariables(true)),
        commonjs(),
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
    case FB_DEV:
      plugins.push(
        replace(stripEnvVariables(false)),
        commonjs(),
        rewriteFBReactImport()
      );
      break;
    case FB_PROD:
      plugins.push(
        replace(stripEnvVariables(true)),
        commonjs(),
        uglify(
          getUglifyConfig({
            mangle: bundleType !== FB_PROD,
            preserveVersionHeader: bundleType === UMD_PROD,
            // leave comments in for source map debugging purposes
            // they will be stripped as part of FB's build process
            removeComments: bundleType !== FB_PROD,
            headerSanityCheck,
          })
        ),
        rewriteFBReactImport()
      );
      break;
    case RN_DEV:
    case RN_PROD:
      plugins.push(
        replace(stripEnvVariables(bundleType === RN_PROD)),
        commonjs(),
        uglify(
          getUglifyConfig({
            mangle: false,
            preserveVersionHeader: true,
            removeComments: true,
            headerSanityCheck,
          })
        )
      );
      break;
  }
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

  const filename = getFilename(bundle.entry, bundle.global, bundleType);
  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.entry);

  let resolvedEntry = require.resolve(bundle.entry);
  if (bundleType === FB_DEV || bundleType === FB_PROD) {
    const resolvedFBEntry = resolvedEntry.replace('.js', '.fb.js');
    if (fs.existsSync(resolvedFBEntry)) {
      resolvedEntry = resolvedFBEntry;
    }
  }

  const shouldBundleDependencies =
    bundleType === UMD_DEV || bundleType === UMD_PROD;
  const peerGlobals = Modules.getPeerGlobals(
    bundle.externals,
    bundle.moduleType
  );
  let externals = Object.keys(peerGlobals);
  if (!shouldBundleDependencies) {
    const deps = Modules.getDependencies(bundleType, bundle.entry);
    externals = externals.concat(deps);
  }

  const importSideEffects = Modules.getImportSideEffects();
  const pureExternalModules = Object.keys(importSideEffects).filter(
    module => !importSideEffects[module]
  );

  console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
  return rollup({
    input: resolvedEntry,
    pureExternalModules,
    external(id) {
      const containsThisModule = pkg => id === pkg || id.startsWith(pkg + '/');
      const isProvidedByDependency = externals.some(containsThisModule);
      if (!shouldBundleDependencies && isProvidedByDependency) {
        return true;
      }
      return !!peerGlobals[id];
    },
    onwarn: handleRollupWarnings,
    plugins: getPlugins(
      bundle.entry,
      externals,
      bundle.babel,
      filename,
      bundleType,
      bundle.global,
      bundle.moduleType,
      bundle.modulesToStub,
      bundle.featureFlags
    ),
    // We can't use getters in www.
    legacy: bundleType === FB_DEV || bundleType === FB_PROD,
  })
    .then(result =>
      result.write(
        getRollupOutputOptions(
          filename,
          format,
          bundleType,
          peerGlobals,
          bundle.global,
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
      syncReactNativeRT(join('build', 'react-rt'), syncFbsource)
    );
    tasks.push(() =>
      syncReactNativeCS(join('build', 'react-cs'), syncFbsource)
    );
  } else if (syncWww) {
    tasks.push(() => syncReactDom(join('build', 'facebook-www'), syncWww));
  }
  // rather than run concurrently, opt to run them serially
  // this helps improve console/warning/error output
  // and fixes a bunch of IO failures that sometimes occurred
  return runWaterfall(tasks)
    .then(() => {
      // output the results
      console.log(Stats.printResults());
      // save the results for next run
      Stats.saveResults();
      if (shouldExtractErrors) {
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
