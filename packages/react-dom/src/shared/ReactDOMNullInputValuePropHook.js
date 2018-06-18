/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ReactDebugCurrentFrame} from 'shared/ReactGlobalSharedState';
import warning from 'shared/warning';

let didWarnValueNull = false;

function getStackAddendum() {
  const stack = ReactDebugCurrentFrame.getStackAddendum();
  return stack != null ? stack : '';
}

export function validateProperties(type, props) {
  if (type !== 'input' && type !== 'textarea' && type !== 'select') {
    return;
  }

  if (props != null && props.value === null && !didWarnValueNull) {
    didWarnValueNull = true;
    if (type === 'select' && props.multiple) {
      warning(
        false,
        '`value` prop on `%s` should not be null. ' +
          'Consider using an empty array when `multiple` is set to `true` ' +
          'to clear the component or `undefined` for uncontrolled components.%s',
        type,
        getStackAddendum(),
      );
    } else {
      warning(
        false,
        '`value` prop on `%s` should not be null. ' +
          'Consider using an empty string to clear the component or `undefined` ' +
          'for uncontrolled components.%s',
        type,
        getStackAddendum(),
      );
    }
  }
}
