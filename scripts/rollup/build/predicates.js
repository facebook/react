'use strict';
const Bundles = require('../bundles');
const argv = require('minimist')(process.argv.slice(2));
const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
function isExperimental() {
  return typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;
}

function isWatchMode() {
  return argv.watch;
}

function isUnsafePartialBuild() {
  return argv['unsafe-partial'];
}

function isPrettyOutput() {
  return argv.pretty;
}

function shouldExtractErrors() {
  return argv['extract-errors'];
}

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

function isEsmEntryGenerator(bundleType) {
  return bundleType === ESM_PROD;
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case ESM_DEV:
    case FB_WWW_DEV:
    case RN_OSS_DEV:
    case RN_FB_DEV:
      return false;
    case UMD_PROD:
    case NODE_PROD:
    case UMD_PROFILING:
    case NODE_PROFILING:
    case ESM_PROD:
    case FB_WWW_PROD:
    case FB_WWW_PROFILING:
    case RN_OSS_PROD:
    case RN_OSS_PROFILING:
    case RN_FB_PROD:
    case RN_FB_PROFILING:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function isMinifiable(bundleType) {
  // esm minification is TODO
  return isProductionBundleType(bundleType) && !isEsmBundle(bundleType);
}

function isEsmBundle(bundleType) {
  return bundleType === ESM_DEV || bundleType === ESM_PROD;
}

function isProfilingBundleType(bundleType) {
  switch (bundleType) {
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case NODE_DEV:
    case NODE_PROD:
    case RN_FB_DEV:
    case RN_FB_PROD:
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case UMD_DEV:
    case UMD_PROD:
    case ESM_DEV:
    case ESM_PROD:
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

function isFatBundle(bundleType) {
  return (
    bundleType === UMD_DEV ||
    bundleType === UMD_PROD ||
    bundleType === UMD_PROFILING
  );
}

function isFacebookBundle(bundleType) {
  return (
    bundleType === FB_WWW_DEV ||
    bundleType === FB_WWW_PROD ||
    bundleType === FB_WWW_PROFILING
  );
}

function isSkippableBundle(bundle, bundleType) {
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
      // If the name ends with `something/index` we only match if the
      // entry ends in something. Such as `react-dom/index` only matches
      // `react-dom` but not `react-dom/server`. Everything else is fuzzy
      // search.
      requestedName =>
        (bundle.entry + '/index.js').indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return true;
    }
  }
  return false;
}

const requestedBundleTypes = argv.type
  ? parseRequestedNames([argv.type], 'uppercase')
  : [];
const requestedBundleNames = parseRequestedNames(argv._, 'lowercase');

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

module.exports = {
  isProductionBundleType,
  isMinifiable,
  isEsmBundle,
  isProfilingBundleType,
  isSkippableBundle,
  isFatBundle,
  isFacebookBundle,
  isExperimental,
  isEsmEntryGenerator,
  isWatchMode,
  isUnsafePartialBuild,
  isPrettyOutput,
  shouldExtractErrors,
};
