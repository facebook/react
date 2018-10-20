/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_PURE_TYPE} from 'shared/ReactSymbols';

import isValidElementType from 'shared/isValidElementType';
import warningWithoutStack from 'shared/warningWithoutStack';

export default function pure<Props>(
  type: React$ElementType,
  compare?: (oldProps: Props, newProps: Props) => boolean,
) {
  if (__DEV__) {
    if (!isValidElementType(type)) {
      warningWithoutStack(
        false,
        'pure: The first argument must be a component. Instead ' +
          'received: %s',
        type === null ? 'null' : typeof type,
      );
    }
  }
  return {
    $$typeof: REACT_PURE_TYPE,
    type,
    compare: compare === undefined ? null : compare,
  };
}
