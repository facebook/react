'use strict';
require('./handlePromiseErrors');
const babel = require('rollup-plugin-babel');
const closure = require('../plugins/closure-plugin');
const commonjs = require('rollup-plugin-commonjs');
const prettier = require('rollup-plugin-prettier');
const replace = require('rollup-plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const resolve = require('rollup-plugin-node-resolve');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('../modules');
const Bundles = require('../bundles');
const Stats = require('../stats');
const sizes = require('../plugins/sizes-plugin');
const useForks = require('../plugins/use-forks-plugin');
const forbidFBJSImports = require('../plugins/forbid-fbjs');
const stripUnusedImports = require('../plugins/strip-unused-imports');
const extractErrorCodes = require('../../error-codes/extract-errors');
const Wrappers = require('../wrappers');
const getBabelConfig = require('./getBabelConfig');
const {
  isProductionBundleType,
  isMinifiable,
  isEsmBundle,
  isProfilingBundleType,
  isExperimental,
} = require('./predicates');

const {
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  ESM_DEV,
  ESM_PROD,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
} = Bundles.bundleTypes;

const forcePrettyOutput = argv.pretty;
const shouldExtractErrors = argv['extract-errors'];
const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

const closureOptions = {
  compilation_level: 'SIMPLE',
  env: 'CUSTOM',
  warning_level: 'QUIET',
  module_resolution: 'NODE',
  apply_input_source_maps: false,
  use_types_for_optimization: false,
  process_common_js_modules: false,
  rewrite_polyfills: false,
};

function getOutputType(bundleType) {
  if (isEsmBundle) {
    return 'ECMASCRIPT6_STRICT';
  } else {
    return 'ECMASCRIPT5_STRICT';
  }
}

module.exports = function getPlugins(
  entry,
  externals,
  updateBabelOptions,
  filename,
  packageName,
  bundleType,
  globalName,
  moduleType,
  pureExternalModules
) {
  const findAndRecordErrorCodes = extractErrorCodes(errorCodeOpts);
  const forks = Modules.getForks(bundleType, entry, moduleType);
  const isProduction = isProductionBundleType(bundleType);
  const isMinified = isMinifiable(bundleType);
  const isProfiling = isProfilingBundleType(bundleType);
  const isUMDBundle =
    bundleType === UMD_DEV ||
    bundleType === UMD_PROD ||
    bundleType === UMD_PROFILING;
  const isFBBundle =
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
    // Ensure we don't try to bundle any fbjs modules.
    forbidFBJSImports(),
    // Replace any externals with their valid internal FB mappings
    isFBBundle && replace(Bundles.fbBundleExternalsMap),
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
        return source.replace(/['"]use strict["']/g, '');
      },
    },
    // Turn __DEV__ and process.env checks into constants.
    replace({
      __DEV__: isProduction ? 'false' : 'true',
      __PROFILE__: isProfiling || !isProduction ? 'true' : 'false',
      __UMD__: isUMDBundle ? 'true' : 'false',
      'process.env.NODE_ENV': isProduction ? "'production'" : "'development'",
      __EXPERIMENTAL__: isExperimental,
    }),
    // We still need CommonJS for external deps like object-assign.
    commonjs(),
    // Apply dead code elimination and/or minification.
    isMinified &&
      closure(
        Object.assign({}, closureOptions, {
          // Don't let it create global variables in the browser.
          // https://github.com/facebook/react/issues/10909
          assume_function_wrapper: !isUMDBundle,
          renaming: !shouldStayReadable,
          language_out: getOutputType(bundleType),
        })
      ),
    // HACK to work around the fact that Rollup isn't removing unused, pure-module imports.
    // Note that this plugin must be called after closure applies DCE.
    isProduction && stripUnusedImports(pureExternalModules),
    // Add the whitespace back if necessary.
    shouldStayReadable && prettier({parser: 'babylon'}),
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
};
