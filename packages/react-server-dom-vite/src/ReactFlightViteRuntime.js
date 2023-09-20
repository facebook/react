/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const CLIENT_REFERENCE = Symbol.for('react.client.reference');
const SERVER_REFERENCE = Symbol.for('react.server.reference');
const PROMISE_PROTOTYPE = Promise.prototype;

const deepProxyHandlers = {
  get: function (
    target: any,
    name: string,
    _receiver: Proxy<any> | Proxy<any>,
  ) {
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
      case Symbol.toPrimitive.toString():
        // $FlowFixMe[prop-missing]
        return Object.prototype[Symbol.toPrimitive];
      case 'Provider':
        throw new Error(
          `Cannot render a Client Context Provider on the Server. ` +
            `Instead, you can export a Client Component wrapper ` +
            `that itself renders a Client Context Provider.`,
        );
      default:
        break;
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

const proxyHandlers: any = {
  get: function (
    target: Function,
    name: string,
    _receiver: Proxy<Function>,
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
      case Symbol.toPrimitive.toString():
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
            (function then(resolve, _reject) {
              // Expose to React.
              return Promise.resolve(
                // $FlowFixMe[incompatible-call] found when upgrading Flow
                resolve(proxy),
              );
            }: any),
            // If this is not used as a Promise but is treated as a reference to a `.then`
            // export then we should treat it as a reference to that name.
            {
              $$typeof: {value: CLIENT_REFERENCE},
              $$id: {value: target.$$id},
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
      default:
        break;
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
          $$typeof: {value: CLIENT_REFERENCE},
          $$id: {value: target.$$id + '#' + name},
          $$async: {value: target.$$async},
        },
      );
      cachedReference = target[name] = new Proxy(reference, deepProxyHandlers);
    }
    return cachedReference;
  },
  getPrototypeOf(_target: Function): Object {
    // Pretend to be a Promise in case anyone asks.
    return PROMISE_PROTOTYPE;
  },
  set: function () {
    throw new Error('Cannot assign to a client module from a server module.');
  },
};

export function createClientReference(
  moduleId: string,
  name: string,
): Proxy<Function> {
  const clientReference = Object.defineProperties(({}: any), {
    $$typeof: {value: CLIENT_REFERENCE},
    // Represents the whole Module object instead of a particular import.
    $$id: {value: `${moduleId}#${name}`},
    $$async: {value: false},
  });
  return new Proxy(clientReference, proxyHandlers);
}

export function createServerReference(
  fn: Function,
  moduleId: string,
  name: string,
): Function {
  const serverReference = Object.defineProperties(fn, {
    $$typeof: {value: SERVER_REFERENCE},
    // Represents the whole Module object instead of a particular import.
    $$id: {value: `${moduleId}#${name}`},
    $$bound: {value: null},
  });
  return serverReference;
}
