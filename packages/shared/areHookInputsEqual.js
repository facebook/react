/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warning from 'shared/warning';
import is from './objectIs';

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
    const val1 = arr1[i];
    const val2 = arr2[i];
    if (is(val1, val2)) {
      continue;
    }
    return false;
  }
  return true;
}
