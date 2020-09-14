'use strict';

const {bundleTypes, moduleTypes} = require('./bundles');
const reactVersion = require('../../package.json').version;

const {
  NODE_ES2015,
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
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
} = bundleTypes;

const {RECONCILER} = moduleTypes;

const license = ` * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.`;

const wrappers = {
  /***************** NODE_ES2015 *****************/
  [NODE_ES2015](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */

'use strict';

${source}`;
  },

  /***************** UMD_DEV *****************/
  [UMD_DEV](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
${source}`;
  },

  /***************** UMD_PROD *****************/
  [UMD_PROD](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
(function(){${source}})();`;
  },

  /***************** UMD_PROFILING *****************/
  [UMD_PROFILING](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
(function(){${source}})();`;
  },

  /***************** NODE_DEV *****************/
  [NODE_DEV](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */

'use strict';

if (process.env.NODE_ENV !== "production") {
  (function() {
${source}
  })();
}`;
  },

  /***************** NODE_PROD *****************/
  [NODE_PROD](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
${source}`;
  },

  /***************** NODE_PROFILING *****************/
  [NODE_PROFILING](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
${source}`;
  },

  /****************** FB_WWW_DEV ******************/
  [FB_WWW_DEV](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

'use strict';

if (__DEV__) {
  (function() {
${source}
  })();
}`;
  },

  /****************** FB_WWW_PROD ******************/
  [FB_WWW_PROD](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

${source}`;
  },

  /****************** FB_WWW_PROFILING ******************/
  [FB_WWW_PROFILING](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

${source}`;
  },

  /****************** RN_OSS_DEV ******************/
  [RN_OSS_DEV](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @providesModule ${globalName}-dev
 * @preventMunge
 * ${'@gen' + 'erated'}
 */

'use strict';

if (__DEV__) {
  (function() {
${source}
  })();
}`;
  },

  /****************** RN_OSS_PROD ******************/
  [RN_OSS_PROD](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @providesModule ${globalName}-prod
 * @preventMunge
 * ${'@gen' + 'erated'}
 */

${source}`;
  },

  /****************** RN_OSS_PROFILING ******************/
  [RN_OSS_PROFILING](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @providesModule ${globalName}-profiling
 * @preventMunge
 * ${'@gen' + 'erated'}
 */

${source}`;
  },

  /****************** RN_FB_DEV ******************/
  [RN_FB_DEV](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @preventMunge
 * ${'@gen' + 'erated'}
 */

'use strict';

if (__DEV__) {
  (function() {
${source}
  })();
}`;
  },

  /****************** RN_FB_PROD ******************/
  [RN_FB_PROD](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @preventMunge
 * ${'@gen' + 'erated'}
 */

${source}`;
  },

  /****************** RN_FB_PROFILING ******************/
  [RN_FB_PROFILING](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @nolint
 * @preventMunge
 * ${'@gen' + 'erated'}
 */

${source}`;
  },
};

const reconcilerWrappers = {
  /***************** NODE_DEV (reconciler only) *****************/
  [NODE_DEV](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */

'use strict';

if (process.env.NODE_ENV !== "production") {
  module.exports = function $$$reconciler($$$hostConfig) {
    var exports = {};
${source}
    return exports;
  };
}`;
  },

  /***************** NODE_PROD (reconciler only) *****************/
  [NODE_PROD](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
module.exports = function $$$reconciler($$$hostConfig) {
    var exports = {};
${source}
    return exports;
};`;
  },

  /***************** NODE_PROFILING (reconciler only) *****************/
  [NODE_PROFILING](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
module.exports = function $$$reconciler($$$hostConfig) {
    var exports = {};
${source}
    return exports;
};`;
  },
};

function wrapBundle(source, bundleType, globalName, filename, moduleType) {
  if (moduleType === RECONCILER) {
    // Standalone reconciler is only used by third-party renderers.
    // It is handled separately.
    const wrapper = reconcilerWrappers[bundleType];
    if (typeof wrapper !== 'function') {
      throw new Error(
        `Unsupported build type for the reconciler package: ${bundleType}.`
      );
    }
    return wrapper(source, globalName, filename, moduleType);
  }
  // All the other packages.
  const wrapper = wrappers[bundleType];
  if (typeof wrapper !== 'function') {
    throw new Error(`Unsupported build type: ${bundleType}.`);
  }
  return wrapper(source, globalName, filename, moduleType);
}

module.exports = {
  wrapBundle,
};
