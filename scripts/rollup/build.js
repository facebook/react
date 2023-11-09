'use strict';

const rollup = require('rollup');
const babel = require('@rollup/plugin-babel').babel;
const closure = require('./plugins/closure-plugin');
const commonjs = require('@rollup/plugin-commonjs');
const flowRemoveTypes = require('flow-remove-types');
const prettier = require('rollup-plugin-prettier');
const replace = require('@rollup/plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const chalk = require('chalk');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('./bundles');
const Stats = require('./stats');
const Sync = require('./sync');
const sizes = require('./plugins/sizes-plugin');
const useForks = require('./plugins/use-forks-plugin');
const dynamicImports = require('./plugins/dynamic-imports');
const Packaging = require('./packaging');
const {asyncRimRaf} = require('./utils');
const codeFrame = require('@babel/code-frame');
const Wrappers = require('./wrappers');

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

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
  NODE_ES2015,
  ESM_DEV,
  ESM_PROD,
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  BUN_DEV,
  BUN_PROD,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
  BROWSER_SCRIPT,
} = Bundles.bundleTypes;

const {getFilename} = Bundles;

function parseRequestedNames(names, toCase) {
  let result = [];
  for (let i = 0; i < names.length; i++) {
    let splitNames = names[i].split(',');
    for (let j = 0; j < splitNames.length; j++) {
      let name = splitNames[j].trim();
      if (!name) {
        continue;
      }
      if (toCase === 'uppercase') {
        name = name.toUpperCase();
      } else if (toCase === 'lowercase') {
        name = name.toLowerCase();
      }
      result.push(name);
    }
  }
  return result;
}

const requestedBundleTypes = argv.type
  ? parseRequestedNames([argv.type], 'uppercase')
  : [];
const requestedBundleNames = parseRequestedNames(argv._, 'lowercase');
const forcePrettyOutput = argv.pretty;
const isWatchMode = argv.watch;
const syncFBSourcePath = argv['sync-fbsource'];
const syncWWWPath = argv['sync-www'];

// Non-ES2015 stuff applied before closure compiler.
const babelPlugins = [
  // These plugins filter out non-ES2015.
  ['@babel/plugin-proposal-class-properties', {loose: true}],
  'syntax-trailing-function-commas',
  // These use loose mode which avoids embedding a runtime.
  // TODO: Remove object spread from the source. Prefer Object.assign instead.
  [
    '@babel/plugin-proposal-object-rest-spread',
    {loose: true, useBuiltIns: true},
  ],
  ['@babel/plugin-transform-template-literals', {loose: true}],
  // TODO: Remove for...of from the source. It requires a runtime to be embedded.
  '@babel/plugin-transform-for-of',
  // TODO: Remove array spread from the source. Prefer .apply instead.
  ['@babel/plugin-transform-spread', {loose: true, useBuiltIns: true}],
  '@babel/plugin-transform-parameters',
  // TODO: Remove array destructuring from the source. Requires runtime.
  ['@babel/plugin-transform-destructuring', {loose: true, useBuiltIns: true}],
  // Transform Object spread to shared/assign
  require('../babel/transform-object-assign'),
];

const babelToES5Plugins = [
  // These plugins transform DEV mode. Closure compiler deals with these in PROD.
  '@babel/plugin-transform-literals',
  '@babel/plugin-transform-arrow-functions',
  '@babel/plugin-transform-block-scoped-functions',
  '@babel/plugin-transform-shorthand-properties',
  '@babel/plugin-transform-computed-properties',
  ['@babel/plugin-transform-block-scoping', {throwIfClosureRequired: true}],
];

