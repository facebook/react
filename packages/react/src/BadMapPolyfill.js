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
    // Warn about bad polyfills that don't support frozen objects
    console['warn'](
      'React detected a Map/Set polyfill that cannot handle frozen objects. ' +
        'This might cause issues with React\'s internals.'
    );
    hasBadMapPolyfill = true;
  }
}
