'use strict';

function getProvidesHeader(hasteFinalName) {
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
 */
`;
}

function getHeader(filename, reactVersion) {
  return `/** @license React v${reactVersion}
 * ${filename}
 *
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
`;
}

module.exports = {
  getProvidesHeader,
  getHeader,
};
