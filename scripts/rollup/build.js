'use strict';

const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const closure = require('rollup-plugin-closure-compiler-js');
const commonjs = require('rollup-plugin-commonjs');
const prettier = require('rollup-plugin-prettier');
const replace = require('rollup-plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const chalk = require('chalk');
const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const os = require('os');
const fs = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('./bundles');
const sizes = require('./plugins/sizes-plugin');
const useForks = require('./plugins/use-forks-plugin');
const Stats = require('./stats');
const extractErrorCodes = require('../error-codes/extract-errors');
const syncReactDom = require('./sync').syncReactDom;
const syncReactNative = require('./sync').syncReactNative;
const syncReactNativeRT = require('./sync').syncReactNativeRT;
const syncReactNativeCS = require('./sync').syncReactNativeCS;
const Packaging = require('./packaging');
const codeFrame = require('babel-code-frame');
const Wrappers = require('./wrappers');
const uuidv1 = require('uuid/v1');

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const NODE_DEV = Bundles.bundleTypes.NODE_DEV;
const NODE_PROD = Bundles.bundleTypes.NODE_PROD;
const FB_DEV = Bundles.bundleTypes.FB_DEV;
const FB_PROD = Bundles.bundleTypes.FB_PROD;
const RN_DEV = Bundles.bundleTypes.RN_DEV;
const RN_PROD = Bundles.bundleTypes.RN_PROD;

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
const npmPackagesTmpDir = path.join(
  os.tmpdir(),
  `react-npm-packages-${uuidv1()}`
);

const closureOptions = {
  compilationLevel: 'SIMPLE',
  languageIn: 'ECMASCRIPT5_STRICT',
  languageOut: 'ECMASCRIPT5_STRICT',
  env: 'CUSTOM',
  warningLevel: 'QUIET',
  applyInputSourceMaps: false,
  useTypesForOptimization: false,
  processCommonJsModules: false,
};

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
          path.resolve('./scripts/babel/transform-object-assign-require'),
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
      destDir: 'build/',
      file:
        'build/' +
        Packaging.getOutputPathRelativeToBuildFolder(
          bundleType,
          filename,
          globalName
        ),
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

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_DEV:
    case RN_DEV:
      return false;
    case UMD_PROD:
    case NODE_PROD:
    case FB_PROD:
    case RN_PROD:
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
  bundleType,
  globalName,
  moduleType,
  modulesToStub
) {
  const findAndRecordErrorCodes = extractErrorCodes(errorCodeOpts);
  const forks = Modules.getForks(bundleType, entry);
  const isProduction = isProductionBundleType(bundleType);
  const isInGlobalScope = bundleType === UMD_DEV || bundleType === UMD_PROD;
  const isFBBundle = bundleType === FB_DEV || bundleType === FB_PROD;
  const isRNBundle = bundleType === RN_DEV || bundleType === RN_PROD;
  const shouldStayReadable = isFBBundle || isRNBundle;
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
        return source.replace(/require\(['"]react['"]\)/g, "require('React')");
      },
    },
    // Apply dead code elimination and/or minification.
    isProduction &&
      closure(
        Object.assign({}, closureOptions, {
          // Don't let it create global variables in the browser.
          // https://github.com/facebook/react/issues/10909
          assumeFunctionWrapper: !isInGlobalScope,
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
        const key = `${filename} (${bundleType})`;
        Stats.currentBuildResults.bundleSizes[key] = {
          size,
          gzip,
        };
      },
    }),
  ].filter(Boolean);
}

async function createBundle(bundle, bundleType) {
  const shouldSkipBundleType = bundle.bundleTypes.indexOf(bundleType) === -1;
  if (shouldSkipBundleType) {
    return;
  }
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      requestedType => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return;
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => bundle.label.indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return;
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
  try {
    const result = await rollup({
      input: resolvedEntry,
      pureExternalModules,
      external(id) {
        const containsThisModule = pkg =>
          id === pkg || id.startsWith(pkg + '/');
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
        bundle.modulesToStub
      ),
      // We can't use getters in www.
      legacy: bundleType === FB_DEV || bundleType === FB_PROD,
    });
    await result.write(
      getRollupOutputOptions(
        filename,
        format,
        bundleType,
        peerGlobals,
        bundle.global,
        bundle.moduleType
      )
    );
    await Packaging.createNodePackage(
      bundleType,
      packageName,
      filename,
      npmPackagesTmpDir
    );
    console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
  } catch (error) {
    if (error.code) {
      console.error(
        `\x1b[31m-- ${error.code}${error.plugin ? ` (${error.plugin})` : ''} --`
      );
      console.error(error.message);
      const {file, line, column} = error.loc;
      if (file) {
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
      } else {
        // This looks like an error from a plugin (e.g. Babel).
        // In this case we'll resort to displaying the provided code frame
        // because we can't be sure the reported location is accurate.
        console.error(error.codeFrame);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// clear the build directory
rimraf('build', async () => {
  try {
    // create a new build directory
    fs.mkdirSync('build');
    // create the temp directory for local npm packing and unpacking
    // in operating system's default temporary directory
    fs.mkdirSync(npmPackagesTmpDir);
    // create the packages folder for NODE+UMD bundles
    fs.mkdirSync(path.join('build', 'packages'));
    // create the dist folder for UMD bundles
    fs.mkdirSync(path.join('build', 'dist'));

    await Packaging.createFacebookWWWBuild();
    await Packaging.createReactNativeBuild();
    await Packaging.createReactNativeRTBuild();
    await Packaging.createReactNativeCSBuild();

    // Run them serially for better console output
    // and to avoid any potential race conditions.
    for (const bundle of Bundles.bundles) {
      await createBundle(bundle, UMD_DEV);
      await createBundle(bundle, UMD_PROD);
      await createBundle(bundle, NODE_DEV);
      await createBundle(bundle, NODE_PROD);
      await createBundle(bundle, FB_DEV);
      await createBundle(bundle, FB_PROD);
      await createBundle(bundle, RN_DEV);
      await createBundle(bundle, RN_PROD);
    }

    if (syncFbsource) {
      await syncReactNative(path.join('build', 'react-native'), syncFbsource);
      await syncReactNativeRT(path.join('build', 'react-rt'), syncFbsource);
      await syncReactNativeCS(path.join('build', 'react-cs'), syncFbsource);
    } else if (syncWww) {
      await syncReactDom(path.join('build', 'facebook-www'), syncWww);
    }

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
    rimraf(npmPackagesTmpDir, err => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
