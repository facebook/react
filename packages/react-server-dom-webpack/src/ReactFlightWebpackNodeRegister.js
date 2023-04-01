/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const acorn = require('acorn-loose');

const url = require('url');

const Module = require('module');

module.exports = function register() {
  const CLIENT_REFERENCE = Symbol.for('react.client.reference');
  const SERVER_REFERENCE = Symbol.for('react.server.reference');
  const PROMISE_PROTOTYPE = Promise.prototype;

  // Patch bind on the server to ensure that this creates another
  // bound server reference with the additional arguments.
  const originalBind = Function.prototype.bind;
  /*eslint-disable no-extend-native */
  Function.prototype.bind = (function bind(this: any, self: any) {
    // $FlowFixMe[unsupported-syntax]
    const newFn = originalBind.apply(this, arguments);
    if (this.$$typeof === SERVER_REFERENCE) {
      // $FlowFixMe[method-unbinding]
      const args = Array.prototype.slice.call(arguments, 1);
      newFn.$$typeof = SERVER_REFERENCE;
      newFn.$$id = this.$$id;
      newFn.$$bound = this.$$bound ? this.$$bound.concat(args) : args;
    }
    return newFn;
  }: any);

  const deepProxyHandlers = {
    get: function (target: Function, name: string, receiver: Proxy<Function>) {
      switch (name) {
        // These names are read by the Flight runtime if you end up using the exports object.
        case '$$typeof':
          // These names are a little too common. We should probably have a way to
          // have the Flight runtime extract the inner target instead.
          return target.$$typeof;
        case '$$id':
          return target.$$id;
        case '$$async':
          return target.$$async;
        case 'name':
          return target.name;
        case 'displayName':
          return undefined;
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
      // eslint-disable-next-line react-internal/safe-string-coercion
      const expression = String(target.name) + '.' + String(name);
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
    get: function (
      target: Function,
      name: string,
      receiver: Proxy<Function>,
    ): $FlowFixMe {
      switch (name) {
        // These names are read by the Flight runtime if you end up using the exports object.
        case '$$typeof':
          return target.$$typeof;
        case '$$id':
          return target.$$id;
        case '$$async':
          return target.$$async;
        case 'name':
          return target.name;
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
          const moduleId = target.$$id;
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
              $$typeof: {value: CLIENT_REFERENCE},
              // This a placeholder value that tells the client to conditionally use the
              // whole object or just the default export.
              $$id: {value: target.$$id + '#'},
              $$async: {value: target.$$async},
            },
          );
          return true;
        case 'then':
          if (target.then) {
            // Use a cached value
            return target.then;
          }
          if (!target.$$async) {
            // If this module is expected to return a Promise (such as an AsyncModule) then
            // we should resolve that with a client reference that unwraps the Promise on
            // the client.

            const clientReference = Object.defineProperties(({}: any), {
              $$typeof: {value: CLIENT_REFERENCE},
              $$id: {value: target.$$id},
              $$async: {value: true},
            });
            const proxy = new Proxy(clientReference, proxyHandlers);

            // Treat this as a resolved Promise for React's use()
            target.status = 'fulfilled';
            target.value = proxy;

            const then = (target.then = Object.defineProperties(
              (function then(resolve, reject: any) {
                // Expose to React.
                return Promise.resolve(resolve(proxy));
              }: any),
              // If this is not used as a Promise but is treated as a reference to a `.then`
              // export then we should treat it as a reference to that name.
              {
                $$typeof: {value: CLIENT_REFERENCE},
                $$id: {value: target.$$id + '#then'},
                $$async: {value: false},
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
            $$id: {value: target.$$id + '#' + name},
            $$async: {value: target.$$async},
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
    set: function (): empty {
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
    if (
      content.indexOf('use client') === -1 &&
      content.indexOf('use server') === -1
    ) {
      return originalCompile.apply(this, arguments);
    }

    let body;
    try {
      body = acorn.parse(content, {
        ecmaVersion: '2024',
        sourceType: 'source',
      }).body;
    } catch (x) {
      // eslint-disable-next-line react-internal/no-production-logging
      console.error('Error parsing %s %s', url, x.message);
      return originalCompile.apply(this, arguments);
    }

    let useClient = false;
    let useServer = false;
    for (let i = 0; i < body.length; i++) {
      const node = body[i];
      if (node.type !== 'ExpressionStatement' || !node.directive) {
        break;
      }
      if (node.directive === 'use client') {
        useClient = true;
      }
      if (node.directive === 'use server') {
        useServer = true;
      }
    }

    if (!useClient && !useServer) {
      return originalCompile.apply(this, arguments);
    }

    if (useClient && useServer) {
      throw new Error(
        'Cannot have both "use client" and "use server" directives in the same file.',
      );
    }

    if (useClient) {
      const moduleId: string = (url.pathToFileURL(filename).href: any);
      const clientReference = Object.defineProperties(({}: any), {
        $$typeof: {value: CLIENT_REFERENCE},
        // Represents the whole Module object instead of a particular import.
        $$id: {value: moduleId},
        $$async: {value: false},
      });
      // $FlowFixMe[incompatible-call] found when upgrading Flow
      this.exports = new Proxy(clientReference, proxyHandlers);
    }

    if (useServer) {
      originalCompile.apply(this, arguments);

      const moduleId: string = (url.pathToFileURL(filename).href: any);

      const exports = this.exports;

      // This module is imported server to server, but opts in to exposing functions by
      // reference. If there are any functions in the export.
      if (typeof exports === 'function') {
        // The module exports a function directly,
        Object.defineProperties((exports: any), {
          $$typeof: {value: SERVER_REFERENCE},
          // Represents the whole Module object instead of a particular import.
          $$id: {value: moduleId},
          $$bound: {value: null},
        });
      } else {
        const keys = Object.keys(exports);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = exports[keys[i]];
          if (typeof value === 'function') {
            Object.defineProperties((value: any), {
              $$typeof: {value: SERVER_REFERENCE},
              $$id: {value: moduleId + '#' + key},
              $$bound: {value: null},
            });
          }
        }
      }
    }
  };
};
