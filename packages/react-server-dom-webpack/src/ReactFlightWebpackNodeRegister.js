/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const url = require('url');

const Module = require('module');

module.exports = function register() {
  const CLIENT_REFERENCE = Symbol.for('react.client.reference');
  const PROMISE_PROTOTYPE = Promise.prototype;

  const proxyHandlers = {
    get: function(
      target: {[string]: $FlowFixMe},
      name: string,
      receiver: Proxy<{[string]: $FlowFixMe}>,
    ) {
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
        case 'getDefaultProps':
          return undefined;
        // Avoid this attempting to be serialized.
        case 'toJSON':
          return undefined;
        case '__esModule':
          // Something is conditionally checking which export to use. We'll pretend to be
          // an ESM compat module but then we'll check again on the client.
          const moduleId = target.filepath;
          target.default = Object.defineProperties(
            (function() {
              throw new Error(
                `Attempted to call the default export of ${moduleId} from the server` +
                  `but it's on the client. It's not possible to invoke a client function from ` +
                  `the server, it can only be rendered as a Component or passed to props of a` +
                  `Client Component.`,
              );
            }: any),
            {
              // This a placeholder value that tells the client to conditionally use the
              // whole object or just the default export.
              name: {value: ''},
              $$typeof: {value: CLIENT_REFERENCE},
              filepath: {value: target.filepath},
              async: {value: target.async},
            },
          );
          return true;
        case 'then':
          if (!target.async) {
            // If this module is expected to return a Promise (such as an AsyncModule) then
            // we should resolve that with a client reference that unwraps the Promise on
            // the client.
            // $FlowFixMe[missing-local-annot]
            const then = Object.defineProperties(
              (function then(resolve, reject: any) {
                const innerModuleId = target.filepath;
                const clientReference: {
                  [string]: any,
                  ...,
                } = Object.defineProperties(
                  (function() {
                    throw new Error(
                      `Attempted to call the module exports of ${innerModuleId} from the server` +
                        `but it's on the client. It's not possible to invoke a client function from ` +
                        `the server, it can only be rendered as a Component or passed to props of a` +
                        `Client Component.`,
                    );
                  }: any),
                  {
                    // Represents the whole object instead of a particular import.
                    name: {value: '*'},
                    $$typeof: {value: CLIENT_REFERENCE},
                    filepath: {value: target.filepath},
                    async: {value: true},
                  },
                );
                return Promise.resolve(
                  // $FlowFixMe[incompatible-call] found when upgrading Flow
                  resolve(new Proxy(clientReference, proxyHandlers)),
                );
              }: any),
              {
                name: {value: 'then'},
                $$typeof: {value: CLIENT_REFERENCE},
                filepath: {value: target.filepath},
                async: {value: false},
              },
            );
            // If this is not used as a Promise but is treated as a reference to a `.then`
            // export then we should treat it as a reference to that name.
            return then;
          } else {
            // Since typeof .then === 'function' is a feature test we'd continue recursing
            // indefinitely if we return a function. Instead, we return an object reference
            // if we check further.
            return undefined;
          }
      }
      let cachedReference = target[name];
      if (!cachedReference) {
        cachedReference = target[name] = Object.defineProperties(
          (function() {
            throw new Error(
              `Attempted to call ${name}() from the server but ${name} is on the client. ` +
                `It's not possible to invoke a client function from the server, it can ` +
                `only be rendered as a Component or passed to props of a Client Component.`,
            );
          }: any),
          {
            name: {value: name},
            $$typeof: {value: CLIENT_REFERENCE},
            filepath: {value: target.filepath},
            async: {value: target.async},
          },
        );
      }
      return cachedReference;
    },
    getPrototypeOf(target: {[string]: $FlowFixMe}) {
      // Pretend to be a Promise in case anyone asks.
      return PROMISE_PROTOTYPE;
    },
    set: function() {
      throw new Error('Cannot assign to a client module from a server module.');
    },
  };

  // $FlowFixMe[prop-missing] found when upgrading Flow
  Module._extensions['.client.js'] = function(module, path) {
    const moduleId: string = (url.pathToFileURL(path).href: any);
    const clientReference: Function = Object.defineProperties(
      (function() {
        throw new Error(
          `Attempted to call the module exports of ${moduleId} from the server` +
            `but it's on the client. It's not possible to invoke a client function from ` +
            `the server, it can only be rendered as a Component or passed to props of a` +
            `Client Component.`,
        );
      }: any),
      {
        // Represents the whole object instead of a particular import.
        name: {value: '*'},
        $$typeof: {value: CLIENT_REFERENCE},
        filepath: {value: moduleId},
        async: {value: false},
      },
    );
    // $FlowFixMe[incompatible-call] found when upgrading Flow
    module.exports = new Proxy(clientReference, proxyHandlers);
  };

  // $FlowFixMe[prop-missing] found when upgrading Flow
  const originalResolveFilename = Module._resolveFilename;

  // $FlowFixMe[prop-missing] found when upgrading Flow
  // $FlowFixMe[missing-this-annot]
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
