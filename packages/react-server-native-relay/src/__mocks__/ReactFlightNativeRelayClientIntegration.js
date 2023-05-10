/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import JSResourceReferenceImpl from 'JSResourceReferenceImpl';

const ReactFlightNativeRelayClientIntegration = {
  resolveClientReference(metadata) {
    return new JSResourceReferenceImpl(metadata);
  },
  preloadModule(clientReference) {},
  requireModule(clientReference) {
    return clientReference._moduleId;
  },
};

module.exports = ReactFlightNativeRelayClientIntegration;
