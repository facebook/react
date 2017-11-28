'use strict';

const Bundles = require('./bundles');
const reactVersion = require('../../package.json').version;

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const NODE_DEV = Bundles.bundleTypes.NODE_DEV;
const NODE_PROD = Bundles.bundleTypes.NODE_PROD;
const FB_DEV = Bundles.bundleTypes.FB_DEV;
const FB_PROD = Bundles.bundleTypes.FB_PROD;
const RN_DEV = Bundles.bundleTypes.RN_DEV;
const RN_PROD = Bundles.bundleTypes.RN_PROD;

const RECONCILER = Bundles.moduleTypes.RECONCILER;

const license = ` * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.`;

const wrappers = {
  /***************** UMD_DEV *****************/
  [UMD_DEV](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */

'use strict';

${source}`;
  },

  /***************** UMD_PROD *****************/
  [UMD_PROD](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */
${source}`;
  },

  /***************** NODE_DEV *****************/
  [NODE_DEV](source, globalName, filename, moduleType) {
    return `/** @license React v${reactVersion}
 * ${filename}
 *
${license}
 */

'use strict';

${
      globalName === 'ReactNoopRenderer'
        ? // React Noop needs regenerator runtime because it uses
          // generators but GCC doesn't handle them in the output.
          // So we use Babel for them.
          `const regeneratorRuntime = require("regenerator-runtime");`
        : ``
    }

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
${
      globalName === 'ReactNoopRenderer'
        ? // React Noop needs regenerator runtime because it uses
          // generators but GCC doesn't handle them in the output.
          // So we use Babel for them.
          `const regeneratorRuntime = require("regenerator-runtime");`
        : ``
    }
${source}`;
  },

  /****************** FB_DEV ******************/
  [FB_DEV](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @providesModule ${globalName}-dev
 * @preventMunge
 */

'use strict';

if (__DEV__) {
  (function() {
${source}
  })();
}`;
  },

  /****************** FB_PROD ******************/
  [FB_PROD](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @providesModule ${globalName}-prod
 * @preventMunge
 */

${source}`;
  },

  /****************** RN_DEV ******************/
  [RN_DEV](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @providesModule ${globalName}-dev
 * @preventMunge
 */

'use strict';

if (__DEV__) {
  (function() {
${source}
  })();
}`;
  },

  /****************** RN_DEV ******************/
  [RN_PROD](source, globalName, filename, moduleType) {
    return `/**
${license}
 *
 * @noflow
 * @providesModule ${globalName}-prod
 * @preventMunge
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
  // This is a hacky way to ensure third party renderers don't share
  // top-level module state inside the reconciler. Ideally we should
  // remove this hack by putting all top-level state into the closures
  // and then forbidding adding more of it in the reconciler.
  var $$$reconciler;
  module.exports = function(config) {
${source}
    return ($$$reconciler || ($$$reconciler = module.exports))(config);
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
var $$$reconciler;
module.exports = function(config) {
${source}
  return ($$$reconciler || ($$$reconciler = module.exports))(config);
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
