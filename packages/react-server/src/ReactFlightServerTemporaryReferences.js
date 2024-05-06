/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// eslint-disable-next-line no-unused-vars
export interface TemporaryReference<T> {}

const knownReferences: WeakMap<TemporaryReference<any>, string> = new WeakMap();

export function isTemporaryReference(reference: Object): boolean {
  return knownReferences.has(reference);
}

export function resolveTemporaryReference<T>(
  temporaryReference: TemporaryReference<T>,
): string {
  // $FlowFixMe[incompatible-return]: We'll have already asserted on it.
  return knownReferences.get(temporaryReference);
}

const proxyHandlers = {
  get: function (
    target: Function,
    name: string | symbol,
    receiver: Proxy<Function>,
  ) {
    switch (name) {
      // These names are read by the Flight runtime if you end up using the exports object.
      case '$$typeof':
        // These names are a little too common. We should probably have a way to
        // have the Flight runtime extract the inner target instead.
        return target.$$typeof;
      case 'name':
        return undefined;
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
      case Symbol.toStringTag:
        // $FlowFixMe[prop-missing]
        return Object.prototype[Symbol.toStringTag];
      case 'Provider':
        throw new Error(
          `Cannot render a Client Context Provider on the Server. ` +
            `Instead, you can export a Client Component wrapper ` +
            `that itself renders a Client Context Provider.`,
        );
    }
    throw new Error(
      // eslint-disable-next-line react-internal/safe-string-coercion
      `Cannot access ${String(name)} on the server. ` +
        'You cannot dot into a temporary client reference from a server component. ' +
        'You can only pass the value through to the client.',
    );
  },
  set: function () {
    throw new Error(
      'Cannot assign to a temporary client reference from a server module.',
    );
  },
};

export function createTemporaryReference<T>(id: string): TemporaryReference<T> {
  const reference: TemporaryReference<any> = function () {
    throw new Error(
      // eslint-disable-next-line react-internal/safe-string-coercion
      `Attempted to call a temporary Client Reference from the server but it is on the client. ` +
        `It's not possible to invoke a client function from the server, it can ` +
        `only be rendered as a Component or passed to props of a Client Component.`,
    );
  };
  const wrapper = new Proxy(reference, proxyHandlers);
  registerTemporaryReference(wrapper, id);
  return wrapper;
}

export function registerTemporaryReference(
  object: TemporaryReference<any>,
  id: string,
): void {
  knownReferences.set(object, id);
}
