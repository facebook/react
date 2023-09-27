/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableTaint} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';

const TaintRegistry = ReactSharedInternals.TaintRegistry;

interface Reference {}

const TypedArrayConstructor = Object.getPrototypeOf(Uint8Array.prototype);

const defaultMessage =
  'A tainted value was attempted to be serialized to a Client Component or Action closure. ' +
  'This would leak it to the client.';

export function taintValue(
  message: ?string,
  lifetime: Reference,
  value: string | bigint | $ArrayBufferView,
): void {
  if (!enableTaint) {
    throw new Error('Not implemented.');
  }
  // eslint-disable-next-line react-internal/safe-string-coercion
  message = '' + (message || defaultMessage);
  if (
    lifetime === null ||
    (typeof lifetime !== 'object' && typeof lifetime !== 'function')
  ) {
    throw new Error(
      'To taint a value, a life time must be defined by passing an object that holds ' +
        'the value.',
    );
  }
  if (typeof value === 'string') {
    return;
  }
  if (typeof value === 'bigint') {
    return;
  }
  if (value instanceof TypedArrayConstructor) {
    return;
  }
  if (value instanceof DataView) {
    return;
  }
  const kind = value === null ? 'null' : typeof value;
  if (kind === 'object' || kind === 'function') {
    throw new Error(
      'taintValue cannot taint objects or functions. Try taintShallowObject instead.',
    );
  }
  throw new Error(
    'Cannot taint a ' +
      kind +
      ' because the value is too general and cannot be ' +
      'a secret by',
  );
}

export function taintShallowObject(message: ?string, object: Reference): void {
  if (!enableTaint) {
    throw new Error('Not implemented.');
  }
  // eslint-disable-next-line react-internal/safe-string-coercion
  message = '' + (message || defaultMessage);
  if (typeof object === 'string' || typeof object === 'bigint') {
    throw new Error(
      'Only objects or functions can be passed to taintShallowObject. Try taintValue instead.',
    );
  }
  if (
    object === null ||
    (typeof object !== 'object' && typeof object !== 'function')
  ) {
    throw new Error(
      'Only objects or functions can be passed to taintShallowObject.',
    );
  }
  // TODO
}
