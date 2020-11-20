/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const url = require('url');

// $FlowFixMe
const Module = require('module');

module.exports = function register() {
  (require: any).extensions['.client.js'] = function(module, path) {
    module.exports = {
      $$typeof: Symbol.for('react.module.reference'),
      name: url.pathToFileURL(path).href,
    };
  };

  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function(request, parent, isMain, options) {
    // We intentionally check the request here instead of the resolved file.
    // This allows package exports to configure non-server aliases that resolve to server files
    // depending on environment. It's probably a bad idea to export a server file as "main" though.
    if (request.endsWith('.server.js')) {
      if (
        parent &&
        parent.filename &&
        !parent.filename.endsWith('.server.js')
      ) {
        throw new Error(
          `Cannot import "${request}" from "${parent.filename}". ` +
            'By react-server convention, .server.js files can only be imported from other .server.js files. ' +
            'That way nobody accidentally sends these to the client by indirectly importing it.',
        );
      }
    }
    return originalResolveFilename.apply(this, arguments);
  };
};
