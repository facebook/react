'use strict';

const Bundles = require('../bundles');
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

/**
 * Gets the rollup output format to use based on the bundle type
 */
module.exports = function getFormat(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
      return `umd`;
    case ESM_DEV:
    case ESM_PROD:
      return 'es';
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
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
  }
};
