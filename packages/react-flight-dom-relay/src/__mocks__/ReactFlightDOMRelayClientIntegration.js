/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function getFakeModule() {
  return function FakeModule(props, data) {
    return data;
  };
}

const ReactFlightDOMRelayClientIntegration = {
  resolveModuleReference(moduleData) {
    return moduleData;
  },
  preloadModule(moduleReference) {},
  loadModule(moduleReference) {
    return null;
  },
  requireModule(moduleReference) {
    return getFakeModule();
  },
};

module.exports = ReactFlightDOMRelayClientIntegration;
