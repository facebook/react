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
  const MODULE_REFERENCE = Symbol.for('react.module.reference');
  const PROMISE_PROTOTYPE = Promise.prototype;

  const proxyHandlers = {
    get: function(target, name, receiver) {
      switch (name) {
        // These names are read by the Flight runtime if you end up using the exports object.
        case '$$typeof':
          // These names are a little too common. We should probably have a way to
          // have the Flight runtime extract the inner target instead.
          return target.$$typeof;
        case 'filepath':
          return target.filepath;
        case 'name':
          return target.name;
        case 'async':
          return target.async;
        // We need to special case this because createElement reads it if we pass this
        // reference.
        case 'defaultProps':
          return undefined;
        case '__esModule':
          // Something is conditionally checking which export to use. We'll pretend to be
          // an ESM compat module but then we'll check again on the client.
          target.default = {
            $$typeof: MODULE_REFERENCE,
            filepath: target.filepath,
            // This a placeholder value that tells the client to conditionally use the
            // whole object or just the default export.
            name: '',
            async: target.async,
          };
          return true;
        case 'then':
          if (!target.async) {
            // If this module is expected to return a Promise (such as an AsyncModule) then
            // we should resolve that with a client reference that unwraps the Promise on
            // the client.
            const then = function then(resolve, reject) {
              const moduleReference: {[string]: any, ...} = {
                $$typeof: MODULE_REFERENCE,
                filepath: target.filepath,
                name: '*', // Represents the whole object instead of a particular import.
                async: true,
              };
              return Promise.resolve(
                resolve(new Proxy(moduleReference, proxyHandlers)),
              );
            };
            // If this is not used as a Promise but is treated as a reference to a `.then`
            // export then we should treat it as a reference to that name.
            then.$$typeof = MODULE_REFERENCE;
            then.filepath = target.filepath;
            // then.name is conveniently already "then" which is the export name we need.
            // This will break if it's minified though.
            return then;
          }
      }
      let cachedReference = target[name];
      if (!cachedReference) {
        cachedReference = target[name] = {
          $$typeof: MODULE_REFERENCE,
          filepath: target.filepath,
          name: name,
          async: target.async,
        };
      }
      return cachedReference;
    },
    getPrototypeOf(target) {
      // Pretend to be a Promise in case anyone asks.
      return PROMISE_PROTOTYPE;
    },
    set: function() {
      throw new Error('Cannot assign to a client module from a server module.');
    },
  };

  Module._extensions['.client.js'] = function(module, path) {
    const moduleId = url.pathToFileURL(path).href;
    const moduleReference: {[string]: any, ...} = {
      $$typeof: MODULE_REFERENCE,
      filepath: moduleId,
      name: '*', // Represents the whole object instead of a particular import.
      async: false,
    };
    module.exports = new Proxy(moduleReference, proxyHandlers);
  };

  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function(request, parent, isMain, options) {
    const resolved = originalResolveFilename.apply(this, arguments);
    if (resolved.endsWith('.server.js')) {
      if (
        parent &&
        parent.filename &&
        !parent.filename.endsWith('.server.js')
      ) {
        let reason;
        if (request.endsWith('.server.js')) {
          reason = `"${request}"`;
        } else {
          reason = `"${request}" (which expands to "${resolved}")`;
        }
        throw new Error(
          `Cannot import ${reason} from "${parent.filename}". ` +
            'By react-server convention, .server.js files can only be imported from other .server.js files. ' +
            'That way nobody accidentally sends these to the client by indirectly importing it.',
        );
      }
    }
    return resolved;
  };
};