function getBabelConfig(
  updateBabelOptions,
  bundleType,
  packageName,
  externals,
  isDevelopment,
  bundle
) {
  const canAccessReactObject =
    packageName === 'react' || externals.indexOf('react') !== -1;
  let options = {
    exclude: '/**/node_modules/**',
    babelrc: false,
    configFile: false,
    presets: [],
    plugins: [...babelPlugins],
    babelHelpers: 'bundled',
    sourcemap: false,
  };
  if (isDevelopment) {
    options.plugins.push(
      ...babelToES5Plugins,
      // Turn console.error/warn() into a custom wrapper
      [
        require('../babel/transform-replace-console-calls'),
        {
          shouldError: !canAccessReactObject,
        },
      ]
    );
  }
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }
  // Controls whether to replace error messages with error codes in production.
  // By default, error messages are replaced in production.
  if (!isDevelopment && bundle.minifyWithProdErrorCodes !== false) {
    options.plugins.push(require('../error-codes/transform-error-messages'));
  }

  return options;
}

let getRollupInteropValue = id => {
  // We're setting Rollup to assume that imports are ES modules unless otherwise specified.
  // However, we also compile ES import syntax to `require()` using Babel.
  // This causes Rollup to turn uses of `import SomeDefaultImport from 'some-module' into
  // references to `SomeDefaultImport.default` due to CJS/ESM interop.
  // Some CJS modules don't have a `.default` export, and the rewritten import is incorrect.
  // Specifying `interop: 'default'` instead will have Rollup use the imported variable as-is,
  // without adding a `.default` to the reference.
  const modulesWithCommonJsExports = [
    'art/core/transform',
    'art/modes/current',
    'art/modes/fast-noSideEffects',
    'art/modes/svg',
    'JSResourceReferenceImpl',
    'error-stack-parser',
    'neo-async',
    'webpack/lib/dependencies/ModuleDependency',
    'webpack/lib/dependencies/NullDependency',
    'webpack/lib/Template',
  ];

  if (modulesWithCommonJsExports.includes(id)) {
    return 'default';
  }

  // For all other modules, handle imports without any import helper utils
  return 'esModule';
};

function getRollupOutputOptions(
  outputPath,
  format,
  globals,
  globalName,
  bundleType
) {
  const isProduction = isProductionBundleType(bundleType);

  return {
    file: outputPath,
    format,
    globals,
    freeze: !isProduction,
    interop: getRollupInteropValue,
    name: globalName,
    sourcemap: false,
    esModule: false,
    exports: 'auto',
  };
}

