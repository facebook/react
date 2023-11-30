/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import ReactVersion from 'shared/ReactVersion';

import {isValidContainer} from 'react-dom-bindings/src/client/ReactDOMContainer';
import {createPortal as createPortalImpl} from 'react-reconciler/src/ReactPortal';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const Dispatcher = ReactDOMSharedInternals.Dispatcher;

import {
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
} from './ReactDOMFloat';
import {
  useFormStatus,
  useFormState,
} from 'react-dom-bindings/src/shared/ReactDOMFormActions';

if (__DEV__) {
  if (
    typeof Map !== 'function' ||
    // $FlowFixMe[prop-missing] Flow incorrectly thinks Map has no prototype
    Map.prototype == null ||
    typeof Map.prototype.forEach !== 'function' ||
    typeof Set !== 'function' ||
    // $FlowFixMe[prop-missing] Flow incorrectly thinks Set has no prototype
    Set.prototype == null ||
    typeof Set.prototype.clear !== 'function' ||
    typeof Set.prototype.forEach !== 'function'
  ) {
    console.error(
      'React depends on Map and Set built-in types. Make sure that you load a ' +
        'polyfill in older browsers. https://reactjs.org/link/react-polyfills',
    );
  }
}

// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
declare function flushSync<R>(fn: () => R): R;
// eslint-disable-next-line no-redeclare
declare function flushSync(): void;
// eslint-disable-next-line no-redeclare
function flushSync<R>(fn: (() => R) | void): R | void {
  // We expect our HostDispatcher to provide an implementation.
  const dispatcher = Dispatcher.current;
  if (dispatcher) {
    return dispatcher.flushSync(fn);
  } else if (fn) {
    // If no implementation is provided we can simply call the function
    return fn();
  }
}

function batchedUpdates<A, R>(fn: (a: A) => R, a: A): R {
  // batchedUpdates is now just a passthrough noop
  return fn(a);
}

function createPortal(
  children: ReactNodeList,
  container: Element | DocumentFragment,
  key: ?string = null,
): React$Portal {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  // TODO: pass ReactDOM portal implementation as third argument
  // $FlowFixMe[incompatible-return] The Flow type is opaque but there's no way to actually create it.
  return createPortalImpl(children, container, null, key);
}

export {
  ReactVersion as version,
  createPortal,
  flushSync,
  batchedUpdates as unstable_batchedUpdates,
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinit,
  preinitModule,
  useFormStatus,
  useFormState,
};
