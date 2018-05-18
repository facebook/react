'use strict';

const {rollup} = require('rollup');
const babel = require('rollup-plugin-babel');
const closure = require('./plugins/closure-plugin');
const commonjs = require('rollup-plugin-commonjs');
const prettier = require('rollup-plugin-prettier');
const replace = require('rollup-plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const chalk = require('chalk');
const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('./bundles');
const Stats = require('./stats');
const Sync = require('./sync');
const sizes = require('./plugins/sizes-plugin');
const useForks = require('./plugins/use-forks-plugin');
const extractErrorCodes = require('../error-codes/extract-errors');
const Packaging = require('./packaging');
const {asyncCopyTo, asyncRimRaf} = require('./utils');
const codeFrame = require('babel-code-frame');
const Wrappers = require('./wrappers');

// Errors in promises should be fatal.
let loggedErrors = new Set();
process.on('unhandledRejection', err => {
  if (loggedErrors.has(err)) {
    // No need to print it twice.
    process.exit(1);
  }
  throw err;
});

const {
  UMD_DEV,
  UMD_PROD,
  NODE_DEV,
  NODE_PROD,
  FB_WWW_DEV,
  FB_WWW_PROD,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_FB_DEV,
  RN_FB_PROD,
} = Bundles.bundleTypes;

const requestedBundleTypes = (argv.type || '')
  .split(',')
  .map(type => type.toUpperCase());
const requestedBundleNames = (argv._[0] || '')
  .split(',')
  .map(type => type.toLowerCase());
const forcePrettyOutput = argv.pretty;
const syncFBSourcePath = argv['sync-fbsource'];
const syncWWWPath = argv['sync-www'];
const shouldExtractErrors = argv['extract-errors'];
const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

const closureOptions = {
  compilation_level: 'SIMPLE',
  language_in: 'ECMASCRIPT5_STRICT',
  language_out: 'ECMASCRIPT5_STRICT',
  env: 'CUSTOM',
  warning_level: 'QUIET',
  apply_input_source_maps: false,
  use_types_for_optimization: false,
  process_common_js_modules: false,
  rewrite_polyfills: false,
};

function getBabelConfig(updateBabelOptions, bundleType, filename) {
  let options = {
    exclude: '/**/node_modules/**',
    presets: [],
    plugins: [],
  };
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }
  switch (bundleType) {
    case FB_WWW_DEV:
    case FB_WWW_PROD:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Minify invariant messages
          require('../error-codes/replace-invariant-error-codes'),
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('../babel/wrap-warning-with-env-check'),
        ]),
      });
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case RN_FB_DEV:
    case RN_FB_PROD:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('../babel/wrap-warning-with-env-check'),
        ]),
      });
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Use object-assign polyfill in open source
          path.resolve('./scripts/babel/transform-object-assign-require'),
          // Minify invariant messages
          require('../error-codes/replace-invariant-error-codes'),
          // Wrap warning() calls in a __DEV__ check so they are stripped from production.
          require('../babel/wrap-warning-with-env-check'),
        ]),
      });
    default:
      return options;
  }
}

function getRollupOutputOptions(outputPath, format, globals, globalName) {
  return Object.assign(
    {},
    {
      file: outputPath,
      format,
      globals,
      interop: false,
      name: globalName,
      sourcemap: false,
    }
  );
}

