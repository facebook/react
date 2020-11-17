/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const url = require('url');

module.exports = function register() {
  (require: any).extensions['.client.js'] = function(module, path) {
    module.exports = {
      $$typeof: Symbol.for('react.module.reference'),
      name: url.pathToFileURL(path).href,
    };
  };
};
