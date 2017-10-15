'use strict';

function getProvidesHeader(hasteFinalName) {
  return `/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
`;
}

module.exports = {
  getProvidesHeader,
  getHeader,
};
