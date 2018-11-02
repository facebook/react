/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warning from 'shared/warning';

export default function areHookInputsEqual(arr1: any[], arr2: any[]) {
  // Don't bother comparing lengths in prod because these arrays should be
  // passed inline.
  if (__DEV__) {
    warning(
      arr1.length === arr2.length,
      'Detected a variable number of hook dependencies. The length of the ' +
        'dependencies array should be constant between renders.\n\n' +
        'Previous: %s\n' +
        'Incoming: %s',
      arr1.join(', '),
      arr2.join(', '),
    );
  }
  for (let i = 0; i < arr1.length; i++) {
    // Inlined Object.is polyfill.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
    const val1 = arr1[i];
    const val2 = arr2[i];
    if (
      (val1 === val2 && (val1 !== 0 || 1 / val1 === 1 / (val2: any))) ||
      (val1 !== val1 && val2 !== val2) // eslint-disable-line no-self-compare
    ) {
      continue;
    }
    return false;
  }
  return true;
}
