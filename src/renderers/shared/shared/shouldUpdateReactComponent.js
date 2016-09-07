/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule shouldUpdateReactComponent
 * @flow
 */

'use strict';

import type { ReactElement } from 'ReactElementType';

/**
 * Given a `prevElement` and `nextElement`, determines if the existing
 * instance should be updated as opposed to being destroyed or replaced by a new
 * instance. Both arguments are elements. This ensures that this logic can
 * operate on stateless trees without any backing instance.
 *
 * @param {?object} prevElement
 * @param {?object} nextElement
 * @return {boolean} True if the existing instance should be updated.
 * @protected
 */
function shouldUpdateReactComponent(
  prevElement: ReactElement | string | number | null | false,
  nextElement: ReactElement | string | number | null | false,
): boolean {
  if (prevElement === null || prevElement === false) {
    return nextElement === null || nextElement === false;
  }

  if (nextElement === null || nextElement === false) {
    // We already checked that "prevElement === null || prevElement === false"
    // didn't pass so we can just return false and not recompute it
    return false;
  }

  if (typeof prevElement === 'string' || typeof prevElement === 'number') {
    return typeof nextElement === 'string' || typeof nextElement === 'number';
  }

  return (
    typeof nextElement === 'object' &&
    prevElement.type === nextElement.type &&
    prevElement.key === nextElement.key
  );
}

module.exports = shouldUpdateReactComponent;
