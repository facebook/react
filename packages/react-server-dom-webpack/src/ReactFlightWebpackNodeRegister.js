/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const acorn = require('acorn');

const url = require('url');

const Module = require('module');

module.exports = function register() {
  const CLIENT_REFERENCE = Symbol.for('react.client.reference');
  const PROMISE_PROTOTYPE = Promise.prototype;

  const deepProxyHandlers = {
    get: function (target: Function, name: string, receiver: Proxy<Function>) {
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
        // Avoid this attempting to be serialized.
        case 'toJSON':
          return undefined;
        case Symbol.toPrimitive:
          // $FlowFixMe[prop-missing]
          return Object.prototype[Symbol.toPrimitive];
        case 'Provider':
          throw new Error(
            `Cannot render a Client Context Provider on the Server. ` +
              `Instead, you can export a Client Component wrapper ` +
              `that itself renders a Client Context Provider.`,
          );
      }
      let expression;
      switch (target.name) {
        case '':
          // eslint-disable-next-line react-internal/safe-string-coercion
          expression = String(name);
          break;
        case '*':
          // eslint-disable-next-line react-internal/safe-string-coercion
          expression = String(name);
          break;
        default:
          // eslint-disable-next-line react-internal/safe-string-coercion
          expression = String(target.name) + '.' + String(name);
      }
      throw new Error(
        `Cannot access ${expression} on the server. ` +
          'You cannot dot into a client module from a server component. ' +
          'You can only pass the imported name through.',
      );
    },
    set: function () {
      throw new Error('Cannot assign to a client module from a server module.');
    },
  };

  const proxyHandlers = {
    get: function (target: Function, name: string, receiver: Proxy<Function>) {
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
        // Avoid this attempting to be serialized.
        case 'toJSON':
          return undefined;
        case Symbol.toPrimitive:
          // $FlowFixMe[prop-missing]
          return Object.prototype[Symbol.toPrimitive];
        case '__esModule':
          // Something is conditionally checking which export to use. We'll pretend to be
          // an ESM compat module but then we'll check again on the client.
          const moduleId = target.filepath;
          target.default = Object.defineProperties(
            (function () {
              throw new Error(
                `Attempted to call the default export of ${moduleId} from the server ` +
                  `but it's on the client. It's not possible to invoke a client function from ` +
                  `the server, it can only be rendered as a Component or passed to props of a ` +
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
          if (target.then) {
            // Use a cached value
            return target.then;
          }
          if (!target.async) {
            // If this module is expected to return a Promise (such as an AsyncModule) then
            // we should resolve that with a client reference that unwraps the Promise on
            // the client.

            const clientReference = Object.defineProperties(({}: any), {
              // Represents the whole Module object instead of a particular import.
              name: {value: '*'},
              $$typeof: {value: CLIENT_REFERENCE},
              filepath: {value: target.filepath},
              async: {value: true},
            });
            const proxy = new Proxy(clientReference, proxyHandlers);

            // Treat this as a resolved Promise for React's use()
            target.status = 'fulfilled';
            target.value = proxy;

            // $FlowFixMe[missing-local-annot]
            const then = (target.then = Object.defineProperties(
              (function then(resolve, reject: any) {
                // Expose to React.
                return Promise.resolve(
                  // $FlowFixMe[incompatible-call] found when upgrading Flow
                  resolve(proxy),
                );
              }: any),
              // If this is not used as a Promise but is treated as a reference to a `.then`
              // export then we should treat it as a reference to that name.
              {
                name: {value: 'then'},
                $$typeof: {value: CLIENT_REFERENCE},
                filepath: {value: target.filepath},
                async: {value: false},
              },
            ));
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
        const reference = Object.defineProperties(
          (function () {
            throw new Error(
              // eslint-disable-next-line react-internal/safe-string-coercion
              `Attempted to call ${String(name)}() from the server but ${String(
                name,
              )} is on the client. ` +
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
        cachedReference = target[name] = new Proxy(
          reference,
          deepProxyHandlers,
        );
      }
      return cachedReference;
    },
    getPrototypeOf(target: Function): Object {
      // Pretend to be a Promise in case anyone asks.
      return PROMISE_PROTOTYPE;
    },
    set: function () {
      throw new Error('Cannot assign to a client module from a server module.');
    },
  };

  // $FlowFixMe[prop-missing] found when upgrading Flow
  const originalCompile = Module.prototype._compile;

  // $FlowFixMe[prop-missing] found when upgrading Flow
  Module.prototype._compile = function (
    this: any,
    content: string,
    filename: string,
  ): void {
    // Do a quick check for the exact string. If it doesn't exist, don't
    // bother parsing.
    if (content.indexOf('use client') === -1) {
      return originalCompile.apply(this, arguments);
    }

    const {body} = acorn.parse(content, {
      ecmaVersion: '2019',
      sourceType: 'source',
    });

    let useClient = false;
    for (let i = 0; i < body.length; i++) {
      const node = body[i];
      if (node.type !== 'ExpressionStatement' || !node.directive) {
        break;
      }
      if (node.directive === 'use client') {
        useClient = true;
        break;
      }
    }

    if (!useClient) {
      return originalCompile.apply(this, arguments);
    }

    const moduleId: string = (url.pathToFileURL(filename).href: any);
    const clientReference = Object.defineProperties(({}: any), {
      // Represents the whole Module object instead of a particular import.
      name: {value: '*'},
      $$typeof: {value: CLIENT_REFERENCE},
      filepath: {value: moduleId},
      async: {value: false},
    });
    // $FlowFixMe[incompatible-call] found when upgrading Flow
    this.exports = new Proxy(clientReference, proxyHandlers);
  };
};
