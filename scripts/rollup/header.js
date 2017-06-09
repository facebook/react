const Bundles = require('./bundles');

const FB_DEV = Bundles.bundleTypes.FB_DEV;

function getProvidesHeader(hasteFinalName, bundleType, fbDevCode) {
  return `/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @noflow
 * @providesModule ${hasteFinalName}
 */${bundleType === FB_DEV ? fbDevCode : ''}
`;
}

function getUMDHeader(filename, reactVersion) {
  return `/**
 * ${filename} v${reactVersion}
 */
`;
}

module.exports = {
  getProvidesHeader,
  getUMDHeader,
};