function getFormat(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      return `umd`;
    case NODE_DEV:
    case NODE_PROD:
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case RN_FB_DEV:
    case RN_FB_PROD:
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
    case FB_WWW_DEV:
    case RN_OSS_DEV:
    case RN_FB_DEV:
      return `${globalName}-dev.js`;
    case FB_WWW_PROD:
    case RN_OSS_PROD:
    case RN_FB_PROD:
      return `${globalName}-prod.js`;
  }
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_WWW_DEV:
    case RN_OSS_DEV:
    case RN_FB_DEV:
      return false;
    case UMD_PROD:
    case NODE_PROD:
    case FB_WWW_PROD:
    case RN_OSS_PROD:
    case RN_FB_PROD:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function getPlugins(
  entry,
  externals,
  updateBabelOptions,
  filename,
  packageName,
  bundleType,
  globalName,
  moduleType,
  modulesToStub
) {
  const findAndRecordErrorCodes = extractErrorCodes(errorCodeOpts);
  const forks = Modules.getForks(bundleType, entry);
  const isProduction = isProductionBundleType(bundleType);
  const isInGlobalScope = bundleType === UMD_DEV || bundleType === UMD_PROD;
  const isFBBundle = bundleType === FB_WWW_DEV || bundleType === FB_WWW_PROD;
  const isRNBundle =
    bundleType === RN_OSS_DEV ||
    bundleType === RN_OSS_PROD ||
    bundleType === RN_FB_DEV ||
    bundleType === RN_FB_PROD;
  const shouldStayReadable = isFBBundle || isRNBundle || forcePrettyOutput;
  return [
    // Extract error codes from invariant() messages into a file.
    shouldExtractErrors && {
      transform(source) {
        findAndRecordErrorCodes(source);
        return source;
      },
    },
    // Shim any modules that need forking in this environment.
    useForks(forks),
    // Use Node resolution mechanism.
    resolve({
      skip: externals,
    }),
    // Remove license headers from individual modules
    stripBanner({
      exclude: 'node_modules/**/*',
    }),
    // Compile to ES5.
    babel(getBabelConfig(updateBabelOptions, bundleType)),
    // Remove 'use strict' from individual source files.
    {
      transform(source) {
        return source.replace(/['"]use strict['"']/g, '');
      },
    },
    // Turn __DEV__ and process.env checks into constants.
    replace({
      __DEV__: isProduction ? 'false' : 'true',
      'process.env.NODE_ENV': isProduction ? "'production'" : "'development'",
    }),
    // We still need CommonJS for external deps like object-assign.
    commonjs(),
    // www still needs require('React') rather than require('react')
    isFBBundle && {
      transformBundle(source) {
        return source
          .replace(/require\(['"]react['"]\)/g, "require('React')")
          .replace(/require\(['"]react-is['"]\)/g, "require('ReactIs')");
      },
    },
    // Apply dead code elimination and/or minification.
    isProduction &&
      closure(
        Object.assign({}, closureOptions, {
          // Don't let it create global variables in the browser.
          // https://github.com/facebook/react/issues/10909
          assume_function_wrapper: !isInGlobalScope,
          // Works because `google-closure-compiler-js` is forked in Yarn lockfile.
          // We can remove this if GCC merges my PR:
          // https://github.com/google/closure-compiler/pull/2707
          // and then the compiled version is released via `google-closure-compiler-js`.
          renaming: !shouldStayReadable,
        })
      ),
    // Add the whitespace back if necessary.
    shouldStayReadable && prettier(),
    // License and haste headers, top-level `if` blocks.
    {
      transformBundle(source) {
        return Wrappers.wrapBundle(
          source,
          bundleType,
          globalName,
          filename,
          moduleType
        );
      },
    },
    // Record bundle size.
    sizes({
      getSize: (size, gzip) => {
        const currentSizes = Stats.currentBuildResults.bundleSizes;
        const recordIndex = currentSizes.findIndex(
          record =>
            record.filename === filename && record.bundleType === bundleType
        );
        const index = recordIndex !== -1 ? recordIndex : currentSizes.length;
        currentSizes[index] = {
          filename,
          bundleType,
          packageName,
          size,
          gzip,
        };
      },
    }),
  ].filter(Boolean);
}

function shouldSkipBundle(bundle, bundleType) {
  const shouldSkipBundleType = bundle.bundleTypes.indexOf(bundleType) === -1;
  if (shouldSkipBundleType) {
    return true;
  }
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      requestedType => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return true;
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => bundle.label.indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return true;
    }
  }
  return false;
}

async function createBundle(bundle, bundleType) {
  if (shouldSkipBundle(bundle, bundleType)) {
    return;
  }

  const filename = getFilename(bundle.entry, bundle.global, bundleType);
  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.entry);

  let resolvedEntry = require.resolve(bundle.entry);
  if (bundleType === FB_WWW_DEV || bundleType === FB_WWW_PROD) {
    const resolvedFBEntry = resolvedEntry.replace('.js', '.fb.js');
    if (fs.existsSync(resolvedFBEntry)) {
      resolvedEntry = resolvedFBEntry;
    }
  }

  const shouldBundleDependencies =
    bundleType === UMD_DEV || bundleType === UMD_PROD;
  const peerGlobals = Modules.getPeerGlobals(bundle.externals, bundleType);
  let externals = Object.keys(peerGlobals);
  if (!shouldBundleDependencies) {
    const deps = Modules.getDependencies(bundleType, bundle.entry);
    externals = externals.concat(deps);
  }

  const importSideEffects = Modules.getImportSideEffects();
  const pureExternalModules = Object.keys(importSideEffects).filter(
    module => !importSideEffects[module]
  );

  const rollupConfig = {
    input: resolvedEntry,
    treeshake: {
      pureExternalModules,
    },
    external(id) {
      const containsThisModule = pkg => id === pkg || id.startsWith(pkg + '/');
      const isProvidedByDependency = externals.some(containsThisModule);
      if (!shouldBundleDependencies && isProvidedByDependency) {
        return true;
      }
      return !!peerGlobals[id];
    },
    onwarn: handleRollupWarning,
    plugins: getPlugins(
      bundle.entry,
      externals,
      bundle.babel,
      filename,
      packageName,
      bundleType,
      bundle.global,
      bundle.moduleType,
      bundle.modulesToStub
    ),
    // We can't use getters in www.
    legacy: bundleType === FB_WWW_DEV || bundleType === FB_WWW_PROD,
  };
  const [mainOutputPath, ...otherOutputPaths] = Packaging.getBundleOutputPaths(
    bundleType,
    filename,
    packageName
  );
  const rollupOutputOptions = getRollupOutputOptions(
    mainOutputPath,
    format,
    peerGlobals,
    bundle.global
  );

  console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
  try {
    const result = await rollup(rollupConfig);
    await result.write(rollupOutputOptions);
  } catch (error) {
    console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
    handleRollupError(error);
    throw error;
  }
  for (let i = 0; i < otherOutputPaths.length; i++) {
    await asyncCopyTo(mainOutputPath, otherOutputPaths[i]);
  }
  console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
}

function handleRollupWarning(warning) {
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
    const externalModule = match[1];
    if (typeof importSideEffects[externalModule] !== 'boolean') {
      throw new Error(
        'An external module "' +
          externalModule +
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

function handleRollupError(error) {
  loggedErrors.add(error);
  if (!error.code) {
    console.error(error);
    return;
  }
  console.error(
    `\x1b[31m-- ${error.code}${error.plugin ? ` (${error.plugin})` : ''} --`
  );
  console.error(error.stack);
  if (error.loc && error.loc.file) {
    const {file, line, column} = error.loc;
    // This looks like an error from Rollup, e.g. missing export.
    // We'll use the accurate line numbers provided by Rollup but
    // use Babel code frame because it looks nicer.
    const rawLines = fs.readFileSync(file, 'utf-8');
    // column + 1 is required due to rollup counting column start position from 0
    // whereas babel-code-frame counts from 1
    const frame = codeFrame(rawLines, line, column + 1, {
      highlightCode: true,
    });
    console.error(frame);
  } else if (error.codeFrame) {
    // This looks like an error from a plugin (e.g. Babel).
    // In this case we'll resort to displaying the provided code frame
    // because we can't be sure the reported location is accurate.
    console.error(error.codeFrame);
  }
}

async function buildEverything() {
  await asyncRimRaf('build');

  // Run them serially for better console output
  // and to avoid any potential race conditions.
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of Bundles.bundles) {
    await createBundle(bundle, UMD_DEV);
    await createBundle(bundle, UMD_PROD);
    await createBundle(bundle, NODE_DEV);
    await createBundle(bundle, NODE_PROD);
    await createBundle(bundle, FB_WWW_DEV);
    await createBundle(bundle, FB_WWW_PROD);
    await createBundle(bundle, RN_OSS_DEV);
    await createBundle(bundle, RN_OSS_PROD);
    await createBundle(bundle, RN_FB_DEV);
    await createBundle(bundle, RN_FB_PROD);
  }

  await Packaging.copyAllShims();
  await Packaging.prepareNpmPackages();

  if (syncFBSourcePath) {
    await Sync.syncReactNative(syncFBSourcePath);
  } else if (syncWWWPath) {
    await Sync.syncReactDom('build/facebook-www', syncWWWPath);
  }

  console.log(Stats.printResults());
  if (!forcePrettyOutput) {
    Stats.saveResults();
  }

  if (shouldExtractErrors) {
    console.warn(
      '\nWarning: this build was created with --extract-errors enabled.\n' +
        'this will result in extremely slow builds and should only be\n' +
        'used when the error map needs to be rebuilt.\n'
    );
  }
}

buildEverything();
