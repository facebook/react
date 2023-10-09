/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

export let hasBadMapPolyfill: boolean;

if (__DEV__) {
  hasBadMapPolyfill = false;
  try {
    const frozenObject = Object.freeze({});
    /* eslint-disable no-new */
    new Map([[frozenObject, null]]);
    new Set([frozenObject]);
    /* eslint-enable no-new */
  } catch (e) {
    hasBadMapPolyfill = true;
    console.warn(
      'Detected a bad Map/Set polyfill. Consider using a reliable polyfill or updating the current one.',
    );
  }
}
