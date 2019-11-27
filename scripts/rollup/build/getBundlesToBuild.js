'use strict';

const { isExperimental } = require('./predicates')
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

module.exports = function getBundlesToBuild() {
  let bundles = [];
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of Bundles.bundles) {
    bundles.push(
      [bundle, UMD_DEV],
      [bundle, UMD_PROD],
      [bundle, UMD_PROFILING],
      [bundle, NODE_DEV],
      [bundle, NODE_PROD],
      [bundle, NODE_PROFILING],
      [bundle, ESM_DEV],
      [bundle, ESM_PROD],
      [bundle, RN_OSS_DEV],
      [bundle, RN_OSS_PROD],
      [bundle, RN_OSS_PROFILING],
      [bundle, RN_FB_DEV],
      [bundle, RN_FB_PROD],
      [bundle, RN_FB_PROFILING]
    );

    if (isExperimental()) {
      // www uses experimental builds only.
      bundles.push(
        [bundle, FB_WWW_DEV],
        [bundle, FB_WWW_PROD],
        [bundle, FB_WWW_PROFILING]
      );
    }
  }
  return bundles;
}