function getFormat(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
      return `umd`;
    case NODE_ES2015:
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
    case BUN_DEV:
    case BUN_PROD:
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case FB_WWW_PROFILING:
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case RN_OSS_PROFILING:
    case RN_FB_DEV:
    case RN_FB_PROD:
    case RN_FB_PROFILING:
      return `cjs`;
    case ESM_DEV:
    case ESM_PROD:
      return `es`;
    case BROWSER_SCRIPT:
      return `iife`;
  }
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case NODE_ES2015:
      return true;
    case ESM_DEV:
    case UMD_DEV:
    case NODE_DEV:
    case BUN_DEV:
    case FB_WWW_DEV:
    case RN_OSS_DEV:
    case RN_FB_DEV:
      return false;
    case ESM_PROD:
    case UMD_PROD:
    case NODE_PROD:
    case BUN_PROD:
    case UMD_PROFILING:
    case NODE_PROFILING:
    case FB_WWW_PROD:
    case FB_WWW_PROFILING:
    case RN_OSS_PROD:
    case RN_OSS_PROFILING:
    case RN_FB_PROD:
    case RN_FB_PROFILING:
    case BROWSER_SCRIPT:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function isProfilingBundleType(bundleType) {
  switch (bundleType) {
    case NODE_ES2015:
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case NODE_DEV:
    case NODE_PROD:
    case BUN_DEV:
    case BUN_PROD:
    case RN_FB_DEV:
    case RN_FB_PROD:
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case ESM_DEV:
    case ESM_PROD:
    case UMD_DEV:
    case UMD_PROD:
    case BROWSER_SCRIPT:
      return false;
    case FB_WWW_PROFILING:
    case NODE_PROFILING:
    case RN_FB_PROFILING:
    case RN_OSS_PROFILING:
    case UMD_PROFILING:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function getBundleTypeFlags(bundleType) {
  const isUMDBundle =
    bundleType === UMD_DEV ||
    bundleType === UMD_PROD ||
    bundleType === UMD_PROFILING;
  const isFBWWWBundle =
    bundleType === FB_WWW_DEV ||
    bundleType === FB_WWW_PROD ||
    bundleType === FB_WWW_PROFILING;
  const isRNBundle =
    bundleType === RN_OSS_DEV ||
    bundleType === RN_OSS_PROD ||
    bundleType === RN_OSS_PROFILING ||
    bundleType === RN_FB_DEV ||
    bundleType === RN_FB_PROD ||
    bundleType === RN_FB_PROFILING;

  const isFBRNBundle =
    bundleType === RN_FB_DEV ||
    bundleType === RN_FB_PROD ||
    bundleType === RN_FB_PROFILING;

  const shouldStayReadable = isFBWWWBundle || isRNBundle || forcePrettyOutput;

  const shouldBundleDependencies =
    bundleType === UMD_DEV ||
    bundleType === UMD_PROD ||
    bundleType === UMD_PROFILING;

  return {
    isUMDBundle,
    isFBWWWBundle,
    isRNBundle,
    isFBRNBundle,
    shouldBundleDependencies,
    shouldStayReadable,
  };
}

function forbidFBJSImports() {
  return {
    name: 'forbidFBJSImports',
    resolveId(importee, importer) {
      if (/^fbjs\//.test(importee)) {
        throw new Error(
          `Don't import ${importee} (found in ${importer}). ` +
            `Use the utilities in packages/shared/ instead.`
        );
      }
    },
  };
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
  pureExternalModules,
  bundle
) {
  try {
    const forks = Modules.getForks(bundleType, entry, moduleType, bundle);
    const isProduction = isProductionBundleType(bundleType);
    const isProfiling = isProfilingBundleType(bundleType);

    const {isUMDBundle, shouldStayReadable} = getBundleTypeFlags(bundleType);

    const needsMinifiedByClosure = isProduction && bundleType !== ESM_PROD;

    // Any other packages that should specifically _not_ have sourcemaps
    const sourcemapPackageExcludes = [
      // Having `//#sourceMappingUrl` for the `react-debug-tools` prod bundle breaks
      // `ReactDevToolsHooksIntegration-test.js`, because it changes Node's generated
      // stack traces and thus alters the hook name parsing behavior.
      // Also, this is an internal-only package that doesn't need sourcemaps anyway
      'react-debug-tools',
    ];

    // Generate sourcemaps for true "production" build artifacts
    // that will be used by bundlers, such as `react-dom.production.min.js`.
    // Also include profiling builds as well.
    // UMD builds are rarely used and not worth having sourcemaps.
    const needsSourcemaps =
      needsMinifiedByClosure &&
      // This will only exclude `unstable_server-external-runtime.js` artifact
      // To start generating sourcemaps for it, we should stop manually copying it to `facebook-www`
      // and force `react-dom` to include .map files in npm-package at the root level
      bundleType !== BROWSER_SCRIPT &&
      !isUMDBundle &&
      !sourcemapPackageExcludes.includes(entry) &&
      !shouldStayReadable;

    return [
      // Keep dynamic imports as externals
      dynamicImports(),
      {
        name: 'rollup-plugin-flow-remove-types',
        transform(code) {
          const transformed = flowRemoveTypes(code);
          return {
            code: transformed.toString(),
            map: null,
          };
        },
      },
      // Shim any modules that need forking in this environment.
      useForks(forks),
      // Ensure we don't try to bundle any fbjs modules.
      forbidFBJSImports(),
      // Use Node resolution mechanism.
      resolve({
        // skip: externals, // TODO: options.skip was removed in @rollup/plugin-node-resolve 3.0.0
      }),
      // Remove license headers from individual modules
      stripBanner({
        exclude: 'node_modules/**/*',
      }),
      // Compile to ES2015.
      babel(
        getBabelConfig(
          updateBabelOptions,
          bundleType,
          packageName,
          externals,
          !isProduction,
          bundle
        )
      ),
      // Remove 'use strict' from individual source files.
      {
        name: "remove 'use strict'",
        transform(source) {
          return source.replace(/['"]use strict["']/g, '');
        },
      },
      // Turn __DEV__ and process.env checks into constants.
      replace({
        preventAssignment: true,
        values: {
          __DEV__: isProduction ? 'false' : 'true',
          __PROFILE__: isProfiling || !isProduction ? 'true' : 'false',
          __UMD__: isUMDBundle ? 'true' : 'false',
          'process.env.NODE_ENV': isProduction
            ? "'production'"
            : "'development'",
          __EXPERIMENTAL__,
        },
      }),
      // The CommonJS plugin *only* exists to pull "art" into "react-art".
      // I'm going to port "art" to ES modules to avoid this problem.
      // Please don't enable this for anything else!
      isUMDBundle && entry === 'react-art' && commonjs(),
      {
        name: 'top-level-definitions',
        renderChunk(source) {
          return Wrappers.wrapWithTopLevelDefinitions(
            source,
            bundleType,
            globalName,
            filename,
            moduleType,
            bundle.wrapWithModuleBoundaries
          );
        },
      },
      // License and haste headers for artifacts with sourcemaps
      // For artifacts with sourcemaps we apply these headers
      // before passing sources to the Closure compiler, which will be building sourcemaps
      needsSourcemaps && {
        name: 'license-and-signature-header-for-artifacts-with-sourcemaps',
        renderChunk(source) {
          return Wrappers.wrapWithLicenseHeader(
            source,
            bundleType,
            globalName,
            filename,
            moduleType
          );
        },
      },
      // Apply dead code elimination and/or minification.
      // closure doesn't yet support leaving ESM imports intact
      needsMinifiedByClosure &&
        closure(
          {
            compilation_level: 'SIMPLE',
            language_in: 'ECMASCRIPT_2020',
            language_out:
              bundleType === NODE_ES2015
                ? 'ECMASCRIPT_2020'
                : bundleType === BROWSER_SCRIPT
                ? 'ECMASCRIPT5'
                : 'ECMASCRIPT5_STRICT',
            emit_use_strict:
              bundleType !== BROWSER_SCRIPT &&
              bundleType !== ESM_PROD &&
              bundleType !== ESM_DEV,
            env: 'CUSTOM',
            warning_level: 'QUIET',
            source_map_include_content: true,
            use_types_for_optimization: false,
            process_common_js_modules: false,
            rewrite_polyfills: false,
            inject_libraries: false,
            allow_dynamic_import: true,

            // Don't let it create global variables in the browser.
            // https://github.com/facebook/react/issues/10909
            assume_function_wrapper: !isUMDBundle,
            renaming: !shouldStayReadable,
          },
          {needsSourcemaps}
        ),
      // Add the whitespace back if necessary.
      shouldStayReadable &&
        prettier({
          parser: 'flow',
          singleQuote: false,
          trailingComma: 'none',
          bracketSpacing: true,
        }),
      needsSourcemaps && {
        name: 'generate-prod-bundle-sourcemaps',
        async renderChunk(minifiedCodeWithChangedHeader, chunk, options, meta) {
          // We want to generate a sourcemap that shows the production bundle source
          // as it existed before Closure Compiler minified that chunk, rather than
          // showing the "original" individual source files. This better shows
          // what is actually running in the app.

          // Use a path like `node_modules/react/cjs/react.production.min.js.map` for the sourcemap file
          const finalSourcemapPath = options.file.replace('.js', '.js.map');
          const finalSourcemapFilename = path.basename(finalSourcemapPath);
          const outputFolder = path.dirname(options.file);

          // Read the sourcemap that Closure wrote to disk
          const sourcemapAfterClosure = JSON.parse(
            fs.readFileSync(finalSourcemapPath, 'utf8')
          );

          // Represent the "original" bundle as a file with no `.min` in the name
          const filenameWithoutMin = filename.replace('.min', '');
          // There's _one_ artifact where the incoming filename actually contains
          // a folder name: "use-sync-external-store-shim/with-selector.production.js".
          // The output path already has the right structure, but we need to strip this
          // down to _just_ the JS filename.
          const preMinifiedFilename = path.basename(filenameWithoutMin);

          // CC generated a file list that only contains the tempfile name.
          // Replace that with a more meaningful "source" name for this bundle
          // that represents "the bundled source before minification".
          sourcemapAfterClosure.sources = [preMinifiedFilename];
          sourcemapAfterClosure.file = filename;

          // We'll write the pre-minified source to disk as a separate file.
          // Because it sits on disk, there's no need to have it in the `sourcesContent` array.
          // That also makes the file easier to read, and available for use by scripts.
          // This should be the only file in the array.
          const [preMinifiedBundleSource] =
            sourcemapAfterClosure.sourcesContent;

          // Remove this entirely - we're going to write the file to disk instead.
          delete sourcemapAfterClosure.sourcesContent;

          const preMinifiedBundlePath = path.join(
            outputFolder,
            preMinifiedFilename
          );

          // Write the original source to disk as a separate file
          fs.writeFileSync(preMinifiedBundlePath, preMinifiedBundleSource);

          // Overwrite the Closure-generated file with the final combined sourcemap
          fs.writeFileSync(
            finalSourcemapPath,
            JSON.stringify(sourcemapAfterClosure)
          );

          // Add the sourcemap URL to the actual bundle, so that tools pick it up
          const sourceWithMappingUrl =
            minifiedCodeWithChangedHeader +
            `\n//# sourceMappingURL=${finalSourcemapFilename}`;

          return {
            code: sourceWithMappingUrl,
            map: null,
          };
        },
      },
      // License and haste headers for artifacts without sourcemaps
      // Primarily used for FB-artifacts, which should preserve specific format of the header
      // Which potentially can be changed by Closure minification
      !needsSourcemaps && {
        name: 'license-and-signature-header-for-artifacts-without-sourcemaps',
        renderChunk(source) {
          return Wrappers.wrapWithLicenseHeader(
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
  } catch (error) {
    console.error(
      chalk.red(`There was an error preparing plugins for entry "${entry}"`)
    );
    throw error;
  }
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
    // If the name ends with `something/index` we only match if the
    // entry ends in something. Such as `react-dom/index` only matches
    // `react-dom` but not `react-dom/server`. Everything else is fuzzy
    // search.
    const entryLowerCase = bundle.entry.toLowerCase() + '/index.js';
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => {
        const matchEntry = entryLowerCase.indexOf(requestedName) !== -1;
        if (!bundle.name) {
          return !matchEntry;
        }
        const matchName =
          bundle.name.toLowerCase().indexOf(requestedName) !== -1;
        return !matchEntry && !matchName;
      }
    );
    if (isAskingForDifferentNames) {
      return true;
    }
  }
  return false;
}

function resolveEntryFork(resolvedEntry, isFBBundle) {
  // Pick which entry point fork to use:
  // .modern.fb.js
  // .classic.fb.js
  // .fb.js
  // .stable.js
  // .experimental.js
  // .js

  if (isFBBundle) {
    const resolvedFBEntry = resolvedEntry.replace(
      '.js',
      __EXPERIMENTAL__ ? '.modern.fb.js' : '.classic.fb.js'
    );
    if (fs.existsSync(resolvedFBEntry)) {
      return resolvedFBEntry;
    }
    const resolvedGenericFBEntry = resolvedEntry.replace('.js', '.fb.js');
    if (fs.existsSync(resolvedGenericFBEntry)) {
      return resolvedGenericFBEntry;
    }
    // Even if it's a FB bundle we fallthrough to pick stable or experimental if we don't have an FB fork.
  }
  const resolvedForkedEntry = resolvedEntry.replace(
    '.js',
    __EXPERIMENTAL__ ? '.experimental.js' : '.stable.js'
  );
  if (fs.existsSync(resolvedForkedEntry)) {
    return resolvedForkedEntry;
  }
  // Just use the plain .js one.
  return resolvedEntry;
}

async function createBundle(bundle, bundleType) {
  const filename = getFilename(bundle, bundleType);
  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.entry);

  const {isFBWWWBundle, isFBRNBundle, shouldBundleDependencies} =
    getBundleTypeFlags(bundleType);

  let resolvedEntry = resolveEntryFork(
    require.resolve(bundle.entry),
    isFBWWWBundle || isFBRNBundle
  );

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
      moduleSideEffects: (id, external) =>
        !(external && pureExternalModules.includes(id)),
      propertyReadSideEffects: false,
    },
    external(id) {
      const containsThisModule = pkg => id === pkg || id.startsWith(pkg + '/');
      const isProvidedByDependency = externals.some(containsThisModule);
      if (!shouldBundleDependencies && isProvidedByDependency) {
        if (id.indexOf('/src/') !== -1) {
          throw Error(
            'You are trying to import ' +
              id +
              ' but ' +
              externals.find(containsThisModule) +
              ' is one of npm dependencies, ' +
              'so it will not contain that source file. You probably want ' +
              'to create a new bundle entry point for it instead.'
          );
        }
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
      pureExternalModules,
      bundle
    ),
    output: {
      externalLiveBindings: false,
      freeze: false,
      interop: getRollupInteropValue,
      esModule: false,
    },
  };
  const mainOutputPath = Packaging.getBundleOutputPath(
    bundle,
    bundleType,
    filename,
    packageName
  );

  const rollupOutputOptions = getRollupOutputOptions(
    mainOutputPath,
    format,
    peerGlobals,
    bundle.global,
    bundleType
  );

  if (isWatchMode) {
    rollupConfig.output = [rollupOutputOptions];
    const watcher = rollup.watch(rollupConfig);
    watcher.on('event', async event => {
      switch (event.code) {
        case 'BUNDLE_START':
          console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
          break;
        case 'BUNDLE_END':
          console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
          break;
        case 'ERROR':
        case 'FATAL':
          console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
          handleRollupError(event.error);
          break;
      }
    });
  } else {
    console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
    try {
      const result = await rollup.rollup(rollupConfig);
      await result.write(rollupOutputOptions);
    } catch (error) {
      console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
      handleRollupError(error);
      throw error;
    }
    console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
  }
}

function handleRollupWarning(warning) {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
    const match = warning.message.match(/external module "([^"]+)"/);
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

  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    // Ignored
  } else if (typeof warning.code === 'string') {
    // This is a warning coming from Rollup itself.
    // These tend to be important (e.g. clashes in namespaced exports)
    // so we'll fail the build on any of them.
    console.error();
    console.error(warning.message || warning);
    console.error();
    process.exit(1);
  } else {
    // The warning is from one of the plugins.
    // Maybe it's not important, so just print it.
    console.warn(warning.message || warning);
  }
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
  if (!argv['unsafe-partial']) {
    await asyncRimRaf('build');
  }

  // Run them serially for better console output
  // and to avoid any potential race conditions.

  let bundles = [];
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of Bundles.bundles) {
    bundles.push(
      [bundle, NODE_ES2015],
      [bundle, ESM_DEV],
      [bundle, ESM_PROD],
      [bundle, UMD_DEV],
      [bundle, UMD_PROD],
      [bundle, UMD_PROFILING],
      [bundle, NODE_DEV],
      [bundle, NODE_PROD],
      [bundle, NODE_PROFILING],
      [bundle, BUN_DEV],
      [bundle, BUN_PROD],
      [bundle, FB_WWW_DEV],
      [bundle, FB_WWW_PROD],
      [bundle, FB_WWW_PROFILING],
      [bundle, RN_OSS_DEV],
      [bundle, RN_OSS_PROD],
      [bundle, RN_OSS_PROFILING],
      [bundle, RN_FB_DEV],
      [bundle, RN_FB_PROD],
      [bundle, RN_FB_PROFILING],
      [bundle, BROWSER_SCRIPT]
    );
  }

  bundles = bundles.filter(([bundle, bundleType]) => {
    return !shouldSkipBundle(bundle, bundleType);
  });

  if (process.env.CIRCLE_NODE_TOTAL) {
    // In CI, parallelize bundles across multiple tasks.
    const nodeTotal = parseInt(process.env.CIRCLE_NODE_TOTAL, 10);
    const nodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
    bundles = bundles.filter((_, i) => i % nodeTotal === nodeIndex);
  }

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const [bundle, bundleType] of bundles) {
    await createBundle(bundle, bundleType);
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
}

buildEverything();
