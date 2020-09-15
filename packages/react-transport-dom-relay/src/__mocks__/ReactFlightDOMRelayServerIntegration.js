/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ReactFlightDOMRelayServerIntegration = {
  emitModel(destination, id, json) {
    destination.push({
      type: 'json',
      id: id,
      json: json,
    });
  },
  emitError(destination, id, message, stack) {
    destination.push({
      type: 'error',
      id: id,
      json: {message, stack},
    });
  },
  close(destination) {},
  resolveModuleMetaData(config, resource) {
    return resource;
  },
};

module.exports = ReactFlightDOMRelayServerIntegration;
