/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type CancelableCallback<A, R> = {
  callback: (...A) => R,
  cancel: () => void,
};

const makeCancelable = <A, R>(
  callback: (...A) => R,
): CancelableCallback<A, R> => {
  let hasCanceled = false;

  const wrappedCallback = (...args: A): R => {
    if (hasCanceled) {
      return;
    }
    callback(...args);
  };

  return {
    callback: wrappedCallback,
    cancel() {
      hasCanceled = true;
    },
  };
};

export default makeCancelable;
