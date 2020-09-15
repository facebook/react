/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ReactFlightDOMRelayClientIntegration = {
  resolveModuleReference(moduleData) {
    return moduleData;
  },
  preloadModule(moduleReference) {},
  requireModule(moduleReference) {
    return moduleReference;
  },
};

module.exports = ReactFlightDOMRelayClientIntegration;
