/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';
import warning from 'fbjs/lib/warning';

if (__DEV__) {
  if (
    ExecutionEnvironment.canUseDOM &&
    typeof requestAnimationFrame !== 'function'
  ) {
    warning(
      false,
      'React depends on requestAnimationFrame. Make sure that you load a ' +
        'polyfill in older browsers. https://fb.me/react-polyfills',
    );
  }
}

export default requestAnimationFrame;
